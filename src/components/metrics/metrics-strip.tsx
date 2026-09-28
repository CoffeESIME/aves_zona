import type { ObservationsResponse, SummaryResponse } from '@/src/types/biodiversity';
import { formatPeriod, visiblePeriod } from '@/src/lib/visible-periods';

type Props = {
  summary: SummaryResponse | null;
  observations: ObservationsResponse | null;
  loading: boolean;
};

const formatter = new Intl.NumberFormat('es-MX');

export function MetricsStrip({ summary, observations, loading }: Props) {
  const selected = summary?.selected;
  const period = visiblePeriod(observations);
  const combined = (observations?.meta.source.includes(' + ') ?? false);
  const researchPercent =
    selected?.researchGradeCount != null && selected.observationCount > 0
      ? Math.round((selected.researchGradeCount / selected.observationCount) * 100)
      : null;
  const metrics = [
    [combined ? 'Especies · suma fuentes' : 'Especies registradas', selected ? formatter.format(selected.speciesCount) : '—'],
    [combined ? 'Registros · suma fuentes' : 'Observaciones', selected ? formatter.format(selected.observationCount) : '—'],
    ['Grupos', selected ? formatter.format(selected.groupCount) : '—'],
    ['Observadores', selected?.observerCount != null ? formatter.format(selected.observerCount) : '—'],
    ['Periodo visible', loading ? 'Consultando…' : observations ? formatPeriod(period.from, period.to) : '—'],
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
