import { describe, expect, it } from 'vitest';
import { rawObservation } from '@/src/test/fixtures/inaturalist';
import { normalizeObservation } from './normalize';

describe('normalización de observaciones', () => {
  it('convierte una observación pública a GeoJSON reducido', () => {
    const feature = normalizeObservation(rawObservation);
    expect(feature?.geometry.coordinates).toEqual([-99.283, 19.353]);
    expect(feature?.properties).toMatchObject({ source: 'inaturalist', sourceLabel: 'iNaturalist', iconicGroup: 'birds', commonName: 'Mirlo primavera', photoLicense: 'cc-by-nc' });
    expect(feature?.properties).not.toHaveProperty('private_location');
  });

  it('omite una fotografía sin licencia', () => {
    const feature = normalizeObservation({ ...rawObservation, photos: [{ url: 'https://static.inaturalist.org/photos/1/square.jpg', attribution: 'Autor', license_code: null }] });
    expect(feature?.properties.photoUrl).toBeNull();
  });

  it('acepta observaciones sin fotografía', () => {
    const feature = normalizeObservation({ ...rawObservation, photos: [] });
    expect(feature?.properties.photoUrl).toBeNull();
  });
});
