/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coachg/types'],
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.BACKEND_URL ?? 'http://localhost:4000',
  },
};

export default nextConfig;
