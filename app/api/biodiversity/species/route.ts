import type { NextRequest } from 'next/server';
import { apiError, cachedJson, rejectUnknownParams } from '@/src/lib/api-response';
import { getSpecies } from '@/src/lib/inaturalist/service';
import { parseApiFilters } from '@/src/lib/validation/filters';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rejected = rejectUnknownParams(request.nextUrl.searchParams, ['sort']);
  if (rejected) return rejected;
  try {
    const sort = request.nextUrl.searchParams.get('sort') === 'infrequent' ? 'asc' : 'desc';
    return cachedJson(await getSpecies(parseApiFilters(request.nextUrl.searchParams), sort));
  } catch (error) {
    return apiError(error);
  }
}
