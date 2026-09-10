import { describe, expect, it } from 'vitest';
import { buildGBIFParams, COMPLEMENTARY_RECORD_TYPES } from './query';

describe('constructor de consultas GBIF', () => {
  it('limita por radio y usa evidencia complementaria', () => {
    const params = buildGBIFParams({ radius: 5, taxon: 'birds', quality: 'research', sources: ['gbif'] });
    expect(params.get('geoDistance')).toBe('19.3525,-99.2824,5km');
    expect(params.get('classKey')).toBe('212');
    expect(params.getAll('basisOfRecord')).toEqual([...COMPLEMENTARY_RECORD_TYPES]);
    expect(params.getAll('basisOfRecord')).not.toContain('HUMAN_OBSERVATION');
  });

  it('traduce herpetofauna y periodos sin aplicar calidad de iNaturalist', () => {
    const params = buildGBIFParams({ radius: 2, taxon: 'herps', quality: 'needs_id', sources: ['gbif'], from: '2020-01-01', to: '2024-12-31' });
    expect(params.getAll('classKey')).toEqual(['358', '131']);
    expect(params.get('eventDate')).toBe('2020-01-01,2024-12-31');
    expect(params.has('quality_grade')).toBe(false);
  });
});
