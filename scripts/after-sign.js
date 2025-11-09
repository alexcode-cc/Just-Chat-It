/**
 * Electron Builder - After Sign Script
 * 在簽署後執行的腳本（主要用於 macOS 公證）
 */

const { notarize } = require('@electron/notarize');

module.exports = async function(context) {
  const { electronPlatformName, appOutDir } = context;

  // 只在 macOS 上執行公證
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // 檢查是否有公證憑證
  if (!process.env.APPLEID || !process.env.APPLEIDPASS) {
    console.log('⚠️  Skipping notarization: APPLEID or APPLEIDPASS not set');
    return;
  }

  console.log('🔐 Notarizing macOS application...');

  const appName = context.packager.appInfo.productFilename;

  await notarize({
    appBundleId: 'com.alexcode.justchatit',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  });

  console.log('✅ Notarization completed!');
};
