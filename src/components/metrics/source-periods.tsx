import type { DataSource, ObservationsResponse } from '@/src/types/biodiversity';
import { formatPeriod, SOURCE_LABELS, visiblePeriod } from '@/src/lib/visible-periods';

type Props = { sources: DataSource[]; observations: ObservationsResponse | null; loading: boolean; error: boolean };

export function SourcePeriods({ sources, observations, loading, error }: Props) {
  return <section className="source-periods" aria-label="Periodo visible por fuente" aria-busy={loading}>
    <h3>Periodo visible por fuente</h3>
    <p>Fechas de los registros mostrados en el mapa con los filtros actuales.</p>
    <div className="source-period-list" aria-live="polite">
      {sources.map(source => {
        const period = visiblePeriod(observations, source);
        const provider = observations?.meta.providers?.find(provider => provider.id === source);
        const unavailable = error || !observations || (observations.meta.providers ? !provider : !observations.meta.filters.sources.includes(source));
        const label = loading ? 'Consultando periodo…' : unavailable ? 'Fuente no disponible' : !period.count ? 'Sin registros con estos filtros' : formatPeriod(period.from, period.to);
        return <div className={`source-period ${source}`} key={source}>
          <h4>{SOURCE_LABELS[source]}</h4><p>{label}</p>
          {source === 'ebird' && <small>Consulta limitada a los últimos 30 días.</small>}
          {!loading && !unavailable && provider?.truncated && <small>Periodo de la muestra mostrada; puede haber registros fuera de este intervalo.</small>}
          {!loading && !unavailable && period.undated > 0 && <small>{period.undated} registros sin fecha utilizable.</small>}
        </div>;
      })}
    </div>
  </section>;
}
