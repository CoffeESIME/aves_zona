import { ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { INaturalistError } from '@/src/lib/inaturalist/errors';
import { GBIFError } from '@/src/lib/gbif/errors';

export const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800';

export function cachedJson<T>(body: T, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', CACHE_CONTROL);
  return response;
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Los filtros no son válidos.', details: error.issues.map((issue) => issue.message) },
      { status: 400 },
    );
  }
  if (error instanceof INaturalistError || error instanceof GBIFError) {
    const status = error.kind === 'timeout' ? 504 : 502;
    return NextResponse.json(
      { error: 'No pudimos consultar las observaciones en este momento. Intenta nuevamente más tarde.' },
      { status },
    );
  }
  return NextResponse.json(
    { error: 'No pudimos procesar la consulta en este momento. Intenta nuevamente más tarde.' },
    { status: 500 },
  );
}

export function rejectUnknownParams(searchParams: URLSearchParams, extras: string[] = []) {
  const allowed = new Set(['radius', 'taxon', 'quality', 'sources', 'from', 'to', ...extras]);
  const unknown = [...searchParams.keys()].filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `Parámetros no permitidos: ${unknown.join(', ')}` },
      { status: 400 },
    );
  }
  return null;
}
