/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: "/mdz-crm",
  eslint: {
    // Prevent ESLint from exhausting memory during production Docker builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
