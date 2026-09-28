import { afterEach, expect, it, vi } from 'vitest';
import { getObservations } from './service';
import { getObservations as inat } from '@/src/lib/inaturalist/service';
import { getEBirdObservations } from '@/src/lib/ebird/service';
import type { AppliedFilters, ObservationsResponse } from '@/src/types/biodiversity';
vi.mock('@/src/lib/inaturalist/service', () => ({ getObservations: vi.fn(), getSpecies: vi.fn(), getSummary: vi.fn() }));
vi.mock('@/src/lib/ebird/service', () => ({ getEBirdObservations: vi.fn(), getEBirdSpecies: vi.fn(), getEBirdSummary: vi.fn() }));
afterEach(() => vi.resetAllMocks());
it('conserva iNaturalist y avisa si eBird falla al combinar fuentes', async () => {
  const filters: AppliedFilters = { radius: 2, quality: 'research', taxon: 'birds', sources: ['inaturalist', 'ebird'] };
  const data: ObservationsResponse = { meta: { center: { lat: 0, lng: 0, label: 'Centro' }, radiusKm: 2, filters, source: 'iNaturalist', generatedAt: '', totalAvailable: 0, returned: 0, truncated: false }, geojson: { type: 'FeatureCollection', features: [] } };
  vi.mocked(inat).mockResolvedValue(data); vi.mocked(getEBirdObservations).mockRejectedValue(new Error('unavailable'));
  const result = await getObservations(filters);
  expect(result.meta.source).toBe('iNaturalist'); expect(result.meta.warnings?.[0]).toContain('eBird');
});
