const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// NOTE: Removed problematic extraNodeModules Proxy
// Metro 0.76+ resolves tsconfig.json paths automatically
// The Proxy was returning null for non-@ aliases, causing build failures on Vercel
// See: VERCEL_BUILD_ERROR_ANALYSIS.md for details

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: false,
});

// Prevent Metro from bundling cache files that cause issues
if (config.resolver) {
  config.resolver.blockList = [
    ...new Set([
      ...(config.resolver.blockList || []),
      /react-native-css-interop[/\\]\.cache/,
    ]),
  ];
}
