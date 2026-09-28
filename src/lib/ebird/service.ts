import { z } from 'zod';
import { distance } from '@turf/turf';
import { serverConfig } from '@/src/lib/config';
import { buildRings } from '@/src/lib/rings';
import { RADII, type AppliedFilters, type ObservationsResponse, type SpeciesResponse, type SummaryResponse } from '@/src/types/biodiversity';

const schema = z.array(z.object({
  speciesCode: z.string(), comName: z.string(), sciName: z.string(),
  locId: z.string(), locName: z.string(), obsDt: z.string(),
  lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
  subId: z.string(), obsValid: z.boolean(),
}));
type Record = z.infer<typeof schema>[number];
export class EBirdError extends Error {}
const LIMIT = 10000;
const cache = new Map<number, { key: string; expires: number; promise: Promise<Record[]> }>();

async function records(radius: number): Promise<Record[]> {
  const key = process.env.EBIRD_API_KEY?.trim();
  if (!key) throw new EBirdError('eBird no está configurado en el servidor.');
  const center = serverConfig.center;
  const cacheKey = `${center.lat},${center.lng}:${key}`;
  const cached = cache.get(radius);
  if (cached?.key === cacheKey && cached.expires > Date.now()) return cached.promise;
  const promise = (async () => {
    try {
      const params = new URLSearchParams({ lat: String(center.lat), lng: String(center.lng), dist: String(radius), back: '30', maxResults: String(LIMIT), includeProvisional: 'false', sppLocale: 'es_MX' });
      const response = await fetch(`https://api.ebird.org/v2/data/obs/geo/recent?${params}`, {
        headers: { 'X-eBirdApiToken': key, Accept: 'application/json' },
        signal: AbortSignal.timeout(12000), cache: 'no-store',
      });
      if (!response.ok) throw new EBirdError('No se pudo consultar eBird; verifica la configuración o intenta más tarde.');
      return schema.parse(await response.json());
    } catch (error) {
      cache.delete(radius);
      if (error instanceof EBirdError) throw error;
      throw new EBirdError('eBird no respondió correctamente. Intenta más tarde.');
    }
  })();
  cache.set(radius, { key: cacheKey, expires: Date.now() + 300000, promise });
  return promise;
}

export function filterRecords(rows: Record[], filters: AppliedFilters) {
  if (filters.taxon !== 'all' && filters.taxon !== 'birds') return [];
  return rows.filter(row => {
    const day = row.obsDt.slice(0, 10);
    return row.obsValid && (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to)
      && distance([serverConfig.center.lng, serverConfig.center.lat], [row.lng, row.lat]) <= filters.radius;
  });
}
async function selected(filters: AppliedFilters) {
  const rows = filters.taxon === 'all' || filters.taxon === 'birds' ? await records(filters.radius) : [];
  return { rows: filterRecords(rows, filters), truncated: rows.length >= LIMIT };
}
function meta(filters: AppliedFilters, count: number, truncated: boolean) {
  return { center: serverConfig.center, radiusKm: filters.radius, filters, source: 'eBird',
    providers: [{ id: 'ebird' as const, label: 'eBird', totalAvailable: count, returned: count, truncated }],
    generatedAt: new Date().toISOString(), totalAvailable: count, returned: count, truncated };
}
export async function getEBirdObservations(filters: AppliedFilters): Promise<ObservationsResponse> {
  const { rows, truncated } = await selected(filters);
  return { meta: meta(filters, rows.length, truncated), geojson: { type: 'FeatureCollection', features: rows.map(row => ({
    type: 'Feature', id: `ebird:${row.subId}:${row.speciesCode}`,
    geometry: { type: 'Point', coordinates: [row.lng, row.lat] },
    properties: { id: `${row.subId}:${row.speciesCode}`, source: 'ebird', sourceLabel: 'eBird',
      datasetName: 'eBird · Cornell Lab of Ornithology', recordType: 'Registro reciente por especie; ubicación de la lista',
      observedOn: row.obsDt.slice(0, 10), qualityGrade: 'Validado por eBird', iconicGroup: 'birds',
      commonName: row.comName, scientificName: row.sciName, taxonId: null, observerName: null,
      photoUrl: null, photoAttribution: null, photoLicense: null, observationUrl: `https://ebird.org/checklist/${encodeURIComponent(row.subId)}` },
  })) } };
}
export async function getEBirdSpecies(filters: AppliedFilters, order: 'asc' | 'desc'): Promise<SpeciesResponse> {
  const { rows, truncated } = await selected(filters);
  const counts = new Map<string, { row: Record; count: number }>();
  for (const row of rows) counts.set(row.speciesCode, { row, count: (counts.get(row.speciesCode)?.count ?? 0) + 1 });
  const species = [...counts.values()].sort((a, b) => order === 'asc' ? a.count - b.count : b.count - a.count).slice(0, 12).map(({row, count}) => ({
    taxonId: `ebird:${row.speciesCode}`, source: 'ebird' as const, sourceLabel: 'eBird', commonName: row.comName,
    scientificName: row.sciName, iconicGroup: 'birds' as const, observationCount: count,
    photoUrl: null, photoAttribution: null, photoLicense: null, taxonUrl: `https://ebird.org/species/${encodeURIComponent(row.speciesCode)}`,
  }));
  return { meta: { ...meta(filters, counts.size, truncated || counts.size > 12), returned: species.length }, totalSpecies: counts.size, species };
}
export async function getEBirdSummary(filters: AppliedFilters): Promise<SummaryResponse> {
  const all = filters.taxon === 'all' || filters.taxon === 'birds' ? await records(filters.radius) : [];
  const ringCounts = await Promise.all(RADII.map(async radius => {
    const recordsInRing = filters.taxon === 'all' || filters.taxon === 'birds' ? await records(radius) : [];
    return new Set(filterRecords(recordsInRing, { ...filters, radius }).map(row => row.speciesCode)).size;
  }));
  const rows = filterRecords(all, filters);
  const dates = rows.map(row => row.obsDt.slice(0, 10)).sort();
  return { selected: { speciesCount: new Set(rows.map(row => row.speciesCode)).size, observationCount: rows.length,
    observerCount: null, groupCount: rows.length ? 1 : 0, earliestObservation: dates[0] ?? null,
    latestObservation: dates.at(-1) ?? null, researchGradeCount: null },
    rings: buildRings(ringCounts),
    caveats: ['eBird aporta solo aves de los últimos 30 días y el registro más reciente por especie en cada radio; no es un inventario completo ni mide frecuencia o abundancia.',
      'Las fechas filtran esos registros recientes; no recuperan avistamientos anteriores de la misma especie. La calidad de iNaturalist no se aplica a eBird. Las coordenadas corresponden a la ubicación de la lista.',
      ...(all.length >= LIMIT ? ['eBird alcanzó el límite de resultados; los recuentos son mínimos.'] : [])] };
}
