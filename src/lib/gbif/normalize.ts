import type { Feature, Point } from 'geojson';
import type { ObservationProperties, TaxonGroup } from '@/src/types/biodiversity';
import type { RawGBIFOccurrence } from './schemas';

const RECORD_LABELS: Record<string, string> = {
  PRESERVED_SPECIMEN: 'Ejemplar preservado',
  MATERIAL_SAMPLE: 'Muestra material',
  LIVING_SPECIMEN: 'Ejemplar vivo en colección',
  MACHINE_OBSERVATION: 'Observación por sensor',
};

export function gbifGroup(record: RawGBIFOccurrence): TaxonGroup {
  const className = record.class?.toLowerCase();
  const kingdom = record.kingdom?.toLowerCase();
  if (className === 'aves') return 'birds';
  if (className === 'insecta') return 'insects';
  if (className === 'mammalia') return 'mammals';
  if (className === 'reptilia' || className === 'amphibia') return 'herps';
  if (kingdom === 'plantae') return 'plants';
  if (kingdom === 'fungi') return 'fungi';
  return 'other';
}

export function licensedGBIFPhoto(record: RawGBIFOccurrence) {
  const media = record.media.find((item) => item.identifier && item.license);
  if (!media?.identifier || !media.license) return { url: null, attribution: null, license: null };
  let url: string;
  try {
    const parsed = new URL(media.identifier);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported');
    url = parsed.toString();
  } catch {
    return { url: null, attribution: null, license: null };
  }
  return {
    url,
    attribution: media.creator ?? media.title ?? null,
    license: media.license,
  };
}

export function normalizeGBIFObservation(
  record: RawGBIFOccurrence,
  forcedGroup?: TaxonGroup,
): Feature<Point, ObservationProperties> | null {
  if (record.decimalLongitude == null || record.decimalLatitude == null) return null;
  const photo = licensedGBIFPhoto(record);
  return {
    type: 'Feature',
    id: `gbif:${record.key}`,
    geometry: { type: 'Point', coordinates: [record.decimalLongitude, record.decimalLatitude] },
    properties: {
      id: record.key,
      source: 'gbif',
      sourceLabel: 'GBIF',
      datasetName: record.datasetTitle ?? null,
      recordType: RECORD_LABELS[record.basisOfRecord ?? ''] ?? record.basisOfRecord ?? null,
      observedOn: record.eventDate ?? (record.year ? `${record.year}-01-01` : null),
      qualityGrade: 'publicado por institución',
      iconicGroup: forcedGroup ?? gbifGroup(record),
      commonName: record.vernacularName ?? null,
      scientificName: record.species ?? record.scientificName ?? 'Taxón sin identificar',
      taxonId: record.speciesKey ?? record.taxonKey ?? null,
      observerName: record.recordedBy ?? null,
      photoUrl: photo.url,
      photoAttribution: photo.attribution,
      photoLicense: photo.license,
      observationUrl: `https://www.gbif.org/occurrence/${record.key}`,
    },
  };
}
