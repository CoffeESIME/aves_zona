import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Islas Vivas — Biodiversidad alrededor de la UAM Cuajimalpa',
  description: 'Explora especies registradas alrededor de la UAM Cuajimalpa y descubre cómo la vida persiste entre la ciudad y las barrancas.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f2efe4' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
