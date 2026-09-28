import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getBirdDetails } from '@/src/lib/inaturalist/bird-details';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = z.string().trim().min(3).max(120).regex(/^[\p{L} .'-]+$/u).safeParse(params.get('name'));
  if (!parsed.success || [...params.keys()].some(key => key !== 'name')) return NextResponse.json({ error: 'Nombre científico inválido.' }, { status: 400 });
  try {
    const data = await getBirdDetails(parsed.data);
    return NextResponse.json(data, { headers: { 'Cache-Control': data.notices.length ? 'no-store' : 'public, s-maxage=86400' } });
  } catch {
    return NextResponse.json({ error: 'No pudimos cargar la ficha de iNaturalist. Intenta nuevamente.' }, { status: 502 });
  }
}
