import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: '/superadmin',
  // Fix: Force Turbopack to resolve tailwindcss from superadmin's own node_modules
  turbopack: {
    resolveAlias: {
      tailwindcss: path.resolve(__dirname, 'node_modules/tailwindcss'),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        // Cloudflare R2 storage - default domain pattern
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        // Custom R2 domain if configured
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_R2_DOMAIN || 'pub-*.r2.dev',
      },
      {
        // Allow localhost for development
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        // Unsplash images
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Local network IPs for development
        protocol: 'http',
        hostname: '192.168.*.*',
      },
      {
        // Production domain
        protocol: 'https',
        hostname: 'bookmysevaa.com',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Strict mode for development
  reactStrictMode: true,
  // Output standalone for Docker deployment
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
};

export default nextConfig;
