/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["react-icons", "motion/react", "recharts"],
  },
};

export default nextConfig;
