import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from specific IPs in development
  // This resolves the warning about cross-origin requests to /_next/* resources
  allowedDevOrigins: [
    '169.254.230.119', // Add other IPs if needed for your local network
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Skip static generation for error pages to avoid Html import issues
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
