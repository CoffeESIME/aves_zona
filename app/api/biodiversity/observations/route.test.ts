import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/lib/providers/service', () => ({ getObservations: vi.fn() }));

import { getObservations } from '@/src/lib/providers/service';
import { GET } from './route';
import type { ObservationsResponse } from '@/src/types/biodiversity';

const response = {
  meta: { center: { lat: 19.3525, lng: -99.2824, label: 'UAM' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research', sources: ['inaturalist'] as const }, source: 'iNaturalist' as const, generatedAt: '', totalAvailable: 0, returned: 0, truncated: false },
  geojson: { type: 'FeatureCollection' as const, features: [] },
} satisfies ObservationsResponse;

describe('GET /api/biodiversity/observations', () => {
  beforeEach(() => vi.mocked(getObservations).mockResolvedValue(response));

  it('rechaza coordenadas y parámetros arbitrarios', async () => {
    const result = await GET(new NextRequest('http://localhost/api/biodiversity/observations?lat=0'));
    expect(result.status).toBe(400);
  });

  it('incluye caché compartida en respuestas correctas', async () => {
    const result = await GET(new NextRequest('http://localhost/api/biodiversity/observations?radius=2&taxon=all&quality=research'));
    expect(result.status).toBe(200);
    expect(result.headers.get('cache-control')).toBe('public, s-maxage=86400, stale-while-revalidate=604800');
  });
});
