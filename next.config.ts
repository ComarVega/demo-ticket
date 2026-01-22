import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  // Configuración de seguridad
  poweredByHeader: false, // Remover header X-Powered-By

  // Headers de seguridad
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Prevenir clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // Prevenir MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin' // Controlar referrer
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()' // Restringir APIs del navegador
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains' // Forzar HTTPS
          }
        ]
      },
      {
        // Headers específicos para API
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  },

  // Configuración de paquetes externos del servidor
  serverExternalPackages: [],

  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: false, // No ignorar errores de TypeScript en build
  },
};

export default nextConfig;
