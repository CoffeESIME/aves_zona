import type { DataSource, ObservationsResponse } from '@/src/types/biodiversity';

export const SOURCE_LABELS: Record<DataSource, string> = { inaturalist: 'iNaturalist', gbif: 'GBIF', ebird: 'eBird' };

export function visiblePeriod(data: ObservationsResponse | null, source?: DataSource) {
  const records = data?.geojson.features.filter(feature => !source || feature.properties.source === source) ?? [];
  const dates = records.flatMap(({ properties }) => {
    const day = properties.observedOn?.slice(0, 10);
    return day && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) ? [day] : [];
  }).sort();
  return { from: dates[0] ?? null, to: dates.at(-1) ?? null, count: records.length, undated: records.length - dates.length };
}

export function formatPeriod(from: string | null, to: string | null) {
  const format = (day: string) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
  if (!from || !to) return 'Sin fechas disponibles';
  return from === to ? format(from) : `${format(from)} — ${format(to)}`;
}
