// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Skip ESLint during production builds (e.g., Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
