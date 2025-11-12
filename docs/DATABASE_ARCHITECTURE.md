# PGlite 資料庫架構技術文檔

## 概述

Just Chat It 使用 **PGlite** (PostgreSQL WebAssembly) 作為本地資料庫解決方案。PGlite 提供完整的 PostgreSQL 功能，無需外部資料庫伺服器，所有資料存儲在用戶的本地設備上。

**版本信息**:
- PGlite: `0.3.3` (基於 PostgreSQL 17.4)
- pglite-server: `0.1.4` (開發工具，提供 PostgreSQL Wire Protocol 支援)

**選擇 PGlite 的原因**:
- ✅ 純 WASM 實作，無需原生模組編譯
- ✅ 完整的 PostgreSQL 功能和 SQL 支援
- ✅ 跨平台兼容（Windows、macOS、Linux）
- ✅ 本地數據存儲，隱私保護
- ✅ 異步 API，性能優秀
- ✅ 支援事務、索引、外鍵等高級功能

---

## 架構設計

### 目錄結構

```
src/main/database/
├── database-manager.ts          # 資料庫管理器（單例模式）
├── schema.ts                    # 資料庫表結構定義
├── init-data.ts                 # 預設資料初始化
└── repositories/                # Repository 層（資料存取層）
    ├── base-repository.ts       # Repository 基礎類別
    ├── ai-service-repository.ts # AI 服務 Repository
    ├── chat-repository.ts       # 聊天相關 Repository
    ├── prompt-repository.ts     # 提示詞 Repository
    ├── window-state-repository.ts
    ├── hotkey-settings-repository.ts
    ├── quota-repository.ts
    ├── comparison-repository.ts
    └── index.ts                 # 統一導出
```

---

## 核心組件

### 1. DatabaseManager（資料庫管理器）

**職責**:
- 管理 PGlite 實例的生命週期
- 提供資料庫連接的單例訪問
- 處理資料庫初始化和關閉
- 提供事務支援
- 開發模式下提供 PostgreSQL Wire Protocol 伺服器

**關鍵實作細節**:

#### 1.1 路徑處理（Windows 兼容性）

```typescript
private constructor() {
  const userDataPath = app.getPath('userData');
  const absolutePath = path.resolve(userDataPath, 'database');

  // Windows 路徑標準化：C:\Users\... → C:/Users/...
  this.dbPath = process.platform === 'win32'
    ? absolutePath.replace(/\\/g, '/')
    : absolutePath;

  console.log(`[DatabaseManager] DB path: ${this.dbPath}`);
}
```

**重要提示**:
- PGlite 在 Windows 上需要使用正斜杠格式的路徑
- 使用 `path.resolve` 確保絕對路徑
- 不使用 `pathToFileURL`，直接傳遞字串路徑

#### 1.2 初始化流程

```typescript
public async initialize(): Promise<void> {
  // 1. 創建 PGlite 實例
  this.client = new PGlite(this.dbPath);

  // 2. 等待就緒
  await this.client.waitReady;

  // 3. 創建表格
  await this.createTables();

  // 4. 創建索引
  await this.createIndexes();

  this.isInitialized = true;
}
```

**初始化順序**:
1. DatabaseManager 初始化
2. 創建所有表格（使用 `CREATE TABLE IF NOT EXISTS`）
3. 創建所有索引（使用 `CREATE INDEX IF NOT EXISTS`）
4. 初始化預設資料（AI 服務、熱鍵設定等）

#### 1.3 PGlite Server（開發工具）

```typescript
public async startServer(port: number = 5432): Promise<void> {
  // 僅在開發模式下運行
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const { createServer } = await import('pglite-server');
  await this.client.waitReady;

  this.pgServer = createServer(this.client);
  this.pgServer.listen(port, () => {
    console.log(`PGlite Server listening on port ${port}`);
  });
}
```

**功能**:
- 提供標準 PostgreSQL Wire Protocol 介面
- 允許使用 `psql`、DBeaver、pgAdmin 等工具連接
- 僅在開發環境啟動，不影響生產環境

**連接方式**:
```bash
psql -h localhost -p 5432 -U postgres -d postgres
```

