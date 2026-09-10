# Decisiones técnicas del MVP

Fecha de verificación: 5 de septiembre de 2026.

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

## GBIF y separación de fuentes

- La segunda fuente usa `GET /occurrence/search` de la API oficial de GBIF con `geoDistance`, `hasCoordinate=true`, `hasGeospatialIssue=false` y `occurrenceStatus=PRESENT`.
- Para complementar iNaturalist sin volver a importar su dataset alojado en GBIF, sólo se solicitan `PRESERVED_SPECIMEN`, `MATERIAL_SAMPLE`, `LIVING_SPECIMEN` y `MACHINE_OBSERVATION`; se excluye `HUMAN_OBSERVATION`.
- El mapa conserva `source`, `datasetName` y `basisOfRecord` normalizado en cada punto. Cada proveedor tiene fuente y cluster propios, por lo que puede activarse aisladamente.
- El filtro de calidad es semántica propia de iNaturalist y no se fuerza sobre GBIF. La interfaz lo advierte junto al control.
- GBIF permite hasta 300 resultados por página y un desplazamiento máximo de 100,000. Este MVP pagina hasta el límite local configurable y marca las respuestas truncadas.
- Al combinar fuentes, el total de riqueza del resumen es una suma por proveedor y puede repetir un taxón. Las tarjetas visibles sí se fusionan por nombre científico, pero no sustituyen una reconciliación taxonómica completa.

### Fuentes evaluadas para una fase posterior

- **eBird API 2.0:** muy útil para observaciones recientes y resúmenes de aves, pero todas las consultas requieren una clave personal. Además, eBird publica periódicamente sus datos básicos en GBIF, por lo que antes de añadirla deberá definirse una deduplicación por checklist/ocurrencia.
- **EncicloVida / SNIB (CONABIO):** es la referencia mexicana idónea para taxonomía, NOM-059, distribución potencial y colecciones nacionales. Su portal es rastreable, pero no se encontró un contrato público estable de API geoespacial apropiado para depender de él en este MVP.
- **Datos espaciales IUCN:** distinguen presencia actual, posiblemente extinta y extinta con criterios explícitos. Su integración directa queda pendiente de revisar descarga, cobertura taxonómica y licencia; por ahora se usa la categoría IUCN indexada en GBIF.

## Archivo de pérdida

- Se consultan las categorías de Lista Roja expuestas por GBIF: `EXTINCT`, `EXTINCT_IN_THE_WILD` y `REGIONALLY_EXTINCT`.
- La consulta verificada para 10 km alrededor de UAM Cuajimalpa devolvió cero coincidencias el 5 de septiembre de 2026. El estado cero se presenta como resultado rastreable, no como prueba de ausencia histórica.
- Una categoría global o regional no implica por sí misma extirpación dentro del radio. El producto no infiere extinción local desde huecos temporales o baja frecuencia; eso requiere fuentes históricas curadas.
- Las imágenes sólo aparecen si el registro GBIF incluye URL y licencia identificable, con atribución preservada.

## Agregación y límites

- H3 se calcula en el navegador a resolución 9 a partir de los puntos devueltos. El color representa especies distintas, no observaciones.
- Si los puntos están truncados, la interfaz etiqueta el mosaico como “Basado en los registros mostrados”.
- Los observadores se cuentan mediante `/observations/observers`. No se estiman valores ausentes.
- Los cinco conteos acumulados de especies se consultan por radio. Las especies añadidas son la diferencia entre conteos anidados; se advierte que las áreas no son equivalentes.

## Caché y despliegue

- Las respuestas públicas incluyen `public, s-maxage=86400, stale-while-revalidate=604800`.
- Next limita su caché de datos a 2 MB por entrada y las páginas completas de observaciones de iNaturalist superan ese tamaño. Esas páginas usan `no-store` internamente; la respuesta normalizada y reducida se cachea en el CDN durante 24 horas. Los conteos externos pequeños sí usan revalidación de 24 horas.
- Next.js produce salida `standalone` para Vercel o Docker. El runtime de API es Node.js.
