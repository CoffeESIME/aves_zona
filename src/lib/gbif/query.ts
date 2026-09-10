import { serverConfig } from '@/src/lib/config';
import type { AppliedFilters } from '@/src/types/biodiversity';

const TAXON_KEYS: Partial<Record<AppliedFilters['taxon'], { parameter: 'classKey' | 'kingdomKey'; key: string }>> = {
  birds: { parameter: 'classKey', key: '212' },
  plants: { parameter: 'kingdomKey', key: '6' },
  insects: { parameter: 'classKey', key: '216' },
  fungi: { parameter: 'kingdomKey', key: '5' },
  mammals: { parameter: 'classKey', key: '359' },
  herps: { parameter: 'classKey', key: '358,131' },
};

// Museum/collection and machine evidence complements iNaturalist while avoiding
// the iNaturalist human-observation dataset mirrored by GBIF.
export const COMPLEMENTARY_RECORD_TYPES = [
  'PRESERVED_SPECIMEN',
  'MATERIAL_SAMPLE',
  'LIVING_SPECIMEN',
  'MACHINE_OBSERVATION',
] as const;

export function buildGBIFParams(filters: AppliedFilters): URLSearchParams {
  const params = new URLSearchParams({
    geoDistance: `${serverConfig.center.lat},${serverConfig.center.lng},${filters.radius}km`,
    hasCoordinate: 'true',
    hasGeospatialIssue: 'false',
    occurrenceStatus: 'PRESENT',
  });
  COMPLEMENTARY_RECORD_TYPES.forEach((type) => params.append('basisOfRecord', type));

  const taxon = TAXON_KEYS[filters.taxon];
  if (taxon) {
    taxon.key.split(',').forEach((key) => params.append(taxon.parameter, key));
  }
  if (filters.from || filters.to) {
    params.set('eventDate', `${filters.from ?? '1500-01-01'},${filters.to ?? new Date().toISOString().slice(0, 10)}`);
  }
  return params;
}

export function buildGBIFUrl(path: string, params: URLSearchParams): URL {
  const base = serverConfig.gbifApiBaseUrl.endsWith('/')
    ? serverConfig.gbifApiBaseUrl
    : `${serverConfig.gbifApiBaseUrl}/`;
  const url = new URL(path.replace(/^\//, ''), base);
  for (const [key, value] of params.entries()) url.searchParams.append(key, value);
  return url;
}
