import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Self-hosted on the same VPS as the backend since 25 Aug 2026. `standalone` traces the
  // server and only the node_modules it actually reaches into .next/standalone, which is
  // what makes the image shippable: it is built on a GitHub runner and pushed into the
  // VPS over SSH, because this box cannot reach the npm registry — outbound packet loss
  // makes `npm ci` there hang indefinitely, while inbound to it measures 0% loss.
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
