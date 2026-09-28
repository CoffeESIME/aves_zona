import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SourcePeriods } from './source-periods';
import { visiblePeriod } from '@/src/lib/visible-periods';
import type { ObservationsResponse } from '@/src/types/biodiversity';
afterEach(cleanup);

const data = {
  meta: { filters: { sources: ['inaturalist', 'gbif', 'ebird'] }, providers: [{ id: 'inaturalist', truncated: true }, { id: 'gbif', truncated: false }] },
  geojson: { features: [
    { properties: { source: 'inaturalist', observedOn: '2020-05-02' } },
    { properties: { source: 'inaturalist', observedOn: '2026-09-20' } },
    { properties: { source: 'gbif', observedOn: '1987-02-01' } },
    { properties: { source: 'gbif', observedOn: null } },
  ] },
} as ObservationsResponse;

it('separa fechas por fuente y distingue fuente fallida de ausencia de registros', () => {
  render(<SourcePeriods sources={['inaturalist', 'gbif', 'ebird']} observations={data} loading={false} error={false} />);
  const inat = screen.getByRole('heading', { name: 'iNaturalist' }).parentElement!;
  expect(within(inat).getByText(/2020.*2026/)).toBeInTheDocument();
  expect(within(inat).getByText(/muestra mostrada/)).toBeInTheDocument();
  const gbif = screen.getByRole('heading', { name: 'GBIF' }).parentElement!;
  expect(within(gbif).getByText(/1987/)).toBeInTheDocument();
  expect(within(gbif).getByText(/1 registros sin fecha/)).toBeInTheDocument();
  expect(screen.getByText('Fuente no disponible')).toBeInTheDocument();
  expect(visiblePeriod(data)).toMatchObject({ from: '1987-02-01', to: '2026-09-20' });
});

it('oculta fechas anteriores durante la carga y solo presenta fuentes seleccionadas', () => {
  render(<SourcePeriods sources={['inaturalist']} observations={data} loading error={false} />);
  expect(screen.getByText('Consultando periodo…')).toBeInTheDocument();
  expect(screen.queryByText(/1987/)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'GBIF' })).not.toBeInTheDocument();
});
