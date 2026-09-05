import { Suspense } from 'react';
import { Explorer } from '@/src/components/explorer';
import { ArrowIcon, LeafIcon, MapPinIcon } from '@/src/components/icons';

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Islas Vivas, volver al inicio"><LeafIcon /><span>ISLAS<br />VIVAS</span></a>
        <nav aria-label="Navegación principal"><a href="#mapa">Explorar mapa</a><a href="#especies">Especies</a><a href="#metodologia">Metodología</a></nav>
        <a className="source-link" href="https://www.inaturalist.org" target="_blank" rel="noreferrer">Datos de iNaturalist <ArrowIcon /></a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Biodiversidad urbana · Cuajimalpa, CDMX</p>
          <h1>Entre edificios,<br />avenidas y concreto,<br /><em>la vida persiste.</em></h1>
          <p className="hero-lead">Explora las especies registradas alrededor de la UAM Cuajimalpa. Amplía el círculo y observa cómo los fragmentos verdes sostienen una vida que suele pasar inadvertida.</p>
          <a className="explore-link" href="#mapa">Comenzar a explorar <span><ArrowIcon /></span></a>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-1" /><div className="orbit orbit-2" /><div className="orbit orbit-3" />
          <div className="campus-point"><MapPinIcon /><span>UAM<br />Cuajimalpa</span></div>
          <span className="orbit-note note-a">barrancas</span><span className="orbit-note note-b">jardines</span><span className="orbit-note note-c">parques</span>
        </div>
        <div className="hero-footnote"><span>19°21′ N</span><span>99°17′ O</span><p>Un atlas vivo de observaciones públicas.</p></div>
      </section>

      <div className="content-shell">
        <Suspense fallback={<div className="page-loading">Preparando la exploración…</div>}><Explorer /></Suspense>

        <section className="methodology" id="metodologia" aria-labelledby="method-title">
          <div className="method-heading"><p className="eyebrow">Cómo leer este atlas</p><h2 id="method-title">Registrar no es lo mismo que censar.</h2></div>
          <div className="method-grid">
            <article><span>01</span><h3>Registros públicos</h3><p>Consultamos observaciones georreferenciadas de iNaturalist dentro del radio activo. Nunca intentamos reconstruir ubicaciones privadas u oscurecidas.</p></article>
            <article><span>02</span><h3>Riqueza registrada</h3><p>El conteo de especies viene del endpoint oficial de iNaturalist y no de la muestra limitada de puntos que dibuja el mapa.</p></article>
            <article className="effort-note"><LeafIcon /><h3>El esfuerzo también deja huella</h3><p>Un área puede tener pocos registros porque alberga menos organismos, porque es difícil acceder a ella o porque pocas personas la han observado. Por eso mostramos observaciones y observadores junto al número de especies.</p></article>
          </div>
          <div className="sources-row"><p>Fuente de biodiversidad: <a href="https://www.inaturalist.org" target="_blank" rel="noreferrer">iNaturalist</a>. Cartografía: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> y <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>.</p><p>Actualización: caché de 24 horas.</p></div>
        </section>
      </div>

      <footer><div><LeafIcon /><strong>Islas Vivas</strong></div><p>Observar también es cuidar. Documentar las especies de nuestro entorno ayuda a reconocer el valor de los espacios verdes que aún permanecen.</p><a href="#inicio">Volver arriba ↑</a></footer>
    </main>
  );
}
