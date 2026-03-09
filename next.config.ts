import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // السماح بالطلبات من مصادر مختلفة للمعاينة
  allowedDevOrigins: [
    'preview-chat-2772e2c2-9ff7-411b-9bfc-ffd42b4d71be.space.z.ai',
    '.space.z.ai',
    'localhost',
  ],
};

export default nextConfig;
