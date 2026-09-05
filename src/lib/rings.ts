import { RADII, type RadiusKm, type SummaryResponse } from '@/src/types/biodiversity';

export function buildRings(counts: readonly number[]): SummaryResponse['rings'] {
  return RADII.map((radius: RadiusKm, index) => ({
    radiusKm: radius,
    cumulativeSpecies: counts[index] ?? 0,
    addedSpecies: index === 0 ? null : (counts[index] ?? 0) - (counts[index - 1] ?? 0),
  }));
}
