'use client';

import { RADII, type DataSource, type ExplorerFilters, type RadiusKm, type TaxonFilter } from '@/src/types/biodiversity';
import { OTHER_TAXA_DESCRIPTION, TAXON_CONFIG } from '@/src/lib/taxonomy';

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
  const toggleSource = (source: DataSource) => {
    const enabled = filters.sources.includes(source);
    if (enabled && filters.sources.length === 1) return;
    onChange({ sources: enabled ? filters.sources.filter((item) => item !== source) : [...filters.sources, source] });
  };
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

      <div className="filter-block source-block">
        <div className="filter-heading compact">
          <span className="filter-index">02</span>
          <div><h2>Fuentes visibles</h2><p>Combina o aísla la evidencia</p></div>
        </div>
        <div className="source-options" aria-label="Fuentes de datos">
          <button type="button" className={filters.sources.includes('inaturalist') ? 'active inaturalist' : ''} aria-pressed={filters.sources.includes('inaturalist')} onClick={() => toggleSource('inaturalist')} disabled={disabled}>
            <span aria-hidden="true" /> <b>iNaturalist</b><small>comunidad</small>
          </button>
          <button type="button" className={filters.sources.includes('gbif') ? 'active gbif' : ''} aria-pressed={filters.sources.includes('gbif')} onClick={() => toggleSource('gbif')} disabled={disabled}>
            <span aria-hidden="true" /> <b>GBIF</b><small>colecciones y sensores</small>
          </button>
          <button type="button" className={filters.sources.includes('ebird') ? 'active ebird' : ''} aria-pressed={filters.sources.includes('ebird')} onClick={() => toggleSource('ebird')} disabled={disabled}>
            <span aria-hidden="true" /> <b>eBird</b><small>aves · últimos 30 días</small>
          </button>
        </div>
        {filters.sources.includes('ebird') && <p className="source-filter-note">eBird muestra solo aves recientes (30 días), con validación propia. No aporta registros para otros grupos ni para fechas anteriores.</p>}
      </div>

      <div className="filter-block taxon-block">
        <div className="filter-heading compact">
          <span className="filter-index">03</span>
          <div><h2>Grupo de vida</h2><p>Filtra los registros</p></div>
        </div>
        <div className="taxon-options">
          {taxonOptions.map((taxon) => (
            <button
              type="button"
              key={taxon}
              className={filters.taxon === taxon ? 'active' : ''}
              aria-pressed={filters.taxon === taxon}
              title={taxon === 'other' ? OTHER_TAXA_DESCRIPTION : undefined}
              aria-describedby={taxon === 'other' && filters.taxon === 'other' ? 'other-taxa-note' : undefined}
              onClick={() => onChange({ taxon })}
              disabled={disabled}
            >
              <span className="taxon-dot" style={{ background: TAXON_CONFIG[taxon].color }} />
              {TAXON_CONFIG[taxon].label}
              {taxon === 'other' && <sup aria-hidden="true">*</sup>}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-block detail-block">
        <div className="filter-heading compact">
          <span className="filter-index">04</span>
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
        {filters.sources.includes('gbif') && <p className="source-filter-note">La calidad es propia de iNaturalist; GBIF conserva el control de calidad y tipo de evidencia publicado por cada institución.</p>}
      </div>
    </section>
  );
}
