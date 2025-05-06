/* eslint-env node */
/* eslint-disable no-undef */

const path = require("path");
const { makeMetroConfig } = require("@rnx-kit/metro-config");
const MetroSymlinksResolver = require("@rnx-kit/metro-resolver-symlinks");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const libSrc = path.resolve(workspaceRoot, "lib", "src");

module.exports = makeMetroConfig({
  resolver: {
    resolveRequest: MetroSymlinksResolver(),
    extraNodeModules: {
      lib: libSrc,
    },
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(workspaceRoot, "node_modules"),
      path.resolve(workspaceRoot, ".yalc"),
    ],
    sourceExts: ["mjs", "js", "json", "ts", "tsx"],
    // Ignore require cycles in node_modules
    requireCycleIgnorePatterns: [
      /(^|\/|\\)node_modules($|\/|\\)/,
      /(^|\/|\\).yalc($|\/|\\)/,
    ],
  },
  watchFolders: [
    path.resolve(workspaceRoot, "node_modules"),
    path.resolve(workspaceRoot, ".yalc"),
    libSrc,
  ],
});
