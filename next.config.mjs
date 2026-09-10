/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Don't fail the production build on lint issues (run `npm run lint` locally instead).
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Trims the client JS bundle by only shipping the icons/chart pieces that
  // are actually imported, instead of the whole package — noticeably faster
  // first load on slower connections.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  compress: true,
};
export default nextConfig;
