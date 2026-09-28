import { afterEach, expect, it, vi } from 'vitest';
import { getBirdDetails, normalizeStatuses } from './bird-details';
afterEach(() => vi.unstubAllGlobals());
it('no confunde categorías regionales con una evaluación IUCN global', () => {
  const statuses = normalizeStatuses([{ status: 'EN', authority: 'IUCN Red List', place: null }, { status: 'P', authority: 'NOM-059', place: { name: 'México' } }]);
  expect(statuses[0]).toMatchObject({ label: 'En peligro', scope: 'Global' });
  expect(statuses[1]).toMatchObject({ label: 'P', scope: 'México', authority: 'NOM-059' });
});
it('no enlaza una especie parecida si no coincide el nombre científico', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ id: 1, name: 'Turdus merula', rank: 'species', iconic_taxon_name: 'Aves' }] }) }));
  const result = await getBirdDetails('Turdus migratorius');
  expect(result.taxonUrl).toBeNull(); expect(result.photos).toEqual([]); expect(result.notices).toHaveLength(1);
});
it('omite fotos sin licencia y audios ocultos; conserva créditos y evaluación', async () => {
  const photo = { id: 5, medium_url: 'https://example.org/photo.jpg', attribution: 'Autora', license_code: 'cc-by' };
  const sound = { file_url: 'https://example.org/audio.mp3', attribution: 'Autor', license_code: 'cc-by' };
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({ ok: true, json: async () => {
    if (url.includes('taxa?')) return { results: [{ id: 1, name: 'Turdus migratorius', rank: 'species', iconic_taxon_name: 'Aves' }] };
    if (url.includes('taxa/1')) return { results: [{ id: 1, name: 'Turdus migratorius', rank: 'species', taxon_photos: [{ photo }, { photo: { ...photo, id: 6, license_code: null } }], conservation_statuses: [] }] };
    return { results: [{ id: 2, sounds: [sound, { ...sound, file_url: 'https://example.org/hidden.mp3', hidden: true }] }] };
  } })));
  const result = await getBirdDetails('Turdus migratorius');
  expect(result.photos).toHaveLength(1); expect(result.photos[0]?.attribution).toBe('Autora');
  expect(result.sounds).toHaveLength(1); expect(result.conservation).toEqual([]);
});
it('mantiene la galería si falla solo la consulta de sonidos', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
    if (url.includes('observations?')) throw new Error('timeout');
    return { ok: true, json: async () => ({ results: [{ id: 1, name: 'Turdus migratorius', rank: 'species', iconic_taxon_name: 'Aves' }] }) };
  }));
  const result = await getBirdDetails('Turdus migratorius');
  expect(result.taxonUrl).toContain('/1'); expect(result.notices[0]).toContain('grabaciones');
});
