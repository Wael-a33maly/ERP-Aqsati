import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from preview panel
  allowedDevOrigins: [
    'localhost',
    '.z.ai',
    '.z.com',
    '.space.z.ai',
    '.preview.space.z.ai',
    'preview-chat-2772e2c2-9ff7-411b-9bfc-ffd42b4d71be.space.z.ai',
    'chat-2772e2c2-9ff7-411b-9bfc-ffd42b4d71be.space.z.ai',
  ],
};

export default nextConfig;
