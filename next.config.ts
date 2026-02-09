import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/api/:path*' // Proxy to Python backend in development
            : '/api/', // In production, let Vercel handle it
      },
    ]
  },
};

export default nextConfig;
