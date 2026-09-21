/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
};

if (process.env.STATIC_EXPORT === 'true') {
  nextConfig.output = 'export';
  nextConfig.pageExtensions = ['tsx', 'jsx'];
}

export default nextConfig;



