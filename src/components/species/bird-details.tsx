'use client';
import { useEffect, useState } from 'react';
import type { BirdDetails as Details } from '@/src/types/bird-details';
import { LicensedPhoto } from '@/src/components/licensed-photo';

export function BirdDetails({ name, ebirdUrl }: { name: string; ebirdUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setData(null); setError(null);
    fetch(`/api/biodiversity/bird-details?${new URLSearchParams({ name })}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('No se pudo cargar la ficha.');
      return response.json() as Promise<Details>;
    }).then(setData).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [name, open, attempt]);
  return <details className="bird-details" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Galería, sonidos y conservación</summary>
    {open && <div className="bird-details-content" tabIndex={0} aria-label={`Ficha complementaria de ${name}`}>
      <p>Ficha complementaria de iNaturalist. Fotos y grabaciones de la especie en distintas regiones; no prueban su presencia en esta zona.</p>
      {!data && !error && <p role="status">Cargando ficha…</p>}
      {error && <p role="alert">{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></p>}
      {data && <>
        <h4>Galería</h4>
        <div className="bird-gallery">{data.photos.map(photo => <figure key={photo.url}>
          <a href={photo.evidenceUrl} target="_blank" rel="noreferrer"><LicensedPhoto src={photo.url} alt={name} loading="eager" /></a>
          <figcaption>{photo.attribution} · {photo.license}</figcaption>
        </figure>)}</div>
        {!data.photos.length && <p>No hay fotos con licencia reutilizable disponibles.</p>}
        <h4>Cantos y otras vocalizaciones</h4>
        {data.sounds.map((sound, index) => <figure className="bird-audio" key={sound.url}>
          <audio controls preload="none" src={sound.url} aria-label={`Grabación ${index + 1} de ${name}`} />
          <figcaption><a href={sound.evidenceUrl} target="_blank" rel="noreferrer">{sound.attribution}</a> · {sound.license}</figcaption>
        </figure>)}
        {!data.sounds.length && <p>No hay grabaciones con licencia reutilizable disponibles.</p>}
        <h4>Estado de conservación</h4>
        <p>La categoría depende de la autoridad y la región. No describe por sí sola la población de la UAM.</p>
        {data.conservation.length ? <ul className="conservation-list">{data.conservation.map((status, index) => <li key={index}>
          <strong>{status.label} ({status.status})</strong><span>{status.authority} · {status.scope}</span>
          {status.url && <a href={status.url} target="_blank" rel="noreferrer">Consultar evaluación</a>}
        </li>)}</ul> : <p>Sin evaluación disponible en esta fuente. No equivale a estar fuera de peligro.</p>}
        {data.notices.map(notice => <p key={notice} role="status">{notice}</p>)}
        {data.notices.length > 0 && <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar ficha</button>}
        {data.taxonUrl && <a href={data.taxonUrl} target="_blank" rel="noreferrer">Ficha completa en iNaturalist</a>}
      </>}
      {ebirdUrl && <p><a href={ebirdUrl} target="_blank" rel="noreferrer">Explorar fotos y sonidos en eBird / Macaulay Library</a></p>}
    </div>}
  </details>;
}
