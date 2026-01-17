const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for @noble/hashes module resolution warning
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
