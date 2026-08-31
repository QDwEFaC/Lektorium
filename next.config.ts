import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom", "@mozilla/readability", "turndown"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
