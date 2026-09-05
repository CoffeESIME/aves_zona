import type { FeatureCollection, Point, Polygon } from 'geojson';

export const RADII = [0.5, 1, 2, 5, 10] as const;
export type RadiusKm = (typeof RADII)[number];
export type TaxonFilter =
  | 'all'
  | 'birds'
  | 'plants'
  | 'insects'
  | 'fungi'
  | 'mammals'
  | 'herps'
  | 'other';
export type QualityFilter = 'research' | 'needs_id' | 'verifiable';
export type ViewMode = 'points' | 'hexagons';
export type TaxonGroup = Exclude<TaxonFilter, 'all'>;

export type AppliedFilters = {
  radius: RadiusKm;
  taxon: TaxonFilter;
  quality: QualityFilter;
  from?: string;
  to?: string;
};

export type ExplorerFilters = AppliedFilters & { view: ViewMode };

export type ResponseMeta = {
  center: { lat: number; lng: number; label: string };
  radiusKm: number;
  filters: AppliedFilters;
  source: 'iNaturalist';
  generatedAt: string;
  totalAvailable: number;
  returned: number;
  truncated: boolean;
};

export type ObservationProperties = {
  id: number;
  observedOn: string | null;
  qualityGrade: string;
  iconicGroup: TaxonGroup;
  commonName: string | null;
  scientificName: string;
  taxonId: number | null;
  observerName: string | null;
  photoUrl: string | null;
  photoAttribution: string | null;
  photoLicense: string | null;
  observationUrl: string;
};

export type ObservationsResponse = {
  meta: ResponseMeta;
  geojson: FeatureCollection<Point, ObservationProperties>;
};

export type SpeciesItem = {
  taxonId: number;
  commonName: string | null;
  scientificName: string;
  iconicGroup: TaxonGroup;
  observationCount: number;
  photoUrl: string | null;
  photoAttribution: string | null;
  photoLicense: string | null;
  taxonUrl: string;
};

export type SpeciesResponse = {
  meta: ResponseMeta;
  totalSpecies: number;
  species: SpeciesItem[];
};

export type SummaryResponse = {
  selected: {
    speciesCount: number;
    observationCount: number;
    observerCount: number | null;
    groupCount: number;
    earliestObservation: string | null;
    latestObservation: string | null;
    researchGradeCount: number | null;
  };
  rings: Array<{
    radiusKm: RadiusKm;
    cumulativeSpecies: number;
    addedSpecies: number | null;
  }>;
  caveats: string[];
};

export type HexProperties = {
  h3Index: string;
  speciesCount: number;
  observationCount: number;
  groupCount: number;
  observerCount: number;
  label: string;
};

export type HexFeatureCollection = FeatureCollection<Polygon, HexProperties>;
