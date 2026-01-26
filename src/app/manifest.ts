import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Parramatta Golf',
    short_name: 'Parramatta',
    description: 'Premium Golf Community Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#002D56',
    theme_color: '#002D56',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
