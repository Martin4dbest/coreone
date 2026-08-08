const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow PDF.js runtime text file to be bundled as an asset.
if (!config.resolver.assetExts.includes("txt")) {
  config.resolver.assetExts.push("txt");
}

// Keep Metro on the package "main" entry instead of resolving
// package "exports". This avoids the use-latest-callback CJS/ESM
// interop problem with React Navigation.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
