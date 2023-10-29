const salesforcePrettierConfig = require('@salesforce/prettier-config');

module.exports = {
  ...salesforcePrettierConfig,
  trailingComma: 'all',
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
};
