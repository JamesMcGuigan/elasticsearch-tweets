const withSourceMaps = require('@zeit/next-source-maps')
const withLess = require('@zeit/next-less');

// DOCS: https://nextjs.org/docs/api-reference/next.config.js/environment-variables
// DOCS: https://github.com/vercel/next-plugins/tree/master/packages/next-source-maps
module.exports = withSourceMaps(withLess({
  target:     'serverless',
  cssModules: false,
  webpack(config, _options) {
    return config;
  }
}));
