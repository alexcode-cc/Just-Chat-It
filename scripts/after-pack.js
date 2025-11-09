/**
 * Electron Builder - After Pack Script
 * 在打包後執行的腳本
 */

const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
  console.log('📦 Running after-pack script...');

  const { appOutDir, packager } = context;
  const platform = packager.platform.name;

  console.log(`Platform: ${platform}`);
  console.log(`Output directory: ${appOutDir}`);

  // 根據平台執行不同的後處理
  if (platform === 'mac') {
    console.log('🍎 macOS post-processing...');
    // macOS 特定的處理
  } else if (platform === 'win') {
    console.log('🪟 Windows post-processing...');
    // Windows 特定的處理
  } else if (platform === 'linux') {
    console.log('🐧 Linux post-processing...');
    // Linux 特定的處理
  }

  console.log('✅ After-pack completed!');
};
