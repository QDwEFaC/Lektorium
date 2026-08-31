import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom", "@mozilla/readability", "turndown"],
};

export default nextConfig;
