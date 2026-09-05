'use client';

import { useState } from 'react';

type Props = {
  src: string | null;
  alt: string;
  loading?: 'eager' | 'lazy';
};

export function LicensedPhoto({ src, alt, loading = 'lazy' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    return <div className="photo-fallback" role="img" aria-label={`${alt}. Fotografía no disponible`}><span>Sin fotografía licenciada</span></div>;
  }
  return (
    // URLs are normalized and license-checked by the server.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading={loading} onError={() => setFailedSrc(src)} />
  );
}
