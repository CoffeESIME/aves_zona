import { describe, expect, it } from 'vitest';
import { parseApiFilters, parseExplorerFilters, serializeFilters } from './filters';

describe('filtros compartibles', () => {
  it('acepta radios y filtros permitidos', () => {
    const result = parseApiFilters(new URLSearchParams('radius=5&taxon=birds&quality=research&from=2025-01-01'));
    expect(result).toEqual({ radius: 5, taxon: 'birds', quality: 'research', from: '2025-01-01', to: undefined });
  });

  it('rechaza radios arbitrarios', () => {
    expect(() => parseApiFilters(new URLSearchParams('radius=99'))).toThrow();
  });

  it('reemplaza valores inválidos por defaults seguros en la interfaz', () => {
    expect(parseExplorerFilters(new URLSearchParams('radius=hack&taxon=oops&view=oops'))).toMatchObject({ radius: 2, taxon: 'all', quality: 'research', view: 'points' });
  });

  it('serializa todos los filtros sin coordenadas', () => {
    expect(serializeFilters({ radius: 10, taxon: 'fungi', quality: 'verifiable', from: '2020-01-01', view: 'hexagons' })).toBe('radius=10&taxon=fungi&quality=verifiable&from=2020-01-01&view=hexagons');
  });
});
