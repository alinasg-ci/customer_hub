import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = isDev
  ? "default-src 'self'; connect-src 'self' https://*.supabase.co https://mcp.figma.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mcp.figma.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
  : "default-src 'self'; connect-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
