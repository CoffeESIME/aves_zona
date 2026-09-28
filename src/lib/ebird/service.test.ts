import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppliedFilters } from '@/src/types/biodiversity';
const filters: AppliedFilters = { radius: 2, taxon: 'birds', quality: 'research', sources: ['ebird'] };
const row = { speciesCode: 'rocpig', sciName: 'Columba livia', comName: 'Paloma común', locId: 'L1', locName: 'Zona', lat: 19.3525, lng: -99.2824, subId: 'S123', obsDt: '2026-09-10 08:00', obsValid: true };
beforeEach(() => { vi.resetModules(); vi.stubEnv('EBIRD_API_KEY', 'test-secret'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('eBird', () => {
  it('envía la clave solo en cabecera y reutiliza la consulta entre endpoints', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [row] }); vi.stubGlobal('fetch', fetcher);
    const { getEBirdObservations, getEBirdSpecies } = await import('./service');
    const [observations, species] = await Promise.all([getEBirdObservations(filters), getEBirdSpecies(filters, 'desc')]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toContain('dist=2'); expect(url).toContain('back=30'); expect(url).not.toContain('test-secret');
    expect(options.headers['X-eBirdApiToken']).toBe('test-secret');
    expect(observations.geojson.features[0]?.properties.source).toBe('ebird');
    expect(observations.geojson.features[0]?.geometry.coordinates).toEqual([-99.2824, 19.3525]);
    expect(species.totalSpecies).toBe(1); expect(JSON.stringify(observations)).not.toContain('test-secret');
  });
  it('excluye grupos ajenos, fechas fuera del rango, no validados y puntos fuera del radio', async () => {
    const { filterRecords, getEBirdObservations } = await import('./service');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect((await getEBirdObservations({ ...filters, taxon: 'plants' })).geojson.features).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
    expect(filterRecords([row, { ...row, lng: -98 }, { ...row, obsValid: false }], filters)).toEqual([row]);
    expect(filterRecords([row], { ...filters, to: '2025-01-01' })).toEqual([]);
  });
  it('consulta cada radio para evitar omitir observaciones cercanas anteriores', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [row] }); vi.stubGlobal('fetch', fetcher);
    const { getEBirdSummary } = await import('./service');
    const summary = await getEBirdSummary(filters);
    expect(fetcher).toHaveBeenCalledTimes(5);
    expect(summary.rings.map(ring => ring.cumulativeSpecies)).toEqual([1, 1, 1, 1, 1]);
    expect(summary.selected.observerCount).toBeNull();
  });
  it('rechaza una clave ausente y respuestas mal formadas sin filtrar secretos', async () => {
    const { getEBirdObservations } = await import('./service');
    vi.stubEnv('EBIRD_API_KEY', '');
    await expect(getEBirdObservations(filters)).rejects.toThrow('no está configurado');
    vi.stubEnv('EBIRD_API_KEY', 'test-secret');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ lat: 'bad' }] }));
    await expect(getEBirdObservations(filters)).rejects.toThrow('no respondió correctamente');
  });
});
