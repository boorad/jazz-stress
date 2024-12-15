const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const jazz_packages = path.resolve(__dirname, '../jazz/packages');
const rnqc = path.resolve(
  __dirname,
  '../rnqc/main/packages/react-native-quick-crypto',
);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      jazz_packages,
      rnqc,
    ],
    unstable_enablePackageExports: true,
  },
  watchFolders: [jazz_packages, rnqc],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