#### 1.4 事務支援

```typescript
public async transaction<T>(fn: (client: PGlite) => Promise<T>): Promise<T> {
  const client = this.getClient();

  try {
    await client.exec('BEGIN');
    const result = await fn(client);
    await client.exec('COMMIT');
    return result;
  } catch (error) {
    await client.exec('ROLLBACK');
    throw error;
  }
}
```

**使用範例**:
```typescript
await DatabaseManager.getInstance().transaction(async (client) => {
  // 多個資料庫操作
  await client.query('INSERT INTO table1 ...');
  await client.query('UPDATE table2 ...');
  // 如果任何操作失敗，自動回滾
});
```

---

### 2. Repository Pattern（資料存取層）

**設計原則**:
- 所有資料庫操作必須通過 Repository 類別
- 使用 BaseRepository 統一錯誤處理和日誌記錄
- 資料模型轉換集中在 Repository 層
- 支援異步操作（async/await）

#### 2.1 BaseRepository

```typescript
export abstract class BaseRepository<T> {
  protected tableName: string;

  protected get client(): PGlite {
    return DatabaseManager.getInstance().getClient();
  }

  // 抽象方法（子類必須實作）
  protected abstract rowToEntity(row: any): T;
  protected abstract entityToRow(entity: T): any;

  // 通用 CRUD 操作
  public async findAll(): Promise<T[]>
  public async findById(id: string): Promise<T | null>
  public async create(entity: T): Promise<T>
  public async update(id: string, updates: Partial<T>): Promise<T>
  public async delete(id: string): Promise<boolean>
}
```

**重要特性**:
- 延遲載入：`client` 使用 getter 而非構造函數注入
- 參數化查詢：使用 PostgreSQL `$1, $2...` 格式防止 SQL 注入
- 類型轉換：`rowToEntity` 和 `entityToRow` 處理資料庫與領域模型的轉換

#### 2.2 範例：AIServiceRepository

```typescript
export class AIServiceRepository extends BaseRepository<AIService> {
  constructor() {
    super(TABLE_NAMES.AI_SERVICES);
  }

  protected rowToEntity(row: any): AIService {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,  // snake_case → camelCase
      webUrl: row.web_url,
      iconPath: row.icon_path,
      isAvailable: Boolean(row.is_available),
      // ... 更多欄位
    };
  }

  protected entityToRow(entity: AIService): any {
    return {
      id: entity.id,
      name: entity.name,
      display_name: entity.displayName,  // camelCase → snake_case
      web_url: entity.webUrl,
      icon_path: entity.iconPath,
      is_available: entity.isAvailable,
      // ... 更多欄位
    };
  }

  // 自訂查詢方法
  public async findAvailableServices(): Promise<AIService[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE is_available = true`;
    const result = await this.client.query(sql);
    return result.rows.map(row => this.rowToEntity(row));
  }
}
```

---

### 3. 資料庫 Schema（表結構）

#### 3.1 表格清單

| 表名 | 說明 | 主要用途 |
|------|------|---------|
| `ai_services` | AI 服務配置 | 存儲 ChatGPT、Claude 等服務信息 |
| `chat_sessions` | 聊天會話 | 管理每個 AI 的對話會話 |
| `chat_messages` | 聊天訊息 | 存儲對話歷史記錄 |
| `prompts` | 提示詞庫 | 用戶自訂的提示詞模板 |
| `app_settings` | 應用程式設定 | 鍵值對形式的全局設定 |
| `window_states` | 視窗狀態 | 保存視窗位置和大小 |
| `hotkey_settings` | 熱鍵設定 | 全局熱鍵配置 |
| `comparison_sessions` | 比較會話 | AI 回應比較功能 |
| `comparison_results` | 比較結果 | AI 回應數據 |
| `quota_tracking` | 額度追蹤 | API 額度管理 |

#### 3.2 核心表結構示例

##### ai_services 表

```sql
CREATE TABLE IF NOT EXISTS ai_services (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  web_url TEXT NOT NULL,
  icon_path TEXT,
  hotkey VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  quota_reset_time TIMESTAMP,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

##### chat_sessions 表

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(255) PRIMARY KEY,
  ai_service_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
);
```

##### app_settings 表（鍵值對）

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,              -- JSON 字串
  updated_at TIMESTAMP DEFAULT now()
);
```

