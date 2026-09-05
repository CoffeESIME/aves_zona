'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="fatal-error"><p className="eyebrow">Islas Vivas</p><h1>La exploración se interrumpió.</h1><p>No pudimos preparar esta página. Tus filtros siguen en la URL.</p><button type="button" onClick={reset}>Volver a intentar</button></main>;
}
