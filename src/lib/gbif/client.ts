import { GBIFError } from './errors';
import { buildGBIFUrl } from './query';
import { gbifSearchResponseSchema } from './schemas';

const REQUEST_TIMEOUT_MS = 12_000;

export async function fetchGBIFOccurrences(params: URLSearchParams) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(buildGBIFUrl('occurrence/search', params), {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'IslasVivas/0.2' },
      // Full GBIF pages can exceed Next's per-entry data-cache size. The
      // normalized Route Handler response is cached at the CDN boundary.
      cache: 'no-store',
    });
    if (!response.ok) throw new GBIFError('GBIF respondió con un error', 'upstream', response.status);
    const parsed = gbifSearchResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new GBIFError('GBIF devolvió un formato inesperado', 'schema');
    return parsed.data;
  } catch (error) {
    if (error instanceof GBIFError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GBIFError('La consulta a GBIF excedió el tiempo permitido', 'timeout');
    }
    throw new GBIFError('No fue posible contactar GBIF', 'upstream');
  } finally {
    clearTimeout(timer);
  }
}
