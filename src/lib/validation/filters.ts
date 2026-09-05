import { z } from 'zod';
import type { AppliedFilters, ExplorerFilters } from '@/src/types/biodiversity';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}, 'Fecha inválida');

const radiusSchema = z.preprocess(
  (value) => (typeof value === 'string' ? Number(value) : value),
  z.union([z.literal(0.5), z.literal(1), z.literal(2), z.literal(5), z.literal(10)]),
);

export const apiFiltersSchema = z
  .object({
    radius: radiusSchema,
    taxon: z.enum(['all', 'birds', 'plants', 'insects', 'fungi', 'mammals', 'herps', 'other']),
    quality: z.enum(['research', 'needs_id', 'verifiable']),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: 'La fecha inicial debe ser anterior a la final',
  });

const DEFAULTS: ExplorerFilters = {
  radius: 2,
  taxon: 'all',
  quality: 'research',
  view: 'points',
};

export function parseApiFilters(searchParams: URLSearchParams): AppliedFilters {
  return apiFiltersSchema.parse({
    radius: searchParams.get('radius') ?? DEFAULTS.radius,
    taxon: searchParams.get('taxon') ?? DEFAULTS.taxon,
    quality: searchParams.get('quality') ?? DEFAULTS.quality,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  });
}

export function parseExplorerFilters(searchParams: URLSearchParams): ExplorerFilters {
  const result = apiFiltersSchema.safeParse({
    radius: searchParams.get('radius') ?? DEFAULTS.radius,
    taxon: searchParams.get('taxon') ?? DEFAULTS.taxon,
    quality: searchParams.get('quality') ?? DEFAULTS.quality,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  });
  const view = searchParams.get('view');
  return {
    ...(result.success ? result.data : DEFAULTS),
    view: view === 'hexagons' ? 'hexagons' : 'points',
  };
}

export function serializeFilters(filters: ExplorerFilters): string {
  const params = new URLSearchParams();
  params.set('radius', String(filters.radius));
  params.set('taxon', filters.taxon);
  params.set('quality', filters.quality);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('view', filters.view);
  return params.toString();
}
