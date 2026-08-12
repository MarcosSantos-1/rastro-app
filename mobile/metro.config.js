const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [monorepoRoot];

/** Garante o bundle react-native do Firebase (não o Node/gRPC). */
config.resolver = {
  ...config.resolver,
  resolverMainFields: ["react-native", "browser", "main"],
};

module.exports = config;
