/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com', 'randomuser.me'],
    unoptimized: true,
  },
};

export default nextConfig;
