import { serverConfig } from '@/src/lib/config';
import { TAXON_CONFIG } from '@/src/lib/taxonomy';
import type { AppliedFilters } from '@/src/types/biodiversity';

export function buildObservationParams(filters: AppliedFilters): URLSearchParams {
  const params = new URLSearchParams({
    lat: String(serverConfig.center.lat),
    lng: String(serverConfig.center.lng),
    radius: String(filters.radius),
    geo: 'true',
    mappable: 'true',
    locale: 'es',
    preferred_place_id: '6793',
  });

  const iconicTaxa = TAXON_CONFIG[filters.taxon].iconicTaxa;
  if (iconicTaxa) params.set('iconic_taxa', iconicTaxa.join(','));
  if (filters.quality === 'verifiable') params.set('verifiable', 'true');
  else params.set('quality_grade', filters.quality);
  if (filters.from) params.set('d1', filters.from);
  if (filters.to) params.set('d2', filters.to);
  return params;
}

export function buildINaturalistUrl(path: string, params: URLSearchParams): URL {
  const base = serverConfig.apiBaseUrl.endsWith('/')
    ? serverConfig.apiBaseUrl
    : `${serverConfig.apiBaseUrl}/`;
  const url = new URL(path.replace(/^\//, ''), base);
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of sorted) url.searchParams.append(key, value);
  return url;
}
