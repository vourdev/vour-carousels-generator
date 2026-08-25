import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Self-hosted on the same VPS as the backend since 25 Aug 2026. `standalone` traces the
  // server and only the node_modules it actually reaches into .next/standalone, which is
  // what makes the image shippable: it is built on a GitHub runner and pushed into the
  // VPS over SSH, because this box cannot reach the npm registry — outbound packet loss
  // makes `npm ci` there hang indefinitely, while inbound to it measures 0% loss.
  output: "standalone",
  // Safety net for the unDraw SVGs, which are read with fs.readFileSync and never
  // imported. @vercel/nft currently resolves that call statically and traces all 145
  // files on its own — verified by diffing filePathMap in .vercel/output with and
  // without this block, which came out identical. It is kept because that only holds
  // while the path in illustrations.server.ts stays statically analyzable; the day it
  // becomes dynamic, the files vanish from the bundle and every illustration silently
  // renders as the fallback.
  outputFileTracingIncludes: {
    "/*": ["lib/ds/assets/illustrations/**/*.svg"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
