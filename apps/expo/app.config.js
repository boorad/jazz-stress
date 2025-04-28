const { withBuildProperties } = require('expo-build-properties');
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs/promises');
const path = require('path');

/**
 *   Expo doing me dirty, again
 */
function withCustomIosMod(config) {
  // 1. Set bundle identifier
  config.ios = {
    ...(config.ios || {}),
    bundleIdentifier: 'tools.jazz.jazzstress-expo',
  };
  // 2. Use expo-build-properties to bump iOS deployment target
  config = withBuildProperties(config, { ios: { deploymentTarget: '16.0' } });
  // 3. Patch the generated Podfile fallback to ensure platform is always 16.0
  config = withDangerousMod(config, ['ios', async modConfig => {
    const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
    let contents = await fs.readFile(podfilePath, 'utf-8');
    contents = contents.replace(
      /platform\s+:ios,\s*podfile_properties\['ios\.deploymentTarget'\]\s*\|\|\s*'.*'/,
      "platform :ios, podfile_properties['ios.deploymentTarget'] || '16.0'"
    );
    // inject post_install snippet to force pod targets to iOS 16
    contents = contents.replace(
      /(post_install do \|installer\|[\s\S]*?)(end)/,
      `$1  # Expo Build Properties: force deployment target\n  installer.pods_project.targets.each do |target|\n    target.build_configurations.each do |config|\n      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'\n    end\n  end\n$2`
    );
    await fs.writeFile(podfilePath, contents);
    return modConfig;
  }]);
  return config;
}

module.exports = withCustomIosMod;
