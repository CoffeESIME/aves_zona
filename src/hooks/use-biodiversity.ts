'use client';

import { useEffect, useState } from 'react';
import type {
  ExplorerFilters,
  ObservationsResponse,
  SpeciesResponse,
  SummaryResponse,
} from '@/src/types/biodiversity';

type BiodiversityState = {
  observations: ObservationsResponse | null;
  species: SpeciesResponse | null;
  summary: SummaryResponse | null;
  loading: boolean;
  error: string | null;
};

function queryFor(filters: ExplorerFilters) {
  const params = new URLSearchParams({
    radius: String(filters.radius),
    taxon: filters.taxon,
    quality: filters.quality,
  });
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  return params.toString();
}

async function jsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No fue posible cargar los datos.');
  }
  return response.json() as Promise<T>;
}

export function useBiodiversity(filters: ExplorerFilters, speciesSort: 'frequent' | 'infrequent') {
  const [state, setState] = useState<BiodiversityState>({
    observations: null,
    species: null,
    summary: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const query = queryFor(filters);
    setState((current) => ({ ...current, loading: true, error: null }));

    Promise.all([
      fetch(`/api/biodiversity/observations?${query}`, { signal: controller.signal }).then((r) =>
        jsonOrThrow<ObservationsResponse>(r),
      ),
      fetch(
        `/api/biodiversity/species?${query}&sort=${speciesSort === 'infrequent' ? 'infrequent' : 'frequent'}`,
        { signal: controller.signal },
      ).then((r) => jsonOrThrow<SpeciesResponse>(r)),
      fetch(`/api/biodiversity/summary?${query}`, { signal: controller.signal }).then((r) =>
        jsonOrThrow<SummaryResponse>(r),
      ),
    ])
      .then(([observations, species, summary]) => {
        setState({ observations, species, summary, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'No pudimos consultar las observaciones. Intenta nuevamente más tarde.',
        }));
      });

    return () => controller.abort();
  }, [filters, speciesSort]);

  return state;
}
