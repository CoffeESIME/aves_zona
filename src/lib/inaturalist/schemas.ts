import { z } from 'zod';

export const photoSchema = z.object({
  url: z.string().url(),
  attribution: z.string().nullable().optional(),
  license_code: z.string().nullable().optional(),
});

export const taxonSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  preferred_common_name: z.string().nullable().optional(),
  iconic_taxon_name: z.string().nullable().optional(),
  default_photo: photoSchema.nullable().optional(),
});

export const observationSchema = z.object({
  id: z.number().int(),
  observed_on: z.string().nullable().optional(),
  quality_grade: z.string(),
  geojson: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .nullable()
    .optional(),
  taxon: taxonSchema.nullable().optional(),
  species_guess: z.string().nullable().optional(),
  user: z
    .object({
      login: z.string().nullable().optional(),
      name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  photos: z.array(photoSchema).optional().default([]),
  uri: z.string().url().optional(),
});

export const observationsResponseSchema = z.object({
  total_results: z.number().int().nonnegative(),
  page: z.number().int().optional(),
  per_page: z.number().int().optional(),
  results: z.array(observationSchema),
});

export const speciesCountSchema = z.object({
  count: z.number().int().nonnegative(),
  taxon: taxonSchema,
});

export const speciesCountsResponseSchema = z.object({
  total_results: z.number().int().nonnegative(),
  page: z.number().int().optional(),
  per_page: z.number().int().optional(),
  results: z.array(speciesCountSchema),
});

export const countResponseSchema = z.object({
  total_results: z.number().int().nonnegative(),
  results: z.array(z.unknown()),
});

export type RawObservation = z.infer<typeof observationSchema>;
export type RawSpeciesCount = z.infer<typeof speciesCountSchema>;
