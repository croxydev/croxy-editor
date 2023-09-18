const removeImports = require("next-remove-imports")();

module.exports = removeImports({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = 'electron-renderer'
    }

    return config;
  },
  experimental: { esmExternals: true },
  images: {
    loader: 'akamai',
    path: '/',
  },
})
