import { getEBirdObservations, getEBirdSpecies, getEBirdSummary } from '@/src/lib/ebird/service';
import { getGBIFObservations, getGBIFSpecies, getGBIFSummary } from '@/src/lib/gbif/service';
import { getObservations as getINaturalistObservations, getSpecies as getINaturalistSpecies, getSummary as getINaturalistSummary } from '@/src/lib/inaturalist/service';
import type { AppliedFilters, ObservationsResponse, SpeciesItem, SpeciesResponse, SummaryResponse } from '@/src/types/biodiversity';

function active(filters: AppliedFilters, id: 'inaturalist' | 'gbif' | 'ebird') {
  return filters.sources.includes(id);
}

async function collect<T>(requests: Array<Promise<T> | null>) {
  const results = await Promise.allSettled(requests);
  const responses: T[] = [];
  const warnings: string[] = [];
  const labels = ['iNaturalist', 'GBIF', 'eBird'];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value != null) responses.push(result.value);
    if (result.status === 'rejected') warnings.push(`${labels[index]} no está disponible. Los resultados incluyen solo las fuentes que respondieron.`);
  });
  if (!responses.length) {
    const failure = results.find(result => result.status === 'rejected');
    throw failure?.status === 'rejected' ? failure.reason : new Error('No hay fuentes seleccionadas.');
  }
  return { responses, warnings };
}

export async function getObservations(filters: AppliedFilters): Promise<ObservationsResponse> {
  const { responses, warnings } = await collect([
    active(filters, 'inaturalist') ? getINaturalistObservations(filters) : null,
    active(filters, 'gbif') ? getGBIFObservations(filters) : null,
    active(filters, 'ebird') ? getEBirdObservations(filters) : null,
  ]);
  const selected = responses.filter((item): item is ObservationsResponse => item != null);
  if (selected.length === 1) return { ...selected[0]!, meta: { ...selected[0]!.meta, warnings } };
  const providers = selected.flatMap((item) => item.meta.providers ?? []);
  return {
    meta: {
      warnings,
      center: selected[0]!.meta.center,
      radiusKm: filters.radius,
      filters,
      source: selected.map(item => item.meta.source).join(' + '),
      providers,
      generatedAt: new Date().toISOString(),
      totalAvailable: providers.reduce((sum, item) => sum + item.totalAvailable, 0),
      returned: providers.reduce((sum, item) => sum + item.returned, 0),
      truncated: providers.some((item) => item.truncated),
    },
    geojson: { type: 'FeatureCollection', features: selected.flatMap((item) => item.geojson.features) },
  };
}

export async function getSpecies(filters: AppliedFilters, order: 'asc' | 'desc'): Promise<SpeciesResponse> {
  const { responses, warnings } = await collect([
    active(filters, 'inaturalist') ? getINaturalistSpecies(filters, order) : null,
    active(filters, 'gbif') ? getGBIFSpecies(filters, order) : null,
    active(filters, 'ebird') ? getEBirdSpecies(filters, order) : null,
  ]);
  const selected = responses.filter((item): item is SpeciesResponse => item != null);
  if (selected.length === 1) return { ...selected[0]!, meta: { ...selected[0]!.meta, warnings } };
  const merged = new Map<string, SpeciesItem>();
  for (const item of selected.flatMap((response) => response.species)) {
    const key = item.scientificName.toLowerCase();
    const current = merged.get(key);
    if (current) {
      current.observationCount += item.observationCount;
      current.sourceLabel = [...new Set([...current.sourceLabel.split(' + '), item.sourceLabel])].join(' + ');
      if (!current.photoUrl && item.photoUrl) {
        current.photoUrl = item.photoUrl;
        current.photoAttribution = item.photoAttribution;
        current.photoLicense = item.photoLicense;
      }
    } else merged.set(key, { ...item });
  }
  const species = [...merged.values()].sort((a, b) => order === 'asc' ? a.observationCount - b.observationCount : b.observationCount - a.observationCount).slice(0, 12);
  const providers = selected.flatMap((item) => item.meta.providers ?? []);
  return {
    meta: {
      warnings,
      center: selected[0]!.meta.center, radiusKm: filters.radius, filters,
      source: selected.map(item => item.meta.source).join(' + '), providers, generatedAt: new Date().toISOString(),
      totalAvailable: selected.reduce((sum, item) => sum + item.totalSpecies, 0),
      returned: species.length, truncated: selected.some((item) => item.meta.truncated),
    },
    totalSpecies: merged.size,
    species,
  };
}

function earliest(values: Array<string | null>) {
  return values.filter((value): value is string => value != null).sort()[0] ?? null;
}
function latest(values: Array<string | null>) {
  return values.filter((value): value is string => value != null).sort().at(-1) ?? null;
}

export async function getSummary(filters: AppliedFilters): Promise<SummaryResponse> {
  const { responses, warnings } = await collect([
    active(filters, 'inaturalist') ? getINaturalistSummary(filters) : null,
    active(filters, 'gbif') ? getGBIFSummary(filters) : null,
    active(filters, 'ebird') ? getEBirdSummary(filters) : null,
  ]);
  const selected = responses.filter((item): item is SummaryResponse => item != null);
  if (selected.length === 1) return { ...selected[0]!, caveats: [...warnings, ...selected[0]!.caveats] };
  return {
    selected: {
      speciesCount: selected.reduce((sum, item) => sum + item.selected.speciesCount, 0),
      observationCount: selected.reduce((sum, item) => sum + item.selected.observationCount, 0),
      observerCount: null,
      groupCount: Math.max(...selected.map((item) => item.selected.groupCount)),
      earliestObservation: earliest(selected.map((item) => item.selected.earliestObservation)),
      latestObservation: latest(selected.map((item) => item.selected.latestObservation)),
      researchGradeCount: null,
    },
    rings: selected[0]!.rings.map((ring, index) => {
      const cumulativeSpecies = selected.reduce((sum, response) => sum + (response.rings[index]?.cumulativeSpecies ?? 0), 0);
      const previous = index === 0 ? null : selected.reduce((sum, response) => sum + (response.rings[index - 1]?.cumulativeSpecies ?? 0), 0);
      return { radiusKm: ring.radiusKm, cumulativeSpecies, addedSpecies: previous == null ? null : Math.max(0, cumulativeSpecies - previous) };
    }),
    caveats: [
      ...warnings,
      ...selected.flatMap((item) => item.caveats),
      'Al combinar fuentes, las especies se suman por proveedor: un mismo taxón puede estar representado en varias y el total no es un inventario deduplicado.',
    ],
  };
}
