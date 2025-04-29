const path = require('path');
const { makeMetroConfig } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');

// Define workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const libSrc = path.resolve(workspaceRoot, 'lib', 'src');

module.exports = makeMetroConfig({
  resolver: {
    resolveRequest: MetroSymlinksResolver(),
    extraNodeModules: {
      lib: libSrc,
    },
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
      path.resolve(workspaceRoot, '.yalc'),
    ],
    sourceExts: ['mjs', 'js', 'json', 'ts', 'tsx'],
    // // // Enable package exports to support Node.js "exports" field
    // unstable_enablePackageExports: true,
    // // // Ignore require cycles in node_modules
    // requireCycleIgnorePatterns: [/(^|\/|\\)node_modules($|\/|\\)/],
  },
  watchFolders: [
    // path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
    path.resolve(workspaceRoot, '.yalc'),
    libSrc,
  ],
});




// // Detect Node core modules to skip custom resolution
// const { builtinModules } = require('module');

// // Use Node's resolution algorithm to respect package.json "exports" field, fallback to symlink resolver
// const customResolver = (context, moduleName, platform) => {
//   // Only intercept non-relative, non-absolute imports
//   if (!moduleName.startsWith('.') && !path.isAbsolute(moduleName) && !builtinModules.includes(moduleName)) {
//     try {
//       const filePath = require.resolve(moduleName, { paths: [workspaceRoot] });
//       return { type: 'sourceFile', filePath };
//     } catch (e) {
//       // ignore
//     }
//   }
//   return MetroSymlinksResolver()(context, moduleName, platform);
// };

