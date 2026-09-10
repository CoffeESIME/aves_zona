'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowIcon } from '@/src/components/icons';
import { LicensedPhoto } from '@/src/components/licensed-photo';
import { parseExplorerFilters } from '@/src/lib/validation/filters';
import type { LossesResponse } from '@/src/types/biodiversity';

const CATEGORY_LABELS = {
  EXTINCT: 'Extinta',
  EXTINCT_IN_THE_WILD: 'Extinta en estado silvestre',
  REGIONALLY_EXTINCT: 'Extinta regionalmente',
} as const;

export function LossArchive() {
  const searchParams = useSearchParams();
  const radius = useMemo(() => parseExplorerFilters(searchParams).radius, [searchParams]);
  const [data, setData] = useState<LossesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    fetch(`/api/biodiversity/losses?radius=${radius}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('No fue posible verificar el archivo de pérdida.');
        return response.json() as Promise<LossesResponse>;
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'No fue posible verificar el archivo de pérdida.');
      });
    return () => controller.abort();
  }, [radius]);

  return (
    <section className="loss-archive" id="perdida" aria-labelledby="loss-title">
      <div className="loss-heading">
        <div>
          <p className="loss-index">ARCHIVO  /  {radius < 1 ? '500 M' : `${radius} KM`}</p>
          <h2 id="loss-title">Lo que ya no<br /><em>podemos encontrar.</em></h2>
        </div>
        <p>Un registro histórico puede conservar la evidencia de una vida ausente. Aquí consultamos categorías de amenaza publicadas, nunca inferimos extinción a partir del silencio del mapa.</p>
      </div>

      {error ? <p className="loss-error" role="alert">{error}</p> : !data ? (
        <div className="loss-loading" aria-label="Verificando archivo de pérdida">Verificando registros históricos en GBIF…</div>
      ) : data.species.length === 0 ? (
        <div className="loss-zero">
          <span aria-hidden="true">0</span>
          <div>
            <p className="loss-stamp">CONSULTA DOCUMENTADA · {new Date(data.meta.generatedAt).toLocaleDateString('es-MX')}</p>
            <h3>No hay coincidencias categorizadas en este radio.</h3>
            <p>GBIF no devolvió registros dentro de {radius < 1 ? '500 m' : `${radius} km`} con las categorías IUCN “Extinta”, “Extinta en estado silvestre” o “Extinta regionalmente”. Es un resultado de búsqueda, no una prueba de que nunca hubo extirpaciones locales.</p>
            <a href="https://www.gbif.org/occurrence/search" target="_blank" rel="noreferrer">Abrir el buscador fuente <ArrowIcon /></a>
          </div>
        </div>
      ) : (
        <div className="loss-grid">
          {data.species.map((species) => (
            <article className="loss-card" key={species.key}>
              <div className="loss-photo"><LicensedPhoto src={species.photoUrl} alt={species.commonName ?? species.scientificName} /></div>
              <div className="loss-copy">
                <span>{CATEGORY_LABELS[species.category]}</span>
                <h3>{species.commonName ?? 'Nombre común no disponible'}</h3>
                <p className="scientific-name">{species.scientificName}</p>
                <p>{species.lastRecorded ? `Último registro recuperado: ${species.lastRecorded.slice(0, 10)}` : 'Fecha histórica no disponible'} · {species.occurrenceCount} registros recuperados</p>
                {species.datasetName && <small>{species.datasetName}</small>}
                <a href={species.evidenceUrl} target="_blank" rel="noreferrer">Examinar evidencia <ArrowIcon /></a>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="loss-caveats">
        <strong>Cómo leer este archivo</strong>
        <p>{data?.caveats[0] ?? 'La categoría procede de IUCN a través de GBIF y no equivale automáticamente a extinción dentro del radio seleccionado.'}</p>
        <p>{data?.caveats[1] ?? 'Las extirpaciones locales requieren literatura o inventarios históricos curados.'}</p>
      </div>
    </section>
  );
}
