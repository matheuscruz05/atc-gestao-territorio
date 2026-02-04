const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add path alias resolution for Metro
if (config.resolver) {
  config.resolver.extraNodeModules = new Proxy(
    {},
    {
      get: (target, name) => {
        if (name === "@") {
          return __dirname;
        }
        return null;
      },
    }
  );
}

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
