import type { ObservationsResponse, SummaryResponse } from '@/src/types/biodiversity';

type Props = {
  summary: SummaryResponse | null;
  observations: ObservationsResponse | null;
  loading: boolean;
};

const formatter = new Intl.NumberFormat('es-MX');

function dateLabel(value: string | null | undefined) {
  if (!value) return 'No disponible';
  return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short' }).format(
    new Date(`${value.slice(0, 10)}T12:00:00`),
  );
}

export function MetricsStrip({ summary, observations, loading }: Props) {
  const selected = summary?.selected;
  const combined = observations?.meta.source === 'iNaturalist + GBIF';
  const researchPercent =
    selected?.researchGradeCount != null && selected.observationCount > 0
      ? Math.round((selected.researchGradeCount / selected.observationCount) * 100)
      : null;
  const metrics = [
    [combined ? 'Especies · suma fuentes' : 'Especies registradas', selected ? formatter.format(selected.speciesCount) : '—'],
    [combined ? 'Registros · suma fuentes' : 'Observaciones', selected ? formatter.format(selected.observationCount) : '—'],
    ['Grupos', selected ? formatter.format(selected.groupCount) : '—'],
    ['Observadores', selected?.observerCount != null ? formatter.format(selected.observerCount) : '—'],
    ['Periodo visible', selected ? `${dateLabel(selected.earliestObservation)} — ${dateLabel(selected.latestObservation)}` : '—'],
    ['Grado investigación', researchPercent == null ? '—' : `${researchPercent}%`],
  ];

  return (
    <div className={`metrics-strip ${loading ? 'is-loading' : ''}`} aria-busy={loading} aria-live="polite">
      {metrics.map(([label, value]) => (
        <div className="metric" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      {observations?.meta.truncated && (
        <p className="truncation-note">
          Mostrando {formatter.format(observations.meta.returned)} de{' '}
          {formatter.format(observations.meta.totalAvailable)} observaciones.
        </p>
      )}
    </div>
  );
}
