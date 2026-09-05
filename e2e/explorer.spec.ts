import { expect, test } from '@playwright/test';

const observation = {
  type: 'Feature',
  id: 987,
  geometry: { type: 'Point', coordinates: [-99.283, 19.353] },
  properties: {
    id: 987,
    observedOn: '2025-04-12',
    qualityGrade: 'research',
    iconicGroup: 'birds',
    commonName: 'Mirlo primavera',
    scientificName: 'Turdus migratorius',
    taxonId: 123,
    observerName: 'Ana',
    photoUrl: null,
    photoAttribution: null,
    photoLicense: null,
    observationUrl: 'https://www.inaturalist.org/observations/987',
  },
};

test.beforeEach(async ({ page }) => {
  await page.route('**/tiles.openfreemap.org/styles/liberty', (route) => route.fulfill({ json: { version: 8, name: 'Test', sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9e5d9' } }] } }));
  await page.route('**/api/biodiversity/observations?**', (route) => route.fulfill({ json: { meta: { center: { lat: 19.3525, lng: -99.2824, label: 'UAM Cuajimalpa' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research' }, source: 'iNaturalist', generatedAt: '2026-01-01T00:00:00Z', totalAvailable: 1, returned: 1, truncated: false }, geojson: { type: 'FeatureCollection', features: [observation] } } }));
  await page.route('**/api/biodiversity/species?**', (route) => route.fulfill({ json: { meta: { center: { lat: 19.3525, lng: -99.2824, label: 'UAM Cuajimalpa' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research' }, source: 'iNaturalist', generatedAt: '', totalAvailable: 1, returned: 1, truncated: false }, totalSpecies: 1, species: [{ taxonId: 123, commonName: 'Mirlo primavera', scientificName: 'Turdus migratorius', iconicGroup: 'birds', observationCount: 7, photoUrl: null, photoAttribution: null, photoLicense: null, taxonUrl: 'https://www.inaturalist.org/taxa/123' }] } }));
  await page.route('**/api/biodiversity/summary?**', (route) => route.fulfill({ json: { selected: { speciesCount: 18, observationCount: 54, observerCount: 9, groupCount: 4, earliestObservation: '2020-01-01', latestObservation: '2025-04-12', researchGradeCount: 54 }, rings: [{ radiusKm: .5, cumulativeSpecies: 3, addedSpecies: null }, { radiusKm: 1, cumulativeSpecies: 8, addedSpecies: 5 }, { radiusKm: 2, cumulativeSpecies: 18, addedSpecies: 10 }, { radiusKm: 5, cumulativeSpecies: 35, addedSpecies: 17 }, { radiusKm: 10, cumulativeSpecies: 66, addedSpecies: 31 }], caveats: [] } }));
});

test('recorrido principal conserva filtros y permite inspeccionar un registro', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('radio', { name: '2 km' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: '5 km' }).click();
  await page.getByRole('button', { name: 'Aves' }).click();
  await expect(page).toHaveURL(/radius=5.*taxon=birds/);

  await page.getByText('Consultar alternativa textual del mapa').click();
  await page.getByRole('button', { name: /Mirlo primavera/ }).click();
  await expect(page.getByRole('complementary', { name: 'Detalle de observación' })).toContainText('Turdus migratorius');

  await page.getByRole('button', { name: 'Mosaico' }).click();
  await expect(page).toHaveURL(/view=hexagons/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mosaico' })).toHaveAttribute('aria-pressed', 'true');
});
