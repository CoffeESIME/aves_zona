import { describe, expect, it } from 'vitest';
import { normalizeGBIFObservation } from './normalize';

const record = {
  key: 42,
  decimalLatitude: 19.35,
  decimalLongitude: -99.28,
  eventDate: '1984-04-10T00:00:00',
  basisOfRecord: 'PRESERVED_SPECIMEN',
  species: 'Quercus rugosa',
  speciesKey: 2879369,
  kingdom: 'Plantae',
  datasetTitle: 'Herbario verificable',
  recordedBy: 'Colectora',
  media: [{ identifier: 'https://example.org/oak.jpg', license: 'CC BY 4.0', creator: 'Archivo' }],
};

describe('normalización GBIF', () => {
  it('conserva fuente, colección, tipo de evidencia y licencia', () => {
    const feature = normalizeGBIFObservation(record);
    expect(feature?.properties).toMatchObject({
      source: 'gbif', sourceLabel: 'GBIF', iconicGroup: 'plants',
      datasetName: 'Herbario verificable', recordType: 'Ejemplar preservado',
      photoLicense: 'CC BY 4.0',
    });
    expect(feature?.id).toBe('gbif:42');
  });

  it('no muestra medios sin licencia', () => {
    const feature = normalizeGBIFObservation({ ...record, media: [{ identifier: 'https://example.org/oak.jpg' }] });
    expect(feature?.properties.photoUrl).toBeNull();
  });
});
