import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from specific IPs in development
  // This resolves the warning about cross-origin requests to /_next/* resources
  allowedDevOrigins: [
    '169.254.230.119', // Add other IPs if needed for your local network
  ],
};

export default nextConfig;
