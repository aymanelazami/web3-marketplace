import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server external packages
  serverExternalPackages: ['@prisma/client'],
  // Transpile wagmi packages for proper resolution
  transpilePackages: ['wagmi', '@wagmi/core', '@wagmi/connectors', 'viem'],
};

export default nextConfig;
