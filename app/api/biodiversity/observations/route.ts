import type { NextRequest } from 'next/server';
import { apiError, cachedJson, rejectUnknownParams } from '@/src/lib/api-response';
import { getObservations } from '@/src/lib/providers/service';
import { parseApiFilters } from '@/src/lib/validation/filters';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rejected = rejectUnknownParams(request.nextUrl.searchParams);
  if (rejected) return rejected;
  try {
    return cachedJson(await getObservations(parseApiFilters(request.nextUrl.searchParams)));
  } catch (error) {
    return apiError(error);
  }
}
