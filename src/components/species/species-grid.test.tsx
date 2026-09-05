import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpeciesGrid } from './species-grid';

describe('SpeciesGrid', () => {
  it('muestra fallback cuando no hay foto y permite cambiar el orden', () => {
    const onSort = vi.fn();
    render(<SpeciesGrid loading={false} sort="frequent" onSort={onSort} data={{ meta: { center: { lat: 1, lng: 1, label: 'UAM' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research' }, source: 'iNaturalist', generatedAt: '', totalAvailable: 1, returned: 1, truncated: false }, totalSpecies: 1, species: [{ taxonId: 1, commonName: null, scientificName: 'Quercus sp.', iconicGroup: 'plants', observationCount: 2, photoUrl: null, photoAttribution: null, photoLicense: null, taxonUrl: 'https://www.inaturalist.org/taxa/1' }] }} />);
    expect(screen.getByText('Sin fotografía licenciada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Menos frecuentes' }));
    expect(onSort).toHaveBeenCalledWith('infrequent');
  });
});