**使用範例**:
```typescript
// 保存設定
await dbManager.query(
  `INSERT INTO app_settings (key, value, updated_at)
   VALUES ($1, $2, now())
   ON CONFLICT (key)
   DO UPDATE SET value = $2, updated_at = now()`,
  ['theme', JSON.stringify({ mode: 'dark', color: 'blue' })]
);

// 讀取設定
const result = await dbManager.queryOne(
  'SELECT value FROM app_settings WHERE key = $1',
  ['theme']
);
const theme = JSON.parse(result.value);
```

#### 3.3 索引設計

**索引策略**:
- 外鍵列：加速 JOIN 操作
- 查詢頻繁的列：如 `is_available`、`is_favorite`
- 時間戳列：支援按時間排序和篩選

**範例**:
```sql
-- AI 服務相關索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_ai_service_id
  ON chat_sessions(ai_service_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
  ON chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp
  ON chat_messages(timestamp);

-- 提示詞索引
CREATE INDEX IF NOT EXISTS idx_prompts_category
  ON prompts(category);

CREATE INDEX IF NOT EXISTS idx_prompts_favorite
  ON prompts(is_favorite);
```

---

## IPC 通訊整合

### IPC Handlers（主程序）

**位置**: `src/main/ipc-handlers.ts`

#### 資料庫操作 API

##### db:load - 載入資料

```typescript
ipcMain.handle('db:load', async (event, table: string, query?: any) => {
  switch (table) {
    case 'ai_services':
      if (query?.id) return aiServiceRepo.findById(query.id);
      if (query?.availableOnly) return aiServiceRepo.findAvailableServices();
      return aiServiceRepo.findAll();

    case 'app_settings':
      const dbManager = DatabaseManager.getInstance();
      if (query?.key) {
        return dbManager.queryOne(
          'SELECT key, value FROM app_settings WHERE key = $1',
          [query.key]
        );
      }
      return dbManager.query('SELECT key, value FROM app_settings');

    // ... 其他表格處理
  }
});
```

##### db:save - 保存資料

```typescript
ipcMain.handle('db:save', async (event, table: string, data: any) => {
  switch (table) {
    case 'ai_services':
      if (data._delete) return aiServiceRepo.delete(data.id);
      return aiServiceRepo.upsert(data);

    case 'app_settings':
      const dbMgr = DatabaseManager.getInstance();
      if (data._delete && data.key) {
        await dbMgr.query('DELETE FROM app_settings WHERE key = $1', [data.key]);
        return { success: true };
      }
      if (data.key && data.value !== undefined) {
        await dbMgr.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ($1, $2, now())
           ON CONFLICT (key)
           DO UPDATE SET value = $2, updated_at = now()`,
          [data.key, JSON.stringify(data.value)]
        );
        return { key: data.key, value: data.value };
      }
      throw new Error('Invalid app_settings data');

    // ... 其他表格處理
  }
});
```

### Preload Script（渲染程序橋接）

**位置**: `src/main/preload.ts`

```typescript
contextBridge.exposeInMainWorld('electron', {
  database: {
    loadData: (table: string, query?: any) => ipcRenderer.invoke('db:load', table, query),
    saveData: (table: string, data: any) => ipcRenderer.invoke('db:save', table, data),
  },
  // ... 其他 API
});
```

### Pinia Store 整合（渲染程序）

**使用範例**:
```typescript
// src/renderer/stores/settings.ts
export const useSettingsStore = defineStore('settings', {
  actions: {
    async loadSettings() {
      const settings = await window.electron.database.loadData('app_settings');
      // 處理設定資料
    },

    async saveSetting(key: string, value: any) {
      await window.electron.database.saveData('app_settings', { key, value });
    },
  },
});
```

---

## 打包配置

### Vite 配置

**位置**: `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              // 關鍵：將 PGlite 標記為 external
              external: ['electron', '@electric-sql/pglite'],
            },
          },
          resolve: {
            // 確保 Node.js 內建模組被正確解析
            conditions: ['node'],
          },
        },
      },
    ]),
  ],
});
```

**重要說明**:
- PGlite **必須**標記為 `external`
- 不要讓 Vite 打包 PGlite，否則 WASM 文件路徑會錯誤
- 運行時從 `node_modules` 加載 PGlite

### Electron Builder 配置

**位置**: `electron-builder.json5`

```json5
{
  "files": [
    "dist/**/*",
    "package.json",
    "node_modules/@electric-sql/**/*"  // 明確包含 PGlite
  ],

  "npmRebuild": false,  // PGlite 是純 WASM，無需重建
}
```

**關鍵配置**:
- 明確包含 `node_modules/@electric-sql/**/*`
- 確保 WASM 文件和其他資源被打包
- 設定 `npmRebuild: false`（PGlite 無原生模組）

---

## 性能優化

### 1. 連接池管理

PGlite 使用單例模式，所有操作共享一個連接：

```typescript
// ✅ 正確：使用單例
const dbManager = DatabaseManager.getInstance();

