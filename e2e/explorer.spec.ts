import { expect, test } from '@playwright/test';

const observation = {
  type: 'Feature',
  id: 987,
  geometry: { type: 'Point', coordinates: [-99.283, 19.353] },
  properties: {
    id: 987,
    source: 'inaturalist',
    sourceLabel: 'iNaturalist',
    datasetName: 'iNaturalist Research-grade Observations',
    recordType: 'Observación comunitaria',
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
  await page.route('**/api/biodiversity/observations?**', (route) => route.fulfill({ json: { meta: { center: { lat: 19.3525, lng: -99.2824, label: 'UAM Cuajimalpa' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research', sources: ['inaturalist', 'gbif'] }, source: 'iNaturalist + GBIF', generatedAt: '2026-01-01T00:00:00Z', totalAvailable: 1, returned: 1, truncated: false }, geojson: { type: 'FeatureCollection', features: [observation] } } }));
  await page.route('**/api/biodiversity/species?**', (route) => route.fulfill({ json: { meta: { center: { lat: 19.3525, lng: -99.2824, label: 'UAM Cuajimalpa' }, radiusKm: 2, filters: { radius: 2, taxon: 'all', quality: 'research', sources: ['inaturalist', 'gbif'] }, source: 'iNaturalist + GBIF', generatedAt: '', totalAvailable: 1, returned: 1, truncated: false }, totalSpecies: 1, species: [{ taxonId: 123, source: 'inaturalist', sourceLabel: 'iNaturalist', commonName: 'Mirlo primavera', scientificName: 'Turdus migratorius', iconicGroup: 'birds', observationCount: 7, photoUrl: null, photoAttribution: null, photoLicense: null, taxonUrl: 'https://www.inaturalist.org/taxa/123' }] } }));
  await page.route('**/api/biodiversity/summary?**', (route) => route.fulfill({ json: { selected: { speciesCount: 18, observationCount: 54, observerCount: 9, groupCount: 4, earliestObservation: '2020-01-01', latestObservation: '2025-04-12', researchGradeCount: 54 }, rings: [{ radiusKm: .5, cumulativeSpecies: 3, addedSpecies: null }, { radiusKm: 1, cumulativeSpecies: 8, addedSpecies: 5 }, { radiusKm: 2, cumulativeSpecies: 18, addedSpecies: 10 }, { radiusKm: 5, cumulativeSpecies: 35, addedSpecies: 17 }, { radiusKm: 10, cumulativeSpecies: 66, addedSpecies: 31 }], caveats: [] } }));
  await page.route('**/api/biodiversity/losses?**', (route) => route.fulfill({ json: { meta: { center: { lat: 19.3525, lng: -99.2824, label: 'UAM Cuajimalpa' }, radiusKm: 2, source: 'GBIF', generatedAt: '2026-09-05T00:00:00Z', totalOccurrences: 0 }, species: [], caveats: ['La categoría llega de IUCN mediante GBIF.', 'Cero coincidencias no prueba ausencia histórica.'] } }));
});

test('recorrido principal conserva filtros y permite inspeccionar un registro', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('radio', { name: '1 km', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: /iNaturalist/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /GBIF/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(page).toHaveURL(/sources=inaturalist/);
  await page.getByRole('radio', { name: '5 km' }).click();
  await page.getByRole('button', { name: 'Aves', exact: true }).click();
  await expect(page).toHaveURL(/radius=5.*taxon=birds/);

  await page.getByText('Consultar alternativa textual del mapa').click();
  await page.getByRole('button', { name: /Mirlo primavera/ }).click();
  await expect(page.getByRole('complementary', { name: 'Detalle de observación' })).toContainText('Turdus migratorius');

  await page.getByRole('button', { name: 'Mosaico' }).click();
  await expect(page).toHaveURL(/view=hexagons/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mosaico' })).toHaveAttribute('aria-pressed', 'true');
});

test('eBird se puede aislar y la ficha carga galería, audio y conservación', async ({ page }, testInfo) => {
  await page.route('**/api/biodiversity/bird-details?**', route => route.fulfill({ json: {
    taxonUrl: 'https://www.inaturalist.org/taxa/123',
    photos: [{ url: '/fallback-species.svg', attribution: 'Fotógrafa de prueba', license: 'cc-by', evidenceUrl: 'https://www.inaturalist.org/photos/1' }],
    sounds: [{ url: '/test-recording.mp3', attribution: 'Grabadora de prueba', license: 'cc-by-sa', evidenceUrl: 'https://www.inaturalist.org/observations/1' }],
    conservation: [{ status: 'EN', label: 'En peligro', authority: 'IUCN Red List', scope: 'Global', url: 'https://www.iucnredlist.org' }], notices: [],
  } }));
  await page.goto('/');
  await page.getByRole('button', { name: /eBird/ }).click();
  await page.getByRole('button', { name: /iNaturalist/ }).click();
  await page.getByRole('button', { name: 'Aves', exact: true }).click();
  await expect(page).toHaveURL(/sources=ebird/);
  await page.reload();
  await expect(page.getByRole('button', { name: /eBird/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByText('Galería, sonidos y conservación', { exact: true }).click();
  await expect(page.getByText('En peligro (EN)')).toBeVisible();
  await expect(page.getByText('IUCN Red List · Global')).toBeVisible();
  await expect(page.getByText('Fotógrafa de prueba · cc-by')).toBeVisible();
  await expect(page.locator('audio')).toHaveAttribute('preload', 'none');
  await expect(page.locator('audio')).toHaveAttribute('controls', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('bird-details.png'), fullPage: true });
});

test('muestra periodos de las fuentes activas y explica Otros', async ({ page }) => {
  await page.goto('/');
  const periods = page.getByRole('region', { name: 'Periodo visible por fuente' });
  await expect(periods.getByRole('heading', { name: 'iNaturalist', exact: true })).toBeVisible();
  await expect(periods.getByText(/2025/)).toBeVisible();
  await expect(periods.getByRole('heading', { name: 'GBIF', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /GBIF/ }).click();
  await expect(periods.getByRole('heading', { name: 'GBIF', exact: true })).toBeVisible();
  await expect(periods.getByText('Sin registros con estos filtros')).toBeVisible();
  await page.getByRole('button', { name: 'Otros', exact: true }).click();
  await expect(page.getByRole('note')).toContainText('peces, arácnidos, moluscos');
  await page.getByRole('button', { name: 'Aves', exact: true }).click();
  await expect(page.getByRole('note')).toHaveCount(0);
  await expect(page.locator('#perdida')).toHaveCount(0);
});
