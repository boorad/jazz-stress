// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const path = require("path");

// eslint-disable-next-line no-undef
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root and lib folder
config.watchFolders = [workspaceRoot, path.resolve(workspaceRoot, 'lib')];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),

  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.sourceExts = ["mjs", "js", "json", "ts", "tsx"];
config.resolver.requireCycleIgnorePatterns = [/(^|\/|\\)node_modules($|\/|\\)/];
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, "node_modules", ".cache", "metro"),
  }),
];

// Alias 'lib' to its source directory
config.resolver.extraNodeModules = { lib: path.resolve(workspaceRoot, 'lib', 'src') };
// Enable Node package exports maps
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
