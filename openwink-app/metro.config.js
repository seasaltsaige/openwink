const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Run Metro transforms in-band locally (maxWorkers = 1 bypasses jest-worker
// child_process IPC serialization, which crashes with Zone OOM on Node v24 Windows).
if (!process.env.EAS_BUILD) {
  config.maxWorkers = 1;
}

module.exports = config;
