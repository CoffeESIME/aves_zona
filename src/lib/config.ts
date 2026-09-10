import { z } from 'zod';

const serverConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  gbifApiBaseUrl: z.string().url(),
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().min(1),
  }),
  maxObservations: z.number().int().min(1).max(5000),
  maxGbifObservations: z.number().int().min(1).max(5000),
});

export const serverConfig = serverConfigSchema.parse({
  apiBaseUrl: process.env.INATURALIST_API_BASE_URL ?? 'https://api.inaturalist.org/v1',
  gbifApiBaseUrl: process.env.GBIF_API_BASE_URL ?? 'https://api.gbif.org/v1',
  center: {
    lat: Number(process.env.BIODIVERSITY_CENTER_LAT ?? 19.3525),
    lng: Number(process.env.BIODIVERSITY_CENTER_LNG ?? -99.2824),
    label: process.env.BIODIVERSITY_CENTER_LABEL ?? 'UAM Cuajimalpa',
  },
  maxObservations: Number(process.env.MAX_OBSERVATIONS_PER_QUERY ?? 1000),
  maxGbifObservations: Number(process.env.MAX_GBIF_OBSERVATIONS_PER_QUERY ?? 600),
});

export const publicConfig = {
  center: serverConfig.center,
  mapStyleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
};
