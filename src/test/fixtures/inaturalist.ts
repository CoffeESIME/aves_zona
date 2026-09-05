export const rawObservation = {
  id: 987,
  observed_on: '2025-04-12',
  quality_grade: 'research',
  geojson: { type: 'Point' as const, coordinates: [-99.283, 19.353] as [number, number] },
  taxon: {
    id: 123,
    name: 'Turdus migratorius',
    preferred_common_name: 'Mirlo primavera',
    iconic_taxon_name: 'Aves',
  },
  user: { login: 'observadora', name: 'Ana' },
  photos: [
    {
      url: 'https://static.inaturalist.org/photos/1/square.jpg',
      attribution: '(c) Ana, CC BY-NC',
      license_code: 'cc-by-nc',
    },
  ],
  uri: 'https://www.inaturalist.org/observations/987',
};
