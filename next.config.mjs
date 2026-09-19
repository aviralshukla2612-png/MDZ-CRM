/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: "/mdz-crm",
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://www.millionairedizital.com/mdz-crm/api/auth",
  },
  eslint: {
    // Prevent ESLint from exhausting memory during production Docker builds
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "1024mb",
    },
  },
};

export default nextConfig;
