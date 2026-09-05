import type { Feature, Point } from 'geojson';
import { serverConfig } from '@/src/lib/config';
import type {
  AppliedFilters,
  ObservationProperties,
  ObservationsResponse,
  RadiusKm,
  SpeciesResponse,
  SummaryResponse,
} from '@/src/types/biodiversity';
import { RADII } from '@/src/types/biodiversity';
import { buildRings } from '@/src/lib/rings';
import { fetchObservationPage, fetchObserverCount, fetchSpeciesCounts } from './client';
import { normalizeObservation, normalizeSpecies } from './normalize';
import { buildObservationParams } from './query';

const metaBase = (filters: AppliedFilters, totalAvailable: number, returned: number) => ({
  center: serverConfig.center,
  radiusKm: filters.radius,
  filters,
  source: 'iNaturalist' as const,
  generatedAt: new Date().toISOString(),
  totalAvailable,
  returned,
  truncated: returned < totalAvailable,
});

export async function getObservations(filters: AppliedFilters): Promise<ObservationsResponse> {
  const baseParams = buildObservationParams(filters);
  const features: Array<Feature<Point, ObservationProperties>> = [];
  let totalAvailable = 0;
  let idAbove: number | null = null;

  while (features.length < serverConfig.maxObservations) {
    const params = new URLSearchParams(baseParams);
    params.set('per_page', String(Math.min(200, serverConfig.maxObservations - features.length)));
    params.set('order_by', 'id');
    params.set('order', 'asc');
    if (idAbove) params.set('id_above', String(idAbove));

    const page = await fetchObservationPage(params);
    totalAvailable = page.total_results;
    if (page.results.length === 0) break;
    for (const item of page.results) {
      const feature = normalizeObservation(item);
      if (feature) features.push(feature);
    }
    const last = page.results.at(-1);
    if (!last || page.results.length < 200) break;
    idAbove = last.id;
  }

  return {
    meta: metaBase(filters, totalAvailable, features.length),
    geojson: { type: 'FeatureCollection', features },
  };
}

export async function getSpecies(
  filters: AppliedFilters,
  order: 'asc' | 'desc' = 'desc',
): Promise<SpeciesResponse> {
  const params = buildObservationParams(filters);
  params.set('per_page', order === 'asc' ? '1' : '12');
  const first = await fetchSpeciesCounts(params);
  let response = first;
  if (order === 'asc' && first.total_results > 0) {
    params.set('per_page', '12');
    params.set('page', String(Math.ceil(first.total_results / 12)));
    response = await fetchSpeciesCounts(params);
  }
  const species = response.results.map(normalizeSpecies);
  if (order === 'asc') species.reverse();
  return {
    meta: metaBase(filters, response.total_results, species.length),
    totalSpecies: first.total_results,
    species,
  };
}

async function countAtRadius(filters: AppliedFilters, radius: RadiusKm) {
  const params = buildObservationParams({ ...filters, radius });
  params.set('per_page', '1');
  return (await fetchSpeciesCounts(params)).total_results;
}

async function observationDate(filters: AppliedFilters, order: 'asc' | 'desc') {
  const params = buildObservationParams(filters);
  params.set('per_page', '1');
  params.set('order_by', 'observed_on');
  params.set('order', order);
  const response = await fetchObservationPage(params);
  return { total: response.total_results, date: response.results[0]?.observed_on ?? null };
}

export async function getSummary(filters: AppliedFilters): Promise<SummaryResponse> {
  const ringCounts = await Promise.all(RADII.map((radius) => countAtRadius(filters, radius)));
  const observerParams = buildObservationParams(filters);
  observerParams.set('per_page', '1');

  const speciesParams = buildObservationParams(filters);
  speciesParams.set('per_page', '500');

  const [earliest, latest, observers, speciesSample] = await Promise.all([
    observationDate(filters, 'asc'),
    observationDate(filters, 'desc'),
    fetchObserverCount(observerParams),
    fetchSpeciesCounts(speciesParams),
  ]);

  let researchGradeCount: number | null = filters.quality === 'research' ? earliest.total : 0;
  if (filters.quality === 'verifiable') {
    const researchParams = buildObservationParams({ ...filters, quality: 'research' });
    researchParams.set('per_page', '1');
    researchGradeCount = (await fetchObservationPage(researchParams)).total_results;
  }

  const groups = new Set(speciesSample.results.map((item) => normalizeSpecies(item).iconicGroup));
  return {
    selected: {
      speciesCount: ringCounts[RADII.indexOf(filters.radius)] ?? 0,
      observationCount: earliest.total,
      observerCount: observers.total_results,
      groupCount: groups.size,
      earliestObservation: earliest.date,
      latestObservation: latest.date,
      researchGradeCount,
    },
    rings: buildRings(ringCounts),
    caveats: [
      'Los registros reflejan observaciones compartidas, no un inventario completo.',
      'Los anillos tienen áreas diferentes y no deben compararse como unidades equivalentes.',
    ],
  };
}
