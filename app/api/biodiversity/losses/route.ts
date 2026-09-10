import type { NextRequest } from 'next/server';
import { apiError, cachedJson, rejectUnknownParams } from '@/src/lib/api-response';
import { getLosses } from '@/src/lib/gbif/service';
import { parseApiFilters } from '@/src/lib/validation/filters';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rejected = rejectUnknownParams(request.nextUrl.searchParams);
  if (rejected) return rejected;
  try {
    const filters = parseApiFilters(request.nextUrl.searchParams);
    return cachedJson(await getLosses(filters.radius));
  } catch (error) {
    return apiError(error);
  }
}
