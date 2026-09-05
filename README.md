# Islas Vivas

Aplicación pública para explorar la biodiversidad registrada alrededor de la UAM Cuajimalpa. Combina un mapa MapLibre, agrupamiento de observaciones, mosaico H3 de riqueza registrada, filtros compartibles y fichas con atribución.

> El mapa representa registros de iNaturalist, no un inventario completo. La ausencia de registros no demuestra la ausencia de vida.

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
| `BIODIVERSITY_CENTER_LAT` | Latitud del centro fijo | `19.3525` |
| `BIODIVERSITY_CENTER_LNG` | Longitud del centro fijo | `-99.2824` |
| `BIODIVERSITY_CENTER_LABEL` | Etiqueta del centro | `UAM Cuajimalpa` |
| `MAX_OBSERVATIONS_PER_QUERY` | Límite de puntos | `1000` |
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
- `GET /api/health`

Filtros: `radius`, `taxon`, `quality`, `from`, `to`. La ruta de especies acepta además `sort=infrequent` para la variante de presentación. Coordenadas y parámetros desconocidos devuelven 400.

## Metodología y privacidad

El total de especies proviene de `/observations/species_counts`, separado de la muestra de hasta 1,000 puntos. El mosaico H3 sí se calcula con los puntos visibles y lo comunica cuando la consulta está truncada. Sólo se usan coordenadas públicas devueltas por iNaturalist; los campos privados no forman parte de los esquemas ni del contrato normalizado.

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
