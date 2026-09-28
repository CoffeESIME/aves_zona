import { z } from 'zod';
import { serverConfig } from '@/src/lib/config';
import type { BirdDetails, BirdMedia } from '@/src/types/bird-details';

const safeUrl = z.string().url().refine(value => new URL(value).protocol === 'https:');
const photoSchema = z.object({ id: z.number(), medium_url: safeUrl.optional(), url: safeUrl.optional(), attribution: z.string().nullish(), license_code: z.string().nullish() });
const statusSchema = z.object({ status: z.string(), authority: z.string().nullish(), url: z.string().nullish(), place: z.object({ display_name: z.string().optional(), name: z.string() }).nullish() });
const taxonSchema = z.object({ id: z.number(), name: z.string(), rank: z.string(), iconic_taxon_name: z.string().optional(), is_active: z.boolean().optional(), taxon_photos: z.array(z.object({ photo: photoSchema })).optional(), conservation_statuses: z.array(statusSchema).optional() });
const labels: Record<string, string> = { LC: 'Preocupación menor', NT: 'Casi amenazada', VU: 'Vulnerable', EN: 'En peligro', CR: 'En peligro crítico', EW: 'Extinta en estado silvestre', EX: 'Extinta', DD: 'Datos insuficientes', NE: 'No evaluada' };
const allowedLicenses = new Set(['cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd']);
async function request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${serverConfig.apiBaseUrl}/${path}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } });
  if (!response.ok) throw new Error('No se pudo consultar iNaturalist.');
  return schema.parse(await response.json());
}
export function normalizeStatuses(statuses: z.infer<typeof statusSchema>[]): BirdDetails['conservation'] {
  return statuses.map(item => ({ status: item.status, label: /iucn/i.test(item.authority ?? '') ? (labels[item.status.toUpperCase()] ?? item.status) : item.status,
    authority: item.authority ?? 'Autoridad no indicada', scope: item.place?.display_name ?? item.place?.name ?? 'Global',
    url: item.url && /^https:\/\//.test(item.url) ? item.url : null })).sort((a, b) => {
      const priority = (scope: string) => scope === 'Global' ? 0 : /m[eé]xico/i.test(scope) ? 1 : 2;
      return priority(a.scope) - priority(b.scope);
    });
}
export async function getBirdDetails(name: string): Promise<BirdDetails> {
  const empty: BirdDetails = { taxonUrl: null, photos: [], sounds: [], conservation: [], notices: [] };
  const search = await request(`taxa?${new URLSearchParams({ q: name, rank: 'species', iconic_taxa: 'Aves', per_page: '10' })}`, z.object({ results: z.array(taxonSchema) }));
  const match = search.results.find(taxon => taxon.name.toLowerCase() === name.toLowerCase() && taxon.rank === 'species' && taxon.iconic_taxon_name === 'Aves' && taxon.is_active !== false);
  if (!match) return { ...empty, notices: ['No encontramos una coincidencia científica exacta en iNaturalist.'] };
  const taxonUrl = `https://www.inaturalist.org/taxa/${match.id}`;
  const [detail, recordings] = await Promise.allSettled([
    request(`taxa/${match.id}`, z.object({ results: z.array(taxonSchema) })),
    request(`observations?${new URLSearchParams({ taxon_id: String(match.id), sounds: 'true', sound_license: [...allowedLicenses].join(','), quality_grade: 'research', per_page: '8' })}`, z.object({ results: z.array(z.object({ id: z.number(), sounds: z.array(z.object({ file_url: z.string().nullish(), license_code: z.string().nullish(), attribution: z.string().nullish(), hidden: z.boolean().optional() })).optional() })) })),
  ]);
  const result: BirdDetails = { ...empty, taxonUrl };
  if (detail.status === 'fulfilled') {
    const taxon = detail.value.results[0];
    const photos = new Map<string, BirdMedia>();
    for (const { photo } of taxon?.taxon_photos ?? []) {
      const url = photo.medium_url ?? photo.url;
      if (url && photo.license_code && allowedLicenses.has(photo.license_code) && photo.attribution) photos.set(url, { url, attribution: photo.attribution, license: photo.license_code, evidenceUrl: `https://www.inaturalist.org/photos/${photo.id}` });
    }
    result.photos = [...photos.values()].slice(0, 8);
    result.conservation = normalizeStatuses(taxon?.conservation_statuses ?? []);
  } else result.notices.push('No se pudieron cargar las fotos y la conservación. Vuelve a intentar.');
  if (recordings.status === 'fulfilled') {
    const sounds = new Map<string, BirdMedia>();
    for (const observation of recordings.value.results) for (const sound of observation.sounds ?? []) {
      if (!sound.hidden && sound.file_url && safeUrl.safeParse(sound.file_url).success && sound.attribution && sound.license_code && allowedLicenses.has(sound.license_code)) sounds.set(sound.file_url, { url: sound.file_url, attribution: sound.attribution, license: sound.license_code, evidenceUrl: `https://www.inaturalist.org/observations/${observation.id}` });
    }
    result.sounds = [...sounds.values()].slice(0, 4);
  } else result.notices.push('No se pudieron cargar las grabaciones. Vuelve a intentar.');
  return result;
}
