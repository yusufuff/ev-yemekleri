/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  compress: true,
}
module.exports = nextConfig
// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");
module.exports = withSentryConfig(module.exports, {
  org: "anneelim",
  project: "anneelim-web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});