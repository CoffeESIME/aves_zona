import { describe, expect, it } from 'vitest';
import { iconicTaxonToGroup, TAXON_CONFIG } from './taxonomy';

describe('grupos taxonómicos', () => {
  it('mapea grupos icónicos de forma estable', () => {
    expect(iconicTaxonToGroup('Aves')).toBe('birds');
    expect(iconicTaxonToGroup('Amphibia')).toBe('herps');
    expect(iconicTaxonToGroup('Arachnida')).toBe('other');
  });

  it('centraliza colores y filtros externos', () => {
    expect(TAXON_CONFIG.plants).toMatchObject({ color: '#22C55E', iconicTaxa: ['Plantae'] });
  });
});
