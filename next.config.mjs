/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Allow Supabase storage public URLs (replace project ref via env at runtime).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
