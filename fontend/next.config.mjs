/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,   // ⭐ TẮT STRICT MODE — FIX SOCKET CONNECT 3 LẦN ⭐

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
