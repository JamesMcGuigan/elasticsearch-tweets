const withLess = require('@zeit/next-less');

// DOCS: https://nextjs.org/docs/api-reference/next.config.js/environment-variables
module.exports = withLess({
  target:     'serverless',
  cssModules: false,
  webpack(config, _options) {
    return config;
  }
});
