# Windows 建置錯誤修復指南

## 問題描述

在 Windows 11 環境執行 `npm run dev` 時出現兩個錯誤：

1. **TypeScript Export 錯誤**: `ErrorSeverity` 未正確從 `app-error.ts` 匯出
2. **better-sqlite3 Node 版本不匹配**: 原生模組需要針對 Electron 的 Node 版本重新編譯

## 已修復的問題

### 1. ErrorSeverity Export 錯誤 ✅

已在 `src/shared/errors/app-error.ts` 中添加重新匯出：

```typescript
// Re-export types for convenience
export { ErrorCode, ErrorSeverity, ErrorCategory };
```

### 2. better-sqlite3 重建配置 ✅

已在 `package.json` 中添加：

- `electron-rebuild` 依賴
- `postinstall` 腳本：自動安裝應用程式依賴
- `rebuild` 腳本：手動重建 better-sqlite3

## 快速修復（推薦）

### 方法 1: 使用批次腳本（最簡單）

1. 在專案根目錄執行：
   ```cmd
   fix-windows-build.bat
   ```

2. 等待腳本完成

3. 執行開發伺服器：
   ```cmd
   npm run dev
   ```

### 方法 2: 手動執行命令

1. 安裝 electron-rebuild：
   ```cmd
   npm install --save-dev electron-rebuild
   ```

2. 重建 better-sqlite3：
   ```cmd
   npm run rebuild
   ```

3. 執行開發伺服器：
   ```cmd
   npm run dev
   ```

## 如果重建失敗

### 檢查前置需求

better-sqlite3 是原生模組，在 Windows 上需要編譯工具。如果重建失敗，請確認已安裝：

1. **Node.js** (建議 v18 或更高版本)
   ```cmd
   node --version
   ```

2. **Python** (v3.x)
   ```cmd
   python --version
   ```

3. **Windows Build Tools**

   如果沒有安裝，執行以下命令（需要管理員權限）：

   ```cmd
   npm install --global windows-build-tools
   ```

   或者安裝 Visual Studio Build Tools：
   - 下載 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
   - 選擇「使用 C++ 的桌面開發」工作負載

### 清除並重新安裝

如果問題持續，嘗試清除並重新安裝所有依賴：

```cmd
# 刪除 node_modules 和 lock 檔案
rd /s /q node_modules
del package-lock.json

# 清除 npm 快取
npm cache clean --force

# 重新安裝
npm install

# 重建原生模組
npm run rebuild

# 啟動開發伺服器
npm run dev
```

## 技術細節

### 為什麼會發生這個問題？

better-sqlite3 使用原生 C++ 擴充，這些擴充必須針對特定的 Node.js 版本編譯。Electron 使用自己的 Node.js 版本（通常與系統的 Node.js 版本不同），因此需要重新編譯。

錯誤訊息中的 `NODE_MODULE_VERSION 127` vs `NODE_MODULE_VERSION 118` 表示：
- 模組使用 Node.js v21+ 編譯 (MODULE_VERSION 127)
- Electron 27 需要 Node.js v18 (MODULE_VERSION 118)

### electron-builder install-app-deps

`postinstall` 腳本使用 `electron-builder install-app-deps` 會：
- 自動偵測 Electron 版本
- 針對正確的 Node.js ABI 版本重建原生依賴
- 處理跨平台的編譯差異

### 手動重建命令

`npm run rebuild` 執行：
```
electron-rebuild -f -w better-sqlite3
```

參數說明：
- `-f`: 強制重建
- `-w better-sqlite3`: 只重建 better-sqlite3（提高速度）

## 預防措施

### 未來安裝依賴時

每次安裝新的依賴後，`postinstall` 腳本會自動執行。如果添加其他原生模組，它們也會自動重建。

### CI/CD 環境

在 CI/CD pipeline 中，確保：

1. 安裝 Windows Build Tools（在 Windows runner 上）
2. `npm install` 會自動觸發 `postinstall`
3. 如果需要，添加明確的 `npm run rebuild` 步驟

## 相關連結

- [better-sqlite3 文件](https://github.com/WiseLibs/better-sqlite3)
- [electron-rebuild 文件](https://github.com/electron/rebuild)
- [Electron 原生模組文件](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
- [Node.js ABI 版本對照表](https://nodejs.org/en/download/releases/)

## 需要協助？

如果問題仍然存在，請提供以下資訊：

1. Node.js 版本: `node --version`
2. npm 版本: `npm --version`
3. Python 版本: `python --version`
4. Windows 版本
5. 完整的錯誤訊息

在 GitHub Issues 中建立問題報告。
