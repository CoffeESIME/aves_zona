import { CloseIcon, ArrowIcon } from '@/src/components/icons';
import { TAXON_CONFIG } from '@/src/lib/taxonomy';
import type { HexProperties, ObservationProperties } from '@/src/types/biodiversity';
import { LicensedPhoto } from '@/src/components/licensed-photo';

type Props = {
  observation: ObservationProperties | null;
  hex: HexProperties | null;
  truncated: boolean;
  onClose: () => void;
};

const qualityLabels: Record<string, string> = {
  research: 'Grado de investigación',
  needs_id: 'Necesita identificación',
  casual: 'Casual',
};

export function ObservationSheet({ observation, hex, truncated, onClose }: Props) {
  if (!observation && !hex) return null;
  return (
    <aside className="observation-sheet" aria-live="polite" aria-label={observation ? 'Detalle de observación' : 'Detalle de celda'}>
      <button type="button" className="sheet-close" onClick={onClose} aria-label="Cerrar detalle"><CloseIcon /></button>
      {observation ? (
        <>
          <div className="sheet-photo">
            <LicensedPhoto src={observation.photoUrl} alt={observation.commonName ?? observation.scientificName} loading="eager" />
          </div>
          <div className="sheet-content">
            <p className="sheet-kicker"><span style={{ background: TAXON_CONFIG[observation.iconicGroup].color }} />{TAXON_CONFIG[observation.iconicGroup].label}</p>
            <p className={`source-badge ${observation.source}`}>{observation.sourceLabel}</p>
            <h3>{observation.commonName ?? 'Nombre común no disponible'}</h3>
            <p className="scientific-name">{observation.scientificName}</p>
            <dl>
              <div><dt>Observada</dt><dd>{observation.observedOn ? new Date(`${observation.observedOn.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { dateStyle: 'long' }) : 'No disponible'}</dd></div>
              <div><dt>Calidad</dt><dd>{qualityLabels[observation.qualityGrade] ?? observation.qualityGrade}</dd></div>
              <div><dt>Observador</dt><dd>{observation.observerName ?? 'No disponible'}</dd></div>
              {observation.recordType && <div><dt>Evidencia</dt><dd>{observation.recordType}</dd></div>}
              {observation.datasetName && <div><dt>Colección</dt><dd>{observation.datasetName}</dd></div>}
            </dl>
            {observation.photoAttribution && <p className="photo-credit">Foto: {observation.photoAttribution} · {observation.photoLicense}</p>}
            <a className="inat-link" href={observation.observationUrl} target="_blank" rel="noreferrer">Ver registro en {observation.sourceLabel} <ArrowIcon /></a>
          </div>
        </>
      ) : hex ? (
        <div className="sheet-content hex-detail">
          <p className="sheet-kicker">Mosaico de riqueza registrada</p>
          <h3>{hex.speciesCount} especies registradas</h3>
          <p>{hex.observationCount} observaciones · {hex.observerCount} observadores · {hex.groupCount} grupos</p>
          {truncated && <small>Basado en los registros mostrados; la consulta está truncada.</small>}
        </div>
      ) : null}
    </aside>
  );
}
