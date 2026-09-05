import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MetricsStrip } from './metrics-strip';

it('comunica cuando el mapa usa una muestra truncada', () => {
  render(<MetricsStrip loading={false} summary={null} observations={{ meta: { center: { lat: 1, lng: 1, label: 'UAM' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research' }, source: 'iNaturalist', generatedAt: '', totalAvailable: 5000, returned: 1000, truncated: true }, geojson: { type: 'FeatureCollection', features: [] } }} />);
  expect(screen.getByText(/Mostrando 1,000 de 5,000 observaciones/)).toBeInTheDocument();
});
