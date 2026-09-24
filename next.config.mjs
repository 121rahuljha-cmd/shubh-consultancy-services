/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['iyjfkvdj55.preview.c38.airoapp.ai'],

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
