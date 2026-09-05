import type { Feature, Point } from 'geojson';
import { iconicTaxonToGroup } from '@/src/lib/taxonomy';
import type { ObservationProperties, SpeciesItem } from '@/src/types/biodiversity';
import type { RawObservation, RawSpeciesCount } from './schemas';

function licensedPhoto(photo: {
  url: string;
  attribution?: string | null;
  license_code?: string | null;
}) {
  if (!photo.license_code) return { url: null, attribution: null, license: null };
  return {
    url: photo.url.replace(/square|thumb/, 'medium'),
    attribution: photo.attribution ?? null,
    license: photo.license_code,
  };
}

export function normalizeObservation(
  observation: RawObservation,
): Feature<Point, ObservationProperties> | null {
  if (!observation.geojson) return null;
  const taxon = observation.taxon;
  const photo = observation.photos[0] ? licensedPhoto(observation.photos[0]) : null;
  return {
    type: 'Feature',
    id: observation.id,
    geometry: observation.geojson,
    properties: {
      id: observation.id,
      observedOn: observation.observed_on ?? null,
      qualityGrade: observation.quality_grade,
      iconicGroup: iconicTaxonToGroup(taxon?.iconic_taxon_name),
      commonName: taxon?.preferred_common_name ?? null,
      scientificName: taxon?.name ?? observation.species_guess ?? 'Taxón sin identificar',
      taxonId: taxon?.id ?? null,
      observerName: observation.user?.name ?? observation.user?.login ?? null,
      photoUrl: photo?.url ?? null,
      photoAttribution: photo?.attribution ?? null,
      photoLicense: photo?.license ?? null,
      observationUrl: observation.uri ?? `https://www.inaturalist.org/observations/${observation.id}`,
    },
  };
}

export function normalizeSpecies(item: RawSpeciesCount): SpeciesItem {
  const photo = item.taxon.default_photo ? licensedPhoto(item.taxon.default_photo) : null;
  return {
    taxonId: item.taxon.id,
    commonName: item.taxon.preferred_common_name ?? null,
    scientificName: item.taxon.name,
    iconicGroup: iconicTaxonToGroup(item.taxon.iconic_taxon_name),
    observationCount: item.count,
    photoUrl: photo?.url ?? null,
    photoAttribution: photo?.attribution ?? null,
    photoLicense: photo?.license ?? null,
    taxonUrl: `https://www.inaturalist.org/taxa/${item.taxon.id}`,
  };
}
