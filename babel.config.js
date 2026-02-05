module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  plugins.push("react-native-worklets/plugin");
  plugins.push([
    "module-resolver",
    {
      root: ["./"],
      alias: {
        "@": "./",
        "@shared": "./shared",
      },
    },
  ]);

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
