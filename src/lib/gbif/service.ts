import type { Feature, Point } from 'geojson';
import { serverConfig } from '@/src/lib/config';
import { buildRings } from '@/src/lib/rings';
import { RADII, type AppliedFilters, type LossCategory, type LossesResponse, type ObservationProperties, type ObservationsResponse, type RadiusKm, type SpeciesItem, type SpeciesResponse, type SummaryResponse, type TaxonGroup } from '@/src/types/biodiversity';
import { fetchGBIFOccurrences } from './client';
import { licensedGBIFPhoto, normalizeGBIFObservation } from './normalize';
import { buildGBIFParams } from './query';
import type { RawGBIFOccurrence } from './schemas';

function forcedGroup(filters: AppliedFilters): TaxonGroup | undefined {
  if (filters.taxon === 'birds' || filters.taxon === 'plants' || filters.taxon === 'insects' || filters.taxon === 'fungi' || filters.taxon === 'mammals' || filters.taxon === 'herps') return filters.taxon;
  return undefined;
}

function meta(filters: AppliedFilters, totalAvailable: number, returned: number) {
  return {
    center: serverConfig.center,
    radiusKm: filters.radius,
    filters,
    source: 'GBIF' as const,
    providers: [{ id: 'gbif' as const, label: 'GBIF', totalAvailable, returned, truncated: returned < totalAvailable }],
    generatedAt: new Date().toISOString(),
    totalAvailable,
    returned,
    truncated: returned < totalAvailable,
  };
}

export async function getGBIFObservations(filters: AppliedFilters): Promise<ObservationsResponse> {
  const base = buildGBIFParams(filters);
  const features: Array<Feature<Point, ObservationProperties>> = [];
  let totalAvailable = 0;
  let offset = 0;
  let scanned = 0;
  while (scanned < serverConfig.maxGbifObservations) {
    const params = new URLSearchParams(base);
    const limit = Math.min(300, serverConfig.maxGbifObservations - scanned);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    const page = await fetchGBIFOccurrences(params);
    totalAvailable = page.count;
    scanned += page.results.length;
    for (const item of page.results) {
      const feature = normalizeGBIFObservation(item, forcedGroup(filters));
      if (feature && (filters.taxon !== 'other' || feature.properties.iconicGroup === 'other')) features.push(feature);
    }
    if (page.endOfRecords || page.results.length < limit) break;
    offset += page.results.length;
  }
  return { meta: meta(filters, totalAvailable, features.length), geojson: { type: 'FeatureCollection', features } };
}

async function gbifCounts(filters: AppliedFilters, radius: RadiusKm) {
  const params = buildGBIFParams({ ...filters, radius });
  params.set('limit', '0');
  params.set('facet', 'speciesKey');
  params.set('facetLimit', '5000');
  const response = await fetchGBIFOccurrences(params);
  return { observations: response.count, species: response.facets[0]?.counts.length ?? 0 };
}

export async function getGBIFSummary(filters: AppliedFilters): Promise<SummaryResponse> {
  const counts = await Promise.all(RADII.map((radius) => gbifCounts(filters, radius)));
  const selected = counts[RADII.indexOf(filters.radius)] ?? { observations: 0, species: 0 };
  return {
    selected: {
      speciesCount: selected.species,
      observationCount: selected.observations,
      observerCount: null,
      groupCount: filters.taxon === 'all' ? 0 : 1,
      earliestObservation: null,
      latestObservation: null,
      researchGradeCount: null,
    },
    rings: buildRings(counts.map((item) => item.species)),
    caveats: [
      'GBIF aporta ejemplares de colección, muestras, sensores y colecciones vivas; el filtro de calidad de iNaturalist no se aplica a estos registros.',
      'La riqueza de GBIF usa facetas de especie y puede quedar limitada si supera 5,000 taxones por radio.',
    ],
  };
}

export async function getGBIFSpecies(filters: AppliedFilters, order: 'asc' | 'desc'): Promise<SpeciesResponse> {
  const observations = await getGBIFObservations(filters);
  const grouped = new Map<string, SpeciesItem>();
  for (const feature of observations.geojson.features) {
    const item = feature.properties;
    const key = item.scientificName.toLowerCase();
    const current = grouped.get(key);
    if (current) current.observationCount += 1;
    else grouped.set(key, {
      taxonId: item.taxonId ?? `gbif-name:${key}`,
      source: 'gbif', sourceLabel: 'GBIF', commonName: item.commonName,
      scientificName: item.scientificName, iconicGroup: item.iconicGroup, observationCount: 1,
      photoUrl: item.photoUrl, photoAttribution: item.photoAttribution, photoLicense: item.photoLicense,
      taxonUrl: item.observationUrl,
    });
  }
  const species = [...grouped.values()].sort((a, b) => order === 'asc' ? a.observationCount - b.observationCount : b.observationCount - a.observationCount).slice(0, 12);
  return { meta: meta(filters, grouped.size, species.length), totalSpecies: grouped.size, species };
}

const LOSS_CATEGORIES = ['EXTINCT', 'EXTINCT_IN_THE_WILD', 'REGIONALLY_EXTINCT'] as const;

export async function getLosses(radius: RadiusKm): Promise<LossesResponse> {
  const params = new URLSearchParams({
    geoDistance: `${serverConfig.center.lat},${serverConfig.center.lng},${radius}km`,
    hasCoordinate: 'true', hasGeospatialIssue: 'false', occurrenceStatus: 'PRESENT', limit: '300',
  });
  LOSS_CATEGORIES.forEach((category) => params.append('iucnRedListCategory', category));
  const response = await fetchGBIFOccurrences(params);
  const grouped = new Map<string, { record: RawGBIFOccurrence; count: number }>();
  for (const record of response.results) {
    const key = String(record.speciesKey ?? record.taxonKey ?? record.species ?? record.scientificName ?? record.key);
    const current = grouped.get(key);
    if (!current) grouped.set(key, { record, count: 1 });
    else {
      current.count += 1;
      if ((record.eventDate ?? '') > (current.record.eventDate ?? '')) current.record = record;
    }
  }
  const species = [...grouped.entries()].map(([key, { record, count }]) => {
    const photo = licensedGBIFPhoto(record);
    return {
      key,
      scientificName: record.species ?? record.scientificName ?? 'Taxón sin identificar',
      commonName: record.vernacularName ?? null,
      category: LOSS_CATEGORIES.includes(record.iucnRedListCategory as LossCategory) ? record.iucnRedListCategory as LossCategory : 'REGIONALLY_EXTINCT' as const,
      lastRecorded: record.eventDate ?? (record.year ? `${record.year}-01-01` : null),
      datasetName: record.datasetTitle ?? null,
      occurrenceCount: count,
      photoUrl: photo.url,
      photoAttribution: photo.attribution,
      photoLicense: photo.license,
      evidenceUrl: `https://www.gbif.org/occurrence/${record.key}`,
    };
  });
  return {
    meta: { center: serverConfig.center, radiusKm: radius, source: 'GBIF', generatedAt: new Date().toISOString(), totalOccurrences: response.count },
    species,
    caveats: [
      'La categoría es global o regional según IUCN y llega a través de GBIF; no equivale automáticamente a extinción dentro de este radio.',
      'Cero coincidencias no demuestra que nunca hayan ocurrido extirpaciones locales. Esa afirmación exige literatura o inventarios históricos curados.',
      'Sólo se muestran imágenes cuando GBIF entrega una licencia identificable.',
    ],
  };
}