// ❌ 錯誤：不要創建多個實例
const db1 = new DatabaseManager(); // 私有構造函數，無法這樣做
```

### 2. 異步操作

所有資料庫操作都是異步的：

```typescript
// ✅ 正確：使用 async/await
const services = await aiServiceRepo.findAll();

// ❌ 錯誤：同步調用
const services = aiServiceRepo.findAll(); // 返回 Promise，而非資料
```

### 3. 批量操作

對於大量插入，使用事務：

```typescript
await DatabaseManager.getInstance().transaction(async (client) => {
  for (const item of items) {
    await client.query('INSERT INTO table ...', [item]);
  }
});
```

### 4. 索引使用

確保查詢條件有對應索引：

```typescript
// ✅ 有索引：快速
SELECT * FROM chat_sessions WHERE ai_service_id = $1;

// ⚠️ 無索引：較慢
SELECT * FROM chat_sessions WHERE title LIKE '%keyword%';
```

---

## 測試策略

### 單元測試

**位置**: `tests/unit/database/`

```typescript
describe('AIServiceRepository', () => {
  let repo: AIServiceRepository;

  beforeEach(() => {
    // 使用 in-memory 資料庫
    repo = new AIServiceRepository();
  });

  it('should create AI service', async () => {
    const service = await repo.create({
      id: 'test-1',
      name: 'test',
      // ...
    });

    expect(service.id).toBe('test-1');
  });
});
```

### 整合測試

**位置**: `tests/integration/database/`

測試完整的資料流：
- DatabaseManager 初始化
- Repository 操作
- 事務處理
- IPC 通訊

---

## 故障排除

### 常見問題

#### 1. Windows 路徑錯誤

**錯誤**: `ERR_INVALID_URL_SCHEME`

**解決方案**:
```typescript
// 確保路徑使用正斜杠
this.dbPath = process.platform === 'win32'
  ? absolutePath.replace(/\\/g, '/')
  : absolutePath;
```

#### 2. WASM 文件找不到

**錯誤**: `Failed to load WASM file`

**解決方案**:
- 檢查 Vite 配置中 PGlite 是否為 `external`
- 檢查 electron-builder 配置是否包含 `node_modules/@electric-sql/**/*`

#### 3. 表格不存在

**錯誤**: `Unknown table: xxx`

**解決方案**:
- 確認 `schema.ts` 中有定義該表
- 確認 `initialize()` 有調用 `createTables()`
- 檢查 IPC handler 是否支援該表

#### 4. 異步操作錯誤

**錯誤**: `xxx.filter is not a function`

**解決方案**:
```typescript
// ❌ 錯誤
const data = repo.findAll();
const filtered = data.filter(...);  // data 是 Promise

// ✅ 正確
const data = await repo.findAll();
const filtered = data.filter(...);
```

---

## 開發工具

### PGlite Server（開發模式）

**啟動條件**: `NODE_ENV === 'development'`

**連接方式**:
```bash
# psql
psql -h localhost -p 5432 -U postgres -d postgres

# DBeaver
Host: localhost
Port: 5432
Database: postgres
Username: postgres
Password: (留空)
```

**常用查詢**:
```sql
-- 列出所有表格
\dt

