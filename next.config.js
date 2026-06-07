/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⚡ Improve performance & caching
  poweredByHeader: false,

  // 🧠 Better image optimization
  images: {
    domains: ["localhost", "res.cloudinary.com", "images.unsplash.com"],
    formats: ["image/avif", "image/webp"],
  },

  // 🚀 Enable compression for faster loading
  compress: true,

  // 🧪 Helps debugging
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // 🌍 Environment-safe headers (optional but good for security)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
