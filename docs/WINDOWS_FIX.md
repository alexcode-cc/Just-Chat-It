# Windows 11 PGlite 啟動問題修正

## 問題描述

在 Windows 11 環境下，應用程式無法啟動，出現以下錯誤：

```
TypeError [ERR_INVALID_URL_SCHEME]: The URL must be of scheme file
    at open (node:internal/fs/promises:581:10)
    at Module.readFile (node:internal/fs/promises:1020:20)
```

## 根本原因

經過與 ZyPlayer 專案（同樣使用 PGlite 0.3.3，在 Windows 11 上正常運行）的對比分析，發現以下關鍵差異：

### 1. 路徑格式問題
- **問題**: Windows 路徑使用反斜杠 (`C:\Users\...`)，但 PGlite 內部某些操作可能期望正斜杠格式
- **解決方案**: 在 Windows 環境下將路徑標準化為正斜杠格式

### 2. Vite 打包配置問題
- **問題**: `@electric-sql/pglite` 沒有被標記為 external，導致被打包進主程序代碼
- **後果**: PGlite 的 WASM 文件和其他資源文件路徑錯誤
- **解決方案**: 將 PGlite 標記為 external 依賴，在運行時從 node_modules 加載

### 3. Electron Builder 配置缺失
- **問題**: PGlite 的 node_modules 沒有被包含在打包輸出中
- **解決方案**: 明確指定包含 `node_modules/@electric-sql/**/*`

## 修正內容

### 1. DatabaseManager 路徑處理 (src/main/database/database-manager.ts)

```typescript
// 修正前
this.dbPath = path.join(userDataPath, 'database');

// 修正後
const absolutePath = path.resolve(userDataPath, 'database');
// 在 Windows 上將反斜杠轉換為正斜杠，確保跨平台兼容性
this.dbPath = process.platform === 'win32'
  ? absolutePath.replace(/\\/g, '/')
  : absolutePath;
```

**變更原因**:
- 使用 `path.resolve` 確保絕對路徑
- Windows 路徑標準化為正斜杠格式
- 添加詳細日誌以便調試

### 2. Vite 配置更新 (vite.config.ts)

```typescript
// 修正前
rollupOptions: {
  external: ['electron', 'better-sqlite3'],
},
optimizeDeps: {
  exclude: ['@electric-sql/pglite'],
},

// 修正後
rollupOptions: {
  external: ['electron', 'better-sqlite3', '@electric-sql/pglite'],
},
resolve: {
  // 確保 Node.js 內建模組被正確解析
  conditions: ['node'],
},
```

**變更原因**:
- 將 `@electric-sql/pglite` 標記為 external，避免打包進主程序
- 移除 `optimizeDeps.exclude`，不再需要
- 添加 `resolve.conditions` 確保 Node.js 環境下的正確模組解析

### 3. Electron Builder 配置更新 (electron-builder.json5)

```json5
// 修正前
"files": [
  "dist/**/*",
  "package.json"
],

// 修正後
"files": [
  "dist/**/*",
  "package.json",
  "node_modules/@electric-sql/**/*"
],
```

**變更原因**:
- 明確包含 PGlite 的 node_modules
- 確保 WASM 文件和其他資源被正確打包

## 與 ZyPlayer 專案的對比

### ZyPlayer 專案成功的關鍵因素

1. **路徑處理**: ZyPlayer 使用 `path.join` 但其 Electron 版本和配置可能自動處理了路徑轉換

2. **依賴處理**: ZyPlayer 的打包配置確保 PGlite 作為 external 依賴

3. **版本一致性**: 兩個專案都使用相同的 PGlite 版本 (0.3.3)

### 本專案的特殊性

- 使用 vite-plugin-electron 進行打包
- 需要明確配置 external 依賴
- 需要手動處理 Windows 路徑格式

## 技術細節

### PGlite 的 WASM 加載機制

PGlite 包含以下關鍵文件：
- `postgres.wasm` - PostgreSQL WASM 主文件
- `postgres.data` - PostgreSQL 數據文件
- 其他輔助文件

這些文件的加載依賴於正確的路徑解析：
1. PGlite 嘗試從自身模組目錄加載 WASM 文件
2. 如果 PGlite 被打包進主程序，路徑會錯誤
3. 作為 external 依賴時，可以從 node_modules 正確加載

### ERR_INVALID_URL_SCHEME 錯誤的原因

Node.js 在較新版本中，某些 fs API 開始支持 file:// URL：
- `fs.readFile('C:\\path\\file')` - 傳統路徑
- `fs.readFile(new URL('file:///C:/path/file'))` - URL 格式

當路徑格式不匹配時，會拋出 `ERR_INVALID_URL_SCHEME` 錯誤。

## 驗證步驟

修正後，應用程式應該能夠：

1. ✅ 在 Windows 11 上正常啟動
2. ✅ 資料庫初始化成功
3. ✅ 控制台顯示以下日誌：
   ```
   [DatabaseManager] DB path: C:/Users/.../Just-Chat-It/database
   [DatabaseManager] Initializing database...
   [DatabaseManager] Platform: win32
   [DatabaseManager] PGlite instance created, waiting for ready...
   [DatabaseManager] PGlite client ready
   [DatabaseManager] Database initialized successfully
   ```

## 開發模式測試

```bash
# 1. 清除舊的建置輸出
rm -rf dist dist-electron

# 2. 安裝依賴
npm install

# 3. 啟動開發模式
npm run dev
```

## 生產環境打包測試

```bash
# 1. 建置應用程式
npm run build

# 2. 打包 Windows 版本
npm run dist:win

# 3. 安裝並測試
# 輸出在 dist-electron 目錄
```

## 預期結果

- ✅ 應用程式能在 Windows 11 上正常啟動
- ✅ 資料庫初始化無錯誤
- ✅ PGlite server 在開發模式下正常啟動（埠 5432）
- ✅ 所有功能正常運作

## 如果仍有問題

如果修正後仍然出現問題，請檢查：

1. **日誌輸出**: 查看詳細的資料庫初始化日誌
2. **路徑格式**: 確認 DB path 使用正斜杠
3. **node_modules**: 確認 `@electric-sql/pglite` 目錄存在
4. **WASM 文件**: 確認 `node_modules/@electric-sql/pglite/dist/postgres.wasm` 存在
5. **權限**: 確認應用程式有寫入 AppData 目錄的權限

## 參考資源

- PGlite 官方文檔: https://github.com/electric-sql/pglite
- ZyPlayer 專案: https://github.com/Hiram-Wong/ZyPlayer
- Electron Builder 文檔: https://www.electron.build/
- Vite Electron Plugin: https://github.com/electron-vite/vite-plugin-electron

## 總結

這次修正解決了三個關鍵問題：
1. **路徑格式標準化** - Windows 路徑轉換為正斜杠
2. **依賴外部化** - PGlite 作為 external 依賴而非打包進主程序
3. **資源包含** - 確保 PGlite 的 node_modules 被包含在打包輸出中

這些修正確保了與 ZyPlayer 專案相同的成功模式，同時保持了本專案的架構完整性。
