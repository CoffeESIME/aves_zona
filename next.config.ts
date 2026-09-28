import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static.inaturalist.org' },
      { protocol: 'https', hostname: 'inaturalist-open-data.s3.amazonaws.com' },
    ],
  },
};

export default nextConfig;
