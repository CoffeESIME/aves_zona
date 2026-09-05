'use client';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FilterPanel } from '@/src/components/filters/filter-panel';
import { LeafIcon, MapPinIcon } from '@/src/components/icons';
import { MetricsStrip } from '@/src/components/metrics/metrics-strip';
import { ObservationSheet } from '@/src/components/map/observation-sheet';
import { SpeciesGrid } from '@/src/components/species/species-grid';
import { useBiodiversity } from '@/src/hooks/use-biodiversity';
import { parseExplorerFilters, serializeFilters } from '@/src/lib/validation/filters';
import type { ExplorerFilters, HexProperties, ObservationProperties } from '@/src/types/biodiversity';

const BiodiversityMap = dynamic(() => import('@/src/components/map/biodiversity-map'), {
  ssr: false,
  loading: () => <div className="map-skeleton"><span>Preparando el mapa de registros…</span></div>,
});

export function Explorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilters = useMemo(() => parseExplorerFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState<ExplorerFilters>(urlFilters);
  const filtersRef = useRef(filters);
  const [speciesSort, setSpeciesSort] = useState<'frequent' | 'infrequent'>('frequent');
  const [selectedObservation, setSelectedObservation] = useState<ObservationProperties | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexProperties | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const data = useBiodiversity(filters, speciesSort);

  useEffect(() => {
    const canonical = serializeFilters(urlFilters);
    if (searchParams.toString() !== canonical) router.replace(`/?${canonical}`, { scroll: false });
    if (serializeFilters(filtersRef.current) !== canonical) {
      filtersRef.current = urlFilters;
      setFilters(urlFilters);
    }
  }, [router, searchParams, urlFilters]);

  const changeFilters = useCallback(
    (patch: Partial<ExplorerFilters>) => {
      const next = { ...filtersRef.current, ...patch };
      filtersRef.current = next;
      setFilters(next);
      router.replace(`/?${serializeFilters(next)}`, { scroll: false });
      setSelectedObservation(null);
      setSelectedHex(null);
    },
    [router],
  );

  const onObservationSelect = useCallback((observation: ObservationProperties | null) => {
    setSelectedObservation(observation);
    if (observation) setSelectedHex(null);
  }, []);
  const onHexSelect = useCallback((hex: HexProperties | null) => {
    setSelectedHex(hex);
    if (hex) setSelectedObservation(null);
  }, []);
  const closeDetail = useCallback(() => {
    setSelectedObservation(null);
    setSelectedHex(null);
  }, []);
  const onWebglError = useCallback((message: string | null) => setMapError(message), []);

  return (
    <>
      <FilterPanel filters={filters} onChange={changeFilters} />

      {data.error && (
        <div className="data-error" role="alert">
          <strong>No pudimos consultar las observaciones.</strong>
          <span>{data.error}</span>
          <button type="button" onClick={() => router.refresh()}>Intentar nuevamente</button>
        </div>
      )}

      <section className="map-section" id="mapa" aria-labelledby="map-title">
        <div className="map-titlebar">
          <div>
            <p className="eyebrow"><MapPinIcon /> 19.3525, −99.2824</p>
            <h2 id="map-title">El territorio observado</h2>
          </div>
          <div className="view-switch" aria-label="Vista del mapa">
            <button type="button" className={filters.view === 'points' ? 'active' : ''} aria-pressed={filters.view === 'points'} onClick={() => changeFilters({ view: 'points' })}>Puntos</button>
            <button type="button" className={filters.view === 'hexagons' ? 'active' : ''} aria-pressed={filters.view === 'hexagons'} onClick={() => changeFilters({ view: 'hexagons' })}>Mosaico</button>
          </div>
        </div>

        <div className="map-frame">
          <MetricsStrip summary={data.summary} observations={data.observations} loading={data.loading} />
          {mapError ? (
            <div className="map-unavailable" role="status"><MapPinIcon /><h3>El mapa no está disponible</h3><p>{mapError}</p><a href="#especies">Ir a la lista de especies</a></div>
          ) : (
            <BiodiversityMap
              data={data.observations}
              filters={filters}
              onObservationSelect={onObservationSelect}
              onHexSelect={onHexSelect}
              onWebglError={onWebglError}
            />
          )}
          <div className="map-legend" aria-label="Leyenda">
            <span className="legend-title">Riqueza registrada</span>
            <span className="legend-scale" aria-hidden="true" />
            <span>menor</span><span>mayor</span>
            {filters.view === 'hexagons' && data.observations?.meta.truncated && <b>Basado en los registros mostrados</b>}
          </div>
          <ObservationSheet observation={selectedObservation} hex={selectedHex} truncated={data.observations?.meta.truncated ?? false} onClose={closeDetail} />
        </div>
        <p className="science-warning"><LeafIcon /> El mapa muestra especies observadas y registradas en iNaturalist. La ausencia de registros no demuestra la ausencia de vida.</p>
        <details className="observation-list">
          <summary>Consultar alternativa textual del mapa</summary>
          <div>
            {data.observations?.geojson.features.slice(0, 50).map((feature) => (
              <button
                type="button"
                key={feature.properties.id}
                onClick={() => onObservationSelect(feature.properties)}
              >
                <span>{feature.properties.commonName ?? feature.properties.scientificName}</span>
                <em>{feature.properties.scientificName}</em>
                <small>{feature.properties.observedOn?.slice(0, 10) ?? 'Fecha no disponible'}</small>
              </button>
            ))}
            {!data.loading && data.observations?.geojson.features.length === 0 && (
              <p>No hay registros visibles con estos filtros.</p>
            )}
          </div>
          {(data.observations?.geojson.features.length ?? 0) > 50 && (
            <p>La lista muestra los primeros 50 registros; ajusta los filtros para acotarla.</p>
          )}
        </details>
      </section>

      {data.summary && (
        <section className="rings-section" aria-labelledby="rings-title">
          <div><p className="eyebrow">El círculo se abre</p><h2 id="rings-title">¿Qué aparece al ampliar la mirada?</h2></div>
          <div className="rings-list">
            {data.summary.rings.map((ring) => (
              <div className={ring.radiusKm === filters.radius ? 'active' : ''} key={ring.radiusKm}>
                <span>{ring.radiusKm < 1 ? '500 m' : `${ring.radiusKm} km`}</span>
                <strong>{ring.cumulativeSpecies.toLocaleString('es-MX')}</strong>
                <small>{ring.addedSpecies == null ? 'punto de partida' : `+${ring.addedSpecies.toLocaleString('es-MX')} desde el radio anterior`}</small>
              </div>
            ))}
          </div>
          <p>Los anillos cubren áreas diferentes. La progresión describe registros acumulados, no una comparación directa entre superficies equivalentes.</p>
        </section>
      )}

      <SpeciesGrid data={data.species} loading={data.loading} sort={speciesSort} onSort={setSpeciesSort} />
    </>
  );
}
