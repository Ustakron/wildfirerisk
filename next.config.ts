import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*', // Proxy to Python backend in development
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
