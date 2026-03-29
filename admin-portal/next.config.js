/** @type {import('next').NextConfig} */
const nextConfig = {
  // Polling avoids EMFILE: "too many open files" when the file watcher exhausts FDs (common on macOS + monorepos).
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  async redirects() {
    return [
      { source: '/', destination: '/login', permanent: false },
      { source: '/settings/system-fields', destination: '/settings/system-config', permanent: true },
      { source: '/settings/system-brands', destination: '/settings/system-config', permanent: true },
      { source: '/settings/system-checks', destination: '/settings/system-config', permanent: true },
    ];
  },
};

module.exports = nextConfig;
