# PGlite Server 整合報告

## 概述

本次更新將 ZyPlayer 專案的 pglite-server 架構完整整合到 Just-Chat-It 專案，以解決 Windows 11 環境下資料庫無法正常啟動的問題。

## 主要變更

### 1. 添加 pglite-server 依賴 (package.json)

```json
{
  "devDependencies": {
    "pglite-server": "^0.1.4"
  }
}
```

**用途**: 提供 PostgreSQL Wire Protocol 伺服器，允許使用標準 PostgreSQL 工具連接到 PGlite 實例進行調試。

### 2. DatabaseManager 類別增強 (src/main/database/database-manager.ts)

#### 新增功能：

**a) PostgreSQL 伺服器支援**
- 新增 `pgServer` 屬性來管理伺服器實例
- 導入 `Server` 類型從 Node.js `net` 模組

**b) startServer() 方法**
```typescript
public async startServer(port: number = 5432): Promise<void>
```
- 僅在開發模式下運行（`NODE_ENV === 'development'`）
- 動態導入 pglite-server 模組
- 在指定埠（預設 5432）啟動 PostgreSQL Wire Protocol 伺服器
- 提供清晰的控制台輸出，包括連接指令
- 錯誤處理和日誌記錄

**c) stopServer() 方法**
```typescript
public async stopServer(): Promise<void>
```
- 優雅關閉 PostgreSQL 伺服器
- Promise-based API 確保完整清理

**d) 增強的 close() 方法**
- 先停止伺服器再關閉資料庫連接
- 防止資源洩漏

### 3. 主程序整合 (src/main/index.ts)

在 `onReady()` 方法中添加伺服器啟動邏輯：

```typescript
// 啟動 PostgreSQL 伺服器（僅開發模式）
try {
  await this.dbManager.startServer(5432);
} catch (error) {
  this.logger.warn('Failed to start PGlite server (non-critical)', error as Error);
}
```

**特點**:
- 非阻塞啟動：伺服器啟動失敗不影響應用程式運行
- 日誌記錄：失敗時記錄警告而非錯誤
- 開發友好：僅在開發模式下啟動

## Windows 兼容性改進

### 已存在的兼容性措施

1. **self 全局變數 polyfill** (src/main/index.ts:1-6)
   ```typescript
   if (typeof self === 'undefined') {
     (global as any).self = globalThis;
   }
   ```
   解決 PGlite 在 Node.js 環境中的執行問題

2. **直接路徑傳遞**
   ```typescript
   this.client = new PGlite(this.dbPath);
   ```
   不使用顯式 NodeFS，讓 PGlite 自動處理文件系統（Windows 兼容性更好）

3. **跨平台路徑處理**
   ```typescript
   this.dbPath = path.join(userDataPath, 'database');
   ```
   使用 `path.join` 而非硬編碼路徑分隔符

### 新增的兼容性措施

4. **pglite-server 支援**
   - 提供標準 PostgreSQL 連接方式
   - 允許使用 DBeaver、pgAdmin、psql 等工具調試資料庫
   - 開發模式下更容易診斷 Windows 特定問題

## 使用方式

### 安裝依賴

```bash
npm install
```

這會安裝 `pglite-server@^0.1.4` 及所有其他依賴。

### 開發模式啟動

```bash
npm run dev
```

應用程式啟動後，你會在控制台看到：

```
┌─────────────────────────────────────────────────────────────┐
│ PGlite PostgreSQL Server Started                           │
├─────────────────────────────────────────────────────────────┤
│ Port: 5432                                                  │
│ Database: C:\Users\YourName\AppData\Roaming\just-chat-it\database │
│                                                             │
│ Connect with:                                               │
│   psql -h localhost -p 5432 -U postgres -d postgres        │
│                                                             │
│ Or use any PostgreSQL client tool                          │
└─────────────────────────────────────────────────────────────┘
```

### 使用 PostgreSQL 工具連接

**psql (命令列)**
```bash
psql -h localhost -p 5432 -U postgres -d postgres
```

**DBeaver / pgAdmin**
- Host: `localhost`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: (留空)

### 查詢範例

連接後，你可以執行任何 SQL 查詢：

```sql
-- 列出所有表格
\dt

-- 查看 AI 服務
SELECT * FROM ai_services;

-- 查看聊天會話
SELECT * FROM chat_sessions;

-- 檢查資料庫架構
\d+ ai_services
```

## 測試建議

### Windows 11 測試清單

- [ ] 應用程式能正常啟動
- [ ] 資料庫初始化成功（檢查控制台輸出）
- [ ] PGlite server 啟動成功
- [ ] 可以使用 psql 連接到資料庫
- [ ] AI 服務列表正常載入
- [ ] 聊天功能正常運作
- [ ] 提示詞庫可以讀取和保存
- [ ] 熱鍵設定可以保存
- [ ] 視窗狀態持久化正常

### 除錯步驟

如果遇到問題：

1. **檢查日誌**
   - 位置: `%APPDATA%\just-chat-it\logs\`
   - 查找資料庫相關錯誤

2. **檢查資料庫目錄**
   ```
   %APPDATA%\just-chat-it\database\
   ```
   確認目錄存在且有寫入權限

3. **使用 PostgreSQL 工具檢查**
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres -c "\dt"
   ```
   列出所有表格，確認資料庫結構正確

4. **檢查埠占用**
   ```bash
   netstat -ano | findstr :5432
   ```
   確認 5432 埠未被其他程式占用

## 技術細節

### PGlite 版本

- `@electric-sql/pglite`: `0.3.3`
- 基於 PostgreSQL 17.4
- 純 WASM 實作，無需原生編譯
- 與 ZyPlayer 專案保持一致

### pglite-server 工作原理

1. 創建 Node.js TCP 伺服器
2. 實作 PostgreSQL Wire Protocol
3. 接收客戶端連接請求
4. 處理 SSLRequest 和 StartupMessage
5. 模擬身份驗證流程
6. 將查詢轉發到 PGlite 實例
7. 返回結果給客戶端

### 架構優勢

1. **標準化**: 使用標準 PostgreSQL 協議，兼容所有 PostgreSQL 工具
2. **除錯友好**: 開發時可以直接檢查資料庫狀態
3. **非侵入性**: 僅開發模式啟動，不影響生產環境
4. **容錯性**: 伺服器啟動失敗不影響應用程式運行

## 參考資源

- **PGlite**: https://github.com/electric-sql/pglite
- **pglite-server**: https://www.npmjs.com/package/pglite-server

特別感謝以下開源專案：
- **ZyPlayer 專案**: https://github.com/alexcode-cc/ZyPlayer

## 下一步

1. 在 Windows 11 環境測試所有功能
2. 如果仍有問題，使用 PostgreSQL 工具檢查資料庫狀態
3. 收集詳細日誌以進行進一步診斷
4. 考慮添加更多除錯工具（如資料庫健康檢查 API）

## 總結

這次整合基於 ZyPlayer 專案的成功經驗，將完整的 pglite-server 架構引入到 Just-Chat-It 專案。主要改進包括：

- ✅ 添加開發模式下的 PostgreSQL 伺服器支援
- ✅ 保持與 ZyPlayer 專案相同的 PGlite 版本（0.3.3）
- ✅ 優化 Windows 兼容性
- ✅ 提供標準 PostgreSQL 工具連接方式
- ✅ 非侵入性設計，不影響生產環境
- ✅ 完整的錯誤處理和日誌記錄

這些改進應該能夠解決 Windows 11 環境下的資料庫啟動問題，並提供更好的開發和除錯體驗。
