/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    const old = [{ type: "host", value: "interview-ready-ai-sooty.vercel.app" }];
    return [
      { source: "/", has: old, destination: "https://truepanel.vercel.app/", permanent: false },
      {
        source: "/:path((?!api/|auth/).+)",
        has: old,
        destination: "https://truepanel.vercel.app/:path",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
