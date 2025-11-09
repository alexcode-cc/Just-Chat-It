/**
 * Electron Builder - Before Build Script
 * 在建置前執行的腳本
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running before-build script...');

// 檢查必要的目錄和文件
const requiredFiles = [
  'dist/main/index.js',
  'dist/renderer/index.html',
  'package.json',
];

let hasError = false;

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required file not found: ${file}`);
    hasError = true;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

if (hasError) {
  console.error('❌ Build preparation failed! Please run "npm run build" first.');
  process.exit(1);
}

// 檢查 node_modules
if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
  console.error('❌ node_modules not found! Please run "npm install" first.');
  process.exit(1);
}

console.log('✅ Before-build checks passed!');
