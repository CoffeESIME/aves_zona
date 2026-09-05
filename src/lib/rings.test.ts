import { expect, it } from 'vitest';
import { buildRings } from './rings';

it('calcula especies añadidas entre radios acumulados', () => {
  expect(buildRings([3, 7, 12, 25, 40]).map((ring) => ring.addedSpecies)).toEqual([null, 4, 5, 13, 15]);
});
