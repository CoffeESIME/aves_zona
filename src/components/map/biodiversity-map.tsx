'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { bbox, circle } from '@turf/turf';
import { aggregateHexagons } from '@/src/lib/geo/hexagons';
import { publicConfig } from '@/src/lib/config';
import { TAXON_CONFIG } from '@/src/lib/taxonomy';
import type {
  ExplorerFilters,
  HexProperties,
  ObservationProperties,
  ObservationsResponse,
} from '@/src/types/biodiversity';

type Props = {
  data: ObservationsResponse | null;
  filters: ExplorerFilters;
  onObservationSelect: (observation: ObservationProperties | null) => void;
  onHexSelect: (hex: HexProperties | null) => void;
  onWebglError: (message: string | null) => void;
};

const emptyGeoJson = { type: 'FeatureCollection' as const, features: [] };

const pointColor: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'iconicGroup'],
  'birds', TAXON_CONFIG.birds.color,
  'plants', TAXON_CONFIG.plants.color,
  'insects', TAXON_CONFIG.insects.color,
  'fungi', TAXON_CONFIG.fungi.color,
  'mammals', TAXON_CONFIG.mammals.color,
  'herps', TAXON_CONFIG.herps.color,
  TAXON_CONFIG.other.color,
];

export default function BiodiversityMap({ data, filters, onObservationSelect, onHexSelect, onWebglError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const hexagons = useMemo(() => (data ? aggregateHexagons(data) : emptyGeoJson), [data]);
  const inaturalist = useMemo(() => ({ type: 'FeatureCollection' as const, features: data?.geojson.features.filter((feature) => feature.properties.source === 'inaturalist') ?? [] }), [data]);
  const gbif = useMemo(() => ({ type: 'FeatureCollection' as const, features: data?.geojson.features.filter((feature) => feature.properties.source === 'gbif') ?? [] }), [data]);
  const ebird = useMemo(() => ({ type: 'FeatureCollection' as const, features: data?.geojson.features.filter((feature) => feature.properties.source === 'ebird') ?? [] }), [data]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: publicConfig.mapStyleUrl,
        center: [publicConfig.center.lng, publicConfig.center.lat],
        zoom: 12.5,
        attributionControl: false,
      });
    } catch {
      onWebglError('Este navegador no puede mostrar el mapa WebGL. La lista de especies sigue disponible.');
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap · OpenFreeMap',
      }),
      'bottom-right',
    );

    const markerElement = document.createElement('div');
    markerElement.className = 'uam-marker';
    markerElement.setAttribute('role', 'img');
    markerElement.setAttribute('aria-label', publicConfig.center.label);
    markerElement.innerHTML = '<span>UAM</span><b>Cuajimalpa</b>';
    new maplibregl.Marker({ element: markerElement, anchor: 'bottom-left' })
      .setLngLat([publicConfig.center.lng, publicConfig.center.lat])
      .addTo(map);

    map.on('load', () => {
      loadedRef.current = true;
      map.addSource('search-radius', { type: 'geojson', data: emptyGeoJson });
      map.addLayer({
        id: 'search-radius-fill', type: 'fill', source: 'search-radius',
        paint: { 'fill-color': '#416c53', 'fill-opacity': 0.06 },
      });
      map.addLayer({
        id: 'search-radius-line', type: 'line', source: 'search-radius',
        paint: { 'line-color': '#244a38', 'line-width': 1.5, 'line-dasharray': [3, 2] },
      });
      for (const provider of [
        { id: 'inaturalist', color: '#173d2d', stroke: '#f8f4e8', width: 1.5 },
        { id: 'ebird', color: '#315d84', stroke: '#315d84', width: 3 },
        { id: 'gbif', color: '#a24e2f', stroke: '#a24e2f', width: 2.8 },
      ]) {
        map.addSource(`observations-${provider.id}`, { type: 'geojson', data: emptyGeoJson, cluster: true, clusterMaxZoom: 14, clusterRadius: 48 });
        map.addLayer({
          id: `clusters-${provider.id}`, type: 'circle', source: `observations-${provider.id}`, filter: ['has', 'point_count'],
          paint: { 'circle-color': provider.color, 'circle-radius': ['step', ['get', 'point_count'], 18, 40, 23, 150, 29], 'circle-stroke-width': 3, 'circle-stroke-color': '#f3f0e5' },
        });
        map.addLayer({
          id: `cluster-count-${provider.id}`, type: 'symbol', source: `observations-${provider.id}`, filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 }, paint: { 'text-color': '#f6f3e9' },
        });
        map.addLayer({
          id: `observation-points-${provider.id}`, type: 'circle', source: `observations-${provider.id}`, filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': pointColor, 'circle-radius': provider.id === 'gbif' ? 7 : 6, 'circle-stroke-width': provider.width, 'circle-stroke-color': provider.stroke },
        });
      }
      map.addSource('hexagons', { type: 'geojson', data: emptyGeoJson });
      map.addLayer({
        id: 'hexagon-fill', type: 'fill', source: 'hexagons',
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'speciesCount'], 1, '#d7e4c8', 5, '#8eaf76', 15, '#396c4e', 35, '#173d2d'],
          'fill-opacity': 0.78,
        },
      });
      map.addLayer({
        id: 'hexagon-line', type: 'line', source: 'hexagons',
        paint: { 'line-color': '#f6f1e4', 'line-width': 1, 'line-opacity': 0.75 },
      });

      for (const provider of ['inaturalist', 'gbif', 'ebird']) {
        map.on('click', `clusters-${provider}`, async (event) => {
          const feature = map.queryRenderedFeatures(event.point, { layers: [`clusters-${provider}`] })[0];
          const clusterId = feature?.properties?.cluster_id as number | undefined;
          if (clusterId == null || feature?.geometry.type !== 'Point') return;
          const source = map.getSource(`observations-${provider}`) as GeoJSONSource;
          const zoom = await source.getClusterExpansionZoom(clusterId);
          map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
        });
        map.on('click', `observation-points-${provider}`, (event) => {
          const props = event.features?.[0]?.properties as ObservationProperties | undefined;
          if (props) onObservationSelect(props);
        });
      }
      map.on('click', 'hexagon-fill', (event) => {
        const props = event.features?.[0]?.properties as HexProperties | undefined;
        if (props) onHexSelect(props);
      });
      for (const layer of ['clusters-inaturalist', 'observation-points-inaturalist', 'clusters-gbif', 'observation-points-gbif', 'clusters-ebird', 'observation-points-ebird', 'hexagon-fill']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }

      containerRef.current?.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        if (button.title === 'Zoom in') button.setAttribute('aria-label', 'Acercar mapa');
        if (button.title === 'Zoom out') button.setAttribute('aria-label', 'Alejar mapa');
      });
      setMapReady(true);
    });
    map.on('error', (event) => {
      if (!loadedRef.current) onWebglError(event.error?.message ?? 'El mapa no pudo cargar su estilo.');
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, [onHexSelect, onObservationSelect, onWebglError]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const radiusPolygon = circle([publicConfig.center.lng, publicConfig.center.lat], filters.radius, { steps: 96, units: 'kilometers' });
    (map.getSource('search-radius') as GeoJSONSource).setData(radiusPolygon);
    const bounds = bbox(radiusPolygon);
    map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], { padding: 58, duration: 700, maxZoom: 15 });
  }, [filters.radius, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource('observations-inaturalist') as GeoJSONSource).setData(inaturalist);
    (map.getSource('observations-gbif') as GeoJSONSource).setData(gbif);
    (map.getSource('observations-ebird') as GeoJSONSource).setData(ebird);
    (map.getSource('hexagons') as GeoJSONSource).setData(hexagons);
  }, [ebird, gbif, hexagons, inaturalist, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const pointsVisibility = filters.view === 'points' ? 'visible' : 'none';
    const hexVisibility = filters.view === 'hexagons' ? 'visible' : 'none';
    for (const layer of ['clusters-inaturalist', 'cluster-count-inaturalist', 'observation-points-inaturalist', 'clusters-gbif', 'cluster-count-gbif', 'observation-points-gbif', 'clusters-ebird', 'cluster-count-ebird', 'observation-points-ebird']) map.setLayoutProperty(layer, 'visibility', pointsVisibility);
    for (const layer of ['hexagon-fill', 'hexagon-line']) map.setLayoutProperty(layer, 'visibility', hexVisibility);
  }, [filters.view, mapReady]);

  return <div ref={containerRef} className="map-canvas" aria-label="Mapa de observaciones alrededor de UAM Cuajimalpa" />;
}