-- 查看表結構
\d+ ai_services

-- 查看所有 AI 服務
SELECT id, display_name, is_available FROM ai_services;

-- 查看聊天會話統計
SELECT
  ai_service_id,
  COUNT(*) as session_count
FROM chat_sessions
GROUP BY ai_service_id;

-- 查看最近的訊息
SELECT
  s.title,
  m.content,
  m.timestamp
FROM chat_messages m
JOIN chat_sessions s ON m.session_id = s.id
ORDER BY m.timestamp DESC
LIMIT 10;
```

---

## 遷移指南

### 從其他資料庫遷移到 PGlite

#### 1. 評估相容性

PGlite 支援大部分 PostgreSQL 功能：
- ✅ 標準 SQL
- ✅ 索引、外鍵、約束
- ✅ 事務、ACID
- ✅ JSON 操作
- ❌ 擴展（如 PostGIS）
- ❌ 複製和分片

#### 2. 遷移步驟

1. **匯出現有資料**（如果需要）
2. **定義 PGlite Schema**（`schema.ts`）
3. **創建 Repository 類別**
4. **更新 IPC Handlers**
5. **測試資料操作**

#### 3. 資料匯入

```typescript
// 從 JSON 匯入
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

await DatabaseManager.getInstance().transaction(async (client) => {
  for (const item of data) {
    await client.query('INSERT INTO table_name ...', [item]);
  }
});
```

---

## 最佳實踐

### 1. 資料模型設計

- 使用有意義的表名和欄位名
- 適當使用外鍵約束
- 設計合理的索引策略
- 考慮資料增長和查詢模式

### 2. Repository 模式

- 每個主要實體有一個 Repository
- 複雜查詢封裝為 Repository 方法
- 避免在 UI 層直接寫 SQL
- 使用參數化查詢防止 SQL 注入

### 3. 錯誤處理

- 使用 try-catch 包裝資料庫操作
- 記錄詳細的錯誤信息
- 提供用戶友好的錯誤訊息
- 實作重試機制（如果需要）

### 4. 效能考量

- 使用索引加速查詢
- 批量操作使用事務
- 避免 N+1 查詢問題
- 定期清理舊資料

### 5. 測試

- 為每個 Repository 編寫單元測試
- 測試邊界條件和錯誤情況
- 使用 in-memory 資料庫加速測試
- 整合測試覆蓋完整流程

---

## 參考資源

### 官方文檔

- [PGlite GitHub](https://github.com/electric-sql/pglite)
- [PGlite 文檔](https://pglite.dev/)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)

### 相關專案

- [zym 專案](https://github.com/alexcode-cc/zym) - 成功的 PGlite 實作範例

### 內部文檔

- `PGLITE_SERVER_INTEGRATION.md` - PGlite Server 整合指南
- `WINDOWS_FIX.md` - Windows 11 兼容性修正
- `RUNTIME_ERRORS_FIX.md` - 運行時錯誤解決方案

---

## 版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|---------|
| 1.0.0 | 2025-11-11 | 初始版本，完整的 PGlite 架構實作 |

---

## 維護注意事項

### 升級 PGlite

1. **檢查版本兼容性**
   - PGlite 0.3.x 基於 PostgreSQL 17.x
   - 主版本升級可能不兼容資料格式

2. **測試流程**
   - 在測試環境驗證新版本
   - 備份現有資料庫
   - 執行完整的測試套件

3. **資料遷移**（如需要）
   ```typescript
   // 匯出資料
   const data = await repo.findAll();
   fs.writeFileSync('backup.json', JSON.stringify(data));

   // 升級後匯入
   const backup = JSON.parse(fs.readFileSync('backup.json'));
   for (const item of backup) {
     await repo.create(item);
   }
   ```

### 監控與日誌

- 使用 Logger 記錄資料庫操作
- 監控查詢性能
- 定期檢查資料庫大小
- 實作資料庫健康檢查

---

**文檔維護者**: Just Chat It 開發團隊
**最後更新**: 2025-11-11
**狀態**: ✅ 已驗證並在生產環境運行
