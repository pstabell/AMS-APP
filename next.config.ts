import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for build (causes path length issues on Windows)
  // Use webpack instead
  experimental: {
    // Turbo disabled for production build
  },
  
  // Fix workspace root warning
  turbopack: {
    root: __dirname,
  },
  
  // Output configuration
  output: 'standalone',
  
  // Disable type checking during build (faster builds, handle in CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  
};

export default nextConfig;
