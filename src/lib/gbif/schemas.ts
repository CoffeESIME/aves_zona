import { z } from 'zod';

export const gbifMediaSchema = z.object({
  identifier: z.string().optional(),
  references: z.string().optional(),
  license: z.string().optional(),
  creator: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional(),
});

export const gbifOccurrenceSchema = z.object({
  key: z.number().int(),
  decimalLatitude: z.number().min(-90).max(90).optional(),
  decimalLongitude: z.number().min(-180).max(180).optional(),
  eventDate: z.string().optional(),
  year: z.number().int().optional(),
  basisOfRecord: z.string().optional(),
  scientificName: z.string().optional(),
  species: z.string().optional(),
  class: z.string().optional(),
  kingdom: z.string().optional(),
  speciesKey: z.number().int().optional(),
  taxonKey: z.number().int().optional(),
  vernacularName: z.string().optional(),
  recordedBy: z.string().optional(),
  datasetTitle: z.string().optional(),
  iucnRedListCategory: z.string().optional(),
  media: z.array(gbifMediaSchema).optional().default([]),
});

const facetSchema = z.object({
  field: z.string(),
  counts: z.array(z.object({ name: z.string(), count: z.number().int().nonnegative() })),
});

export const gbifSearchResponseSchema = z.object({
  offset: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  endOfRecords: z.boolean(),
  count: z.number().int().nonnegative(),
  results: z.array(gbifOccurrenceSchema),
  facets: z.array(facetSchema).optional().default([]),
});

export type RawGBIFOccurrence = z.infer<typeof gbifOccurrenceSchema>;
