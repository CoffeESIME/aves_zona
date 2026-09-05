import { describe, expect, it } from 'vitest';
import { aggregateHexagons } from './hexagons';
import type { ObservationsResponse } from '@/src/types/biodiversity';

describe('mosaico H3', () => {
  it('cuenta especies distintas, observaciones, grupos y observadores por celda', () => {
    const base = { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [-99.283, 19.353] } };
    const data = {
      meta: { center: { lat: 19.3525, lng: -99.2824, label: 'UAM' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research' }, source: 'iNaturalist', generatedAt: '', totalAvailable: 2, returned: 2, truncated: false },
      geojson: { type: 'FeatureCollection' as const, features: [
        { ...base, properties: { id: 1, observedOn: null, qualityGrade: 'research', iconicGroup: 'birds', commonName: null, scientificName: 'A', taxonId: 4, observerName: 'ana', photoUrl: null, photoAttribution: null, photoLicense: null, observationUrl: 'https://example.com/1' } },
        { ...base, properties: { id: 2, observedOn: null, qualityGrade: 'research', iconicGroup: 'birds', commonName: null, scientificName: 'A', taxonId: 4, observerName: 'luz', photoUrl: null, photoAttribution: null, photoLicense: null, observationUrl: 'https://example.com/2' } },
      ] },
    } satisfies ObservationsResponse;
    const result = aggregateHexagons(data);
    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.properties).toMatchObject({ speciesCount: 1, observationCount: 2, groupCount: 1, observerCount: 2 });
  });
});
