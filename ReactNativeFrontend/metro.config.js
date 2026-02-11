const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use .js extension in imports (e.g. @noble/hashes/sha2.js) to match actual files

module.exports = config;
