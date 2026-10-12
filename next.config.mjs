const isGithubPages = process.env.GITHUB_ACTIONS || process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? '/Mediunify-Super-admin' : '',
  trailingSlash: true,
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com', 'randomuser.me'],
    unoptimized: true,
  },
};

export default nextConfig;
