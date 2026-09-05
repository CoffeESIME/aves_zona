import { describe, expect, it } from 'vitest';
import { buildObservationParams } from './query';

describe('constructor de consultas iNaturalist', () => {
  it('mapea aves, calidad y fechas a parámetros oficiales', () => {
    const params = buildObservationParams({ radius: 2, taxon: 'birds', quality: 'research', from: '2024-01-01', to: '2025-01-01' });
    expect(params.get('iconic_taxa')).toBe('Aves');
    expect(params.get('quality_grade')).toBe('research');
    expect(params.get('d1')).toBe('2024-01-01');
    expect(params.get('d2')).toBe('2025-01-01');
    expect(params.get('lat')).toBe('19.3525');
  });

  it('traduce verificables y herpetofauna', () => {
    const params = buildObservationParams({ radius: 0.5, taxon: 'herps', quality: 'verifiable' });
    expect(params.get('verifiable')).toBe('true');
    expect(params.get('iconic_taxa')).toBe('Reptilia,Amphibia');
  });
});
