# Islas Vivas

Aplicación pública para explorar la biodiversidad registrada alrededor de la UAM Cuajimalpa. Combina evidencia separable de iNaturalist y GBIF, un mapa MapLibre, mosaico H3, filtros compartibles y un archivo trazable de pérdida de diversidad.

> El mapa representa registros públicos, no un inventario completo. La ausencia de registros no demuestra ausencia de vida ni extinción local.

## Requisitos

- Node.js 22
- pnpm 10

## Desarrollo

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. La verificación de salud está en `http://localhost:3000/api/health`.

## Variables de entorno

| Variable | Uso | Predeterminado |
| --- | --- | --- |
| `INATURALIST_API_BASE_URL` | API externa, sólo servidor | `https://api.inaturalist.org/v1` |
| `GBIF_API_BASE_URL` | API de ocurrencias institucionales, sólo servidor | `https://api.gbif.org/v1` |
| `BIODIVERSITY_CENTER_LAT` | Latitud del centro fijo | `19.3525` |
| `BIODIVERSITY_CENTER_LNG` | Longitud del centro fijo | `-99.2824` |
| `BIODIVERSITY_CENTER_LABEL` | Etiqueta del centro | `UAM Cuajimalpa` |
| `MAX_OBSERVATIONS_PER_QUERY` | Límite de puntos | `1000` |
| `MAX_GBIF_OBSERVATIONS_PER_QUERY` | Límite de puntos GBIF | `600` |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Estilo MapLibre | OpenFreeMap Liberty |
| `NEXT_PUBLIC_SITE_URL` | URL canónica local/pública | `http://localhost:3000` |

No hay secretos `NEXT_PUBLIC_*` ni base de datos.

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright test
```

Las pruebas unitarias usan datos pequeños y anonimizados. El E2E intercepta API y estilo cartográfico, por lo que no depende de iNaturalist.

## API interna

- `GET /api/biodiversity/observations`
- `GET /api/biodiversity/species`
- `GET /api/biodiversity/summary`
- `GET /api/biodiversity/losses`
- `GET /api/health`

Filtros: `radius`, `taxon`, `quality`, `sources`, `from`, `to`. `sources` acepta `inaturalist`, `gbif` o ambos separados por coma. La ruta de especies acepta además `sort=infrequent`. Coordenadas y parámetros desconocidos devuelven 400.

## Metodología y privacidad

iNaturalist aporta observaciones comunitarias. GBIF se limita a ejemplares preservados o vivos, muestras materiales y observaciones por máquina para no reimportar las observaciones humanas de iNaturalist publicadas también en GBIF. El mosaico H3 se calcula con los puntos visibles y comunica cuando la consulta está truncada.

El archivo de pérdida consulta en GBIF las categorías IUCN `EXTINCT`, `EXTINCT_IN_THE_WILD` y `REGIONALLY_EXTINCT` dentro del radio. No deduce extinción por ausencia de registros: una extirpación local sólo puede afirmarse con inventarios o literatura histórica curada.

Las fotos se enlazan desde iNaturalist sólo cuando incluyen licencia y mantienen atribución. La aplicación no solicita ubicación personal, no usa autenticación, cookies no esenciales ni analítica invasiva. Las decisiones verificadas están en [docs/decisions.md](docs/decisions.md).

## Vercel

1. Importa el repositorio.
2. Vercel detectará Next.js y pnpm desde `packageManager`.
3. Configura las variables de `.env.example`.
4. Ejecuta `pnpm build` y verifica `/api/health`.

No se necesita `vercel.json`.

## Docker

```bash
docker build -t islas-vivas .
docker run --rm -p 3000:3000 --env-file .env islas-vivas
```

La imagen multi-stage ejecuta la salida standalone como usuario sin privilegios.
