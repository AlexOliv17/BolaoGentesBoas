import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bolão GB',
    short_name: 'Bolão GB',
    description: 'Bolão Gentes Boas para a Copa do Mundo.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0D0D0D', // var(--color-background)
    theme_color: '#042A2B', // var(--color-brand-green)
    icons: [
      {
        src: '/icon192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
