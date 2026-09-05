# Decisiones técnicas del MVP

Fecha de verificación: 26 de agosto de 2026.

## iNaturalist

- Se usa exclusivamente la API pública v1 desde Route Handlers. El Swagger oficial confirma `lat`, `lng` y `radius` en kilómetros; el navegador nunca puede enviar coordenadas.
- `d1` y `d2` significan fecha de observación, no fecha de creación.
- `quality_grade` admite `research`, `needs_id` y `casual`. La opción de interfaz “verificables” usa `verifiable=true`, equivalente a `needs_id,research` según el Swagger.
- Los filtros taxonómicos usan `iconic_taxa`: Aves, Plantae, Insecta, Fungi, Mammalia, Reptilia y Amphibia. “Otros” reúne los grupos icónicos restantes documentados. El mapeo vive en `src/lib/taxonomy.ts`.
- Las observaciones se recuperan secuencialmente en páginas de hasta 200 usando `id_above`, porque la documentación advierte que `page` no funciona bien con conjuntos grandes.
- El total de especies se toma de `/observations/species_counts`; nunca se infiere de los puntos truncados.
- Sólo se muestran fotos con `license_code`. Se conserva atribución y licencia; no se descargan ni redistribuyen archivos.
- Cada solicitud externa tiene 12 segundos de timeout. iNaturalist documenta un máximo de 100 solicitudes/minuto y recomienda mantenerse en 60 o menos. Conteos y listados pequeños usan revalidación de 24 horas.

## Cartografía

- OpenFreeMap documenta `https://tiles.openfreemap.org/styles/liberty` en su guía rápida vigente. Se usa como fallback verificable porque Positron se presenta como estilo personalizable, no como URL canónica en esa guía.
- La URL permanece configurable con `NEXT_PUBLIC_MAP_STYLE_URL`.
- MapLibre sólo se carga en el cliente. El contenido editorial, filtros y lista textual funcionan cuando WebGL falla.

## Agregación y límites

- H3 se calcula en el navegador a resolución 9 a partir de los puntos devueltos. El color representa especies distintas, no observaciones.
- Si los puntos están truncados, la interfaz etiqueta el mosaico como “Basado en los registros mostrados”.
- Los observadores se cuentan mediante `/observations/observers`. No se estiman valores ausentes.
- Los cinco conteos acumulados de especies se consultan por radio. Las especies añadidas son la diferencia entre conteos anidados; se advierte que las áreas no son equivalentes.

## Caché y despliegue

- Las respuestas públicas incluyen `public, s-maxage=86400, stale-while-revalidate=604800`.
- Next limita su caché de datos a 2 MB por entrada y las páginas completas de observaciones de iNaturalist superan ese tamaño. Esas páginas usan `no-store` internamente; la respuesta normalizada y reducida se cachea en el CDN durante 24 horas. Los conteos externos pequeños sí usan revalidación de 24 horas.
- Next.js produce salida `standalone` para Vercel o Docker. El runtime de API es Node.js.
