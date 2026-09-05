import { ArrowIcon } from '@/src/components/icons';
import { TAXON_CONFIG } from '@/src/lib/taxonomy';
import type { SpeciesResponse } from '@/src/types/biodiversity';
import { LicensedPhoto } from '@/src/components/licensed-photo';

type Props = {
  data: SpeciesResponse | null;
  loading: boolean;
  sort: 'frequent' | 'infrequent';
  onSort: (sort: 'frequent' | 'infrequent') => void;
};

export function SpeciesGrid({ data, loading, sort, onSort }: Props) {
  return (
    <section className="species-section" id="especies" aria-labelledby="species-title">
      <div className="section-heading species-heading">
        <div>
          <p className="eyebrow">Índice de campo · registros activos</p>
          <h2 id="species-title">Especies para mirar más de cerca</h2>
        </div>
        <div className="sort-switch" aria-label="Orden de especies">
          <button type="button" className={sort === 'frequent' ? 'active' : ''} onClick={() => onSort('frequent')}>Más observadas</button>
          <button type="button" className={sort === 'infrequent' ? 'active' : ''} onClick={() => onSort('infrequent')}>Menos frecuentes</button>
        </div>
      </div>
      {sort === 'infrequent' && (
        <p className="rare-caveat">Poco registrada no significa ecológicamente rara: también puede reflejar menor esfuerzo de observación.</p>
      )}
      <div className={`species-grid ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
        {data?.species.map((species, index) => (
          <article className="species-card" key={species.taxonId}>
            <div className="species-photo">
              <LicensedPhoto src={species.photoUrl} alt={species.commonName ?? species.scientificName} loading={index < 4 ? 'eager' : 'lazy'} />
              <span className="species-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="species-group" style={{ '--group-color': TAXON_CONFIG[species.iconicGroup].color } as React.CSSProperties}>
                {TAXON_CONFIG[species.iconicGroup].label}
              </span>
            </div>
            <div className="species-copy">
              <p>{species.commonName ?? 'Nombre común no disponible'}</p>
              <h3>{species.scientificName}</h3>
              <div className="species-meta">
                <span>{species.observationCount.toLocaleString('es-MX')} observaciones</span>
                <a href={species.taxonUrl} target="_blank" rel="noreferrer" aria-label={`Ver ${species.scientificName} en iNaturalist`}><ArrowIcon /></a>
              </div>
              {species.photoAttribution && <small>{species.photoAttribution} · {species.photoLicense}</small>}
            </div>
          </article>
        ))}
        {!loading && data?.species.length === 0 && <p className="empty-state">No hay especies registradas con estos filtros. Amplía el radio o el periodo para seguir explorando.</p>}
      </div>
    </section>
  );
}
