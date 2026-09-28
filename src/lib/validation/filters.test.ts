import { describe, expect, it } from 'vitest';
import { parseApiFilters, parseExplorerFilters, serializeFilters } from './filters';

describe('filtros compartibles', () => {
  it('inicia a 1 km con iNaturalist y respeta enlaces explícitos', () => {
    expect(parseApiFilters(new URLSearchParams())).toMatchObject({ radius: 1, sources: ['inaturalist'] });
    expect(parseExplorerFilters(new URLSearchParams())).toMatchObject({ radius: 1, sources: ['inaturalist'] });
    expect(parseExplorerFilters(new URLSearchParams('radius=2&sources=ebird'))).toMatchObject({ radius: 2, sources: ['ebird'] });
  });
  it('acepta radios y filtros permitidos', () => {
    const result = parseApiFilters(new URLSearchParams('radius=5&taxon=birds&quality=research&from=2025-01-01'));
    expect(result).toEqual({ radius: 5, taxon: 'birds', quality: 'research', sources: ['inaturalist'], from: '2025-01-01', to: undefined });
  });

  it('rechaza radios arbitrarios', () => {
    expect(() => parseApiFilters(new URLSearchParams('radius=99'))).toThrow();
  });

  it('reemplaza valores inválidos por defaults seguros en la interfaz', () => {
    expect(parseExplorerFilters(new URLSearchParams('radius=hack&taxon=oops&view=oops'))).toMatchObject({ radius: 1, taxon: 'all', quality: 'research', sources: ['inaturalist'], view: 'points' });
  });

  it('acepta una o varias fuentes y evita una selección vacía', () => {
    expect(parseApiFilters(new URLSearchParams('sources=gbif')).sources).toEqual(['gbif']);
    expect(parseApiFilters(new URLSearchParams('sources=inaturalist,gbif')).sources).toEqual(['inaturalist', 'gbif']);
    expect(() => parseApiFilters(new URLSearchParams('sources='))).toThrow();
  });

  it('serializa todos los filtros sin coordenadas', () => {
    expect(serializeFilters({ radius: 10, taxon: 'fungi', quality: 'verifiable', sources: ['gbif'], from: '2020-01-01', view: 'hexagons' })).toBe('radius=10&taxon=fungi&quality=verifiable&sources=gbif&from=2020-01-01&view=hexagons');
  });
});
