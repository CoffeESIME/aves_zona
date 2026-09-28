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
export type DataSource = 'inaturalist' | 'gbif' | 'ebird';

export type AppliedFilters = {
  radius: RadiusKm;
  taxon: TaxonFilter;
  quality: QualityFilter;
  sources: DataSource[];
  from?: string;
  to?: string;
};

export type ExplorerFilters = AppliedFilters & { view: ViewMode };

export type ResponseMeta = {
  warnings?: string[];
  center: { lat: number; lng: number; label: string };
  radiusKm: number;
  filters: AppliedFilters;
  source: string;
  providers?: Array<{
    id: DataSource;
    label: string;
    totalAvailable: number;
    returned: number;
    truncated: boolean;
  }>;
  generatedAt: string;
  totalAvailable: number;
  returned: number;
  truncated: boolean;
};

export type ObservationProperties = {
  id: number | string;
  source: DataSource;
  sourceLabel: string;
  datasetName: string | null;
  recordType: string | null;
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
  taxonId: number | string;
  source: DataSource;
  sourceLabel: string;
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

export type LossCategory = 'EXTINCT' | 'EXTINCT_IN_THE_WILD' | 'REGIONALLY_EXTINCT';

export type LossSpecies = {
  key: string;
  scientificName: string;
  commonName: string | null;
  category: LossCategory;
  lastRecorded: string | null;
  datasetName: string | null;
  occurrenceCount: number;
  photoUrl: string | null;
  photoAttribution: string | null;
  photoLicense: string | null;
  evidenceUrl: string;
};

export type LossesResponse = {
  meta: {
    center: ResponseMeta['center'];
    radiusKm: number;
    source: 'GBIF';
    generatedAt: string;
    totalOccurrences: number;
  };
  species: LossSpecies[];
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
