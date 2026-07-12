import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16; no custom webpack config needed.
  // @prisma/client is automatically treated as a server external package.
};

export default nextConfig;
