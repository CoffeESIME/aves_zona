import { cellToBoundary, latLngToCell } from 'h3-js';
import type { Feature, Polygon } from 'geojson';
import type {
  HexFeatureCollection,
  HexProperties,
  ObservationsResponse,
} from '@/src/types/biodiversity';

export function aggregateHexagons(
  observations: ObservationsResponse,
  resolution = 9,
): HexFeatureCollection {
  const cells = new Map<
    string,
    { species: Set<string>; groups: Set<string>; observers: Set<string>; count: number }
  >();

  for (const feature of observations.geojson.features) {
    const [lng, lat] = feature.geometry.coordinates;
    if (lng == null || lat == null) continue;
    const index = latLngToCell(lat, lng, resolution);
    const cell = cells.get(index) ?? {
      species: new Set<string>(),
      groups: new Set<string>(),
      observers: new Set<string>(),
      count: 0,
    };
    cell.species.add(feature.properties.taxonId?.toString() ?? feature.properties.scientificName);
    cell.groups.add(feature.properties.iconicGroup);
    if (feature.properties.observerName) cell.observers.add(feature.properties.observerName);
    cell.count += 1;
    cells.set(index, cell);
  }

  const features: Array<Feature<Polygon, HexProperties>> = [...cells.entries()].map(
    ([h3Index, cell]) => {
      const speciesCount = cell.species.size;
      const observationCount = cell.count;
      const observerCount = cell.observers.size;
      const boundary = cellToBoundary(h3Index, true) as Array<[number, number]>;
      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...boundary, boundary[0]!]] },
        properties: {
          h3Index,
          speciesCount,
          observationCount,
          groupCount: cell.groups.size,
          observerCount,
          label: `${speciesCount} especies registradas · ${observationCount} observaciones · ${observerCount} observadores`,
        },
      };
    },
  );

  return { type: 'FeatureCollection', features };
}
