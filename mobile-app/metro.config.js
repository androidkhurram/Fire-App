const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/** PDF uses src/native/htmlToPdfModule.ts (imported directly from services) — no package alias needed. */
module.exports = mergeConfig(getDefaultConfig(__dirname), {});
