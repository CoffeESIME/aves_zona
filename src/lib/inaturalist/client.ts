import type { z } from 'zod';
import { INaturalistError } from './errors';
import { buildINaturalistUrl } from './query';
import {
  countResponseSchema,
  observationsResponseSchema,
  speciesCountsResponseSchema,
} from './schemas';

const REQUEST_TIMEOUT_MS = 12_000;

async function request<T>(
  path: string,
  params: URLSearchParams,
  schema: z.ZodType<T>,
  cacheable = true,
): Promise<T> {
  const url = buildINaturalistUrl(path, params);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const cacheOptions = cacheable
      ? { next: { revalidate: 86_400 } }
      : { cache: 'no-store' as const };
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'IslasVivas/0.1' },
      ...cacheOptions,
    });
    if (!response.ok) {
      throw new INaturalistError('iNaturalist respondió con un error', 'upstream', response.status);
    }
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new INaturalistError('iNaturalist devolvió un formato inesperado', 'schema');
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof INaturalistError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new INaturalistError('La consulta a iNaturalist excedió el tiempo permitido', 'timeout');
    }
    throw new INaturalistError('No fue posible contactar iNaturalist', 'upstream');
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchObservationPage(params: URLSearchParams) {
  // Full observation pages routinely exceed Next's 2 MB data-cache limit.
  // The normalized Route Handler response is cached at the CDN boundary instead.
  return request('observations', params, observationsResponseSchema, false);
}

export async function fetchSpeciesCounts(params: URLSearchParams) {
  return request('observations/species_counts', params, speciesCountsResponseSchema);
}

export async function fetchObserverCount(params: URLSearchParams) {
  return request('observations/observers', params, countResponseSchema);
}
