'use client';

import { RADII, type ExplorerFilters, type RadiusKm, type TaxonFilter } from '@/src/types/biodiversity';
import { TAXON_CONFIG } from '@/src/lib/taxonomy';

type Props = {
  filters: ExplorerFilters;
  onChange: (patch: Partial<ExplorerFilters>) => void;
  disabled?: boolean;
};

const taxonOptions = Object.keys(TAXON_CONFIG) as TaxonFilter[];

function dateBefore(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
}

export function FilterPanel({ filters, onChange, disabled }: Props) {
  return (
    <section className="filter-panel" aria-label="Filtros de observaciones">
      <div className="filter-block radius-block">
        <div className="filter-heading">
          <span className="filter-index">01</span>
          <div>
            <h2>Distancia desde la UAM</h2>
            <p>Radio de exploración</p>
          </div>
          <output aria-live="polite">{filters.radius < 1 ? '500 m' : `${filters.radius} km`}</output>
        </div>
        <div className="radius-options" role="radiogroup" aria-label="Radio de búsqueda">
          {RADII.map((radius) => (
            <button
              key={radius}
              type="button"
              role="radio"
              aria-checked={filters.radius === radius}
              className={filters.radius === radius ? 'active' : ''}
              onClick={() => onChange({ radius: radius as RadiusKm })}
              disabled={disabled}
            >
              {radius < 1 ? '500 m' : `${radius} km`}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-block taxon-block">
        <div className="filter-heading compact">
          <span className="filter-index">02</span>
          <div><h2>Grupo de vida</h2><p>Filtra los registros</p></div>
        </div>
        <div className="taxon-options">
          {taxonOptions.map((taxon) => (
            <button
              type="button"
              key={taxon}
              className={filters.taxon === taxon ? 'active' : ''}
              aria-pressed={filters.taxon === taxon}
              onClick={() => onChange({ taxon })}
              disabled={disabled}
            >
              <span className="taxon-dot" style={{ background: TAXON_CONFIG[taxon].color }} />
              {TAXON_CONFIG[taxon].label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-block detail-block">
        <div className="filter-heading compact">
          <span className="filter-index">03</span>
          <div><h2>Tiempo y calidad</h2><p>Fecha de observación</p></div>
        </div>
        <div className="filter-fields">
          <label>
            <span>Desde</span>
            <input
              type="date"
              value={filters.from ?? ''}
              max={filters.to}
              onChange={(event) => onChange({ from: event.target.value || undefined })}
              disabled={disabled}
            />
          </label>
          <label>
            <span>Hasta</span>
            <input
              type="date"
              value={filters.to ?? ''}
              min={filters.from}
              onChange={(event) => onChange({ to: event.target.value || undefined })}
              disabled={disabled}
            />
          </label>
          <label className="quality-field">
            <span>Calidad</span>
            <select
              value={filters.quality}
              onChange={(event) => onChange({ quality: event.target.value as ExplorerFilters['quality'] })}
              disabled={disabled}
            >
              <option value="research">Grado de investigación</option>
              <option value="needs_id">Necesita identificación</option>
              <option value="verifiable">Todos los verificables</option>
            </select>
          </label>
        </div>
        <div className="date-shortcuts" aria-label="Periodos rápidos">
          <button type="button" onClick={() => onChange({ from: undefined, to: undefined })}>Todo el periodo</button>
          <button type="button" onClick={() => onChange({ from: dateBefore(1), to: undefined })}>Último año</button>
          <button type="button" onClick={() => onChange({ from: dateBefore(5), to: undefined })}>Últimos cinco años</button>
        </div>
      </div>
    </section>
  );
}
