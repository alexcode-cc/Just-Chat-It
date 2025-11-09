# Task 13: 錯誤處理和日誌系統

**完成日期**: 2025-11-09

## 概述

建立完整的錯誤處理和日誌記錄系統，提供分層錯誤管理、結構化日誌記錄、用戶友好的錯誤顯示，以及全面的日誌查看功能。

## 核心功能

### 1. 錯誤分類系統

#### 錯誤代碼定義 (`error-codes.ts`)
- **錯誤類別**: 9 種主要類別（Database, Network, FileSystem, Validation, IPC, Window, AI Service, System, Unknown）
- **錯誤代碼**: 40+ 個標準化錯誤代碼
- **嚴重程度**: 4 個等級（Low, Medium, High, Critical）

錯誤代碼格式：
```
[類別][編號]
例如: DB_001 = 資料庫連接失敗
      NET_002 = 網路超時
      AI_001 = AI 服務不可用
```

#### 錯誤類別系統 (`app-error.ts`)
- **基礎錯誤類**: `AppError` - 繼承自 Error，增加代碼、類別、嚴重程度等屬性
- **特殊錯誤類**: 8 個領域特定錯誤類
  - `DatabaseError`
  - `NetworkError`
  - `FileSystemError`
  - `ValidationError`
  - `IPCError`
  - `WindowError`
  - `AIServiceError`
  - `SystemError`

錯誤類別特性：
- 完整的堆疊追蹤保留
- 原始錯誤包裝
- JSON 序列化支援
- 用戶友好訊息轉換

### 2. 日誌管理系統

#### Logger 類別 (`logger.ts`, 420+ 行)

**核心功能**:
- **日誌等級**: Debug, Info, Warn, Error, Fatal
- **雙重輸出**: Console 輸出 + 檔案寫入
- **自動化管理**:
  - 按日期分檔 (`app-YYYY-MM-DD.log`)
  - 自動清理舊日誌（保留 7 天）
  - 檔案大小限制（10MB）
  - WAL 模式寫入流

**日誌格式**:
```json
{
  "timestamp": "2025-11-09T10:30:00.000Z",
  "level": "error",
  "message": "Database query failed",
  "context": {
    "query": "SELECT * FROM users",
    "userId": "123"
  },
  "error": {
    "name": "DatabaseError",
    "message": "Connection timeout",
    "stack": "...",
    "code": "DB_002"
  }
}
```

**主要方法**:
```typescript
logger.debug(message, context?)
logger.info(message, context?)
logger.warn(message, context?, error?)
logger.error(message, error?, context?)
logger.fatal(message, error?, context?)
logger.getLogFiles() // 取得所有日誌檔案
logger.readLogFile(filePath, maxLines?) // 讀取日誌
logger.exportLogs() // 匯出為 JSON
```

#### ErrorHandler 類別 (`error-handler.ts`, 280+ 行)

**全域錯誤處理**:
- 未捕獲異常處理 (`uncaughtException`)
- 未處理的 Promise rejection (`unhandledRejection`)
- Electron 渲染程序錯誤 (`render-process-gone`)

**錯誤統計追蹤**:
```typescript
{
  total: 125,
  byLevel: {
    low: 20,
    medium: 80,
    high: 20,
    critical: 5
  },
  byCategory: {
    database: 15,
    network: 30,
    ai_service: 40
  },
  recent: [/* 最近 100 個錯誤 */]
}
```

**輔助功能**:
- `safeExecute()`: 安全執行函數，自動捕獲錯誤
- `wrapIPCHandler()`: IPC Handler 包裝器，統一錯誤處理
- 錯誤對話框顯示（嚴重錯誤）
- 錯誤回報機制（預留整合介面）

### 3. 渲染程序日誌

#### RendererLogger (`logger.ts`)
- 透過 IPC 將日誌發送到主程序
- Console 即時輸出
- 與主程序日誌統一管理

### 4. 用戶界面

#### ErrorStore (`error.ts`, 140+ 行)
**狀態管理**:
- 錯誤通知佇列（最多 5 個）
- 最後錯誤記錄
- 自動移除機制

**通知類型**:
- `showError(message, details?, duration)` - 錯誤通知（紅色）
- `showWarning(message, details?, duration)` - 警告通知（橙色）
- `showInfo(message, details?, duration)` - 資訊通知（藍色）

**智能處理**:
- 根據錯誤嚴重程度自動選擇通知類型
- 嚴重錯誤不自動關閉
- 詳情展開/折疊功能

#### ErrorNotification 組件 (`ErrorNotification.vue`)
- Vuetify Snackbar 實現
- 詳情展開功能
- 可關閉的通知卡片
- Liquid Glass 視覺效果整合

#### ErrorNotificationContainer 組件
- 固定在右上角
- 自動堆疊多個通知
- 非阻塞式設計

#### LogViewer 組件 (`LogViewer.vue`, 380+ 行)

**主要功能**:
1. **日誌列表顯示**
   - 虛擬滾動（高效能，支援大量日誌）
   - 等級顏色標示
   - 時間戳格式化

2. **篩選和搜尋**
   - 日誌等級篩選
   - 全文搜尋（訊息、上下文、錯誤）
   - 日誌檔案選擇

3. **統計儀表板**
   - 總計日誌數
   - 錯誤、警告、資訊分類統計
   - 即時更新

4. **操作功能**
   - 重新載入日誌
   - 匯出日誌（JSON 格式）
   - 開啟日誌資料夾
   - 日誌詳情查看對話框

5. **詳情對話框**
   - 完整錯誤堆疊顯示
   - 上下文 JSON 格式化
   - 錯誤詳細資訊

### 5. 全域錯誤捕獲

#### App.vue 整合
```typescript
// Vue 組件錯誤
onErrorCaptured((error, instance, info) => {
  errorStore.handleError(error, `組件錯誤: ${info}`);
})

// 全域 JavaScript 錯誤
window.addEventListener('error', (event) => {
  errorStore.handleError(event.error, '全域錯誤');
})

// 未處理的 Promise rejection
window.addEventListener('unhandledrejection', (event) => {
  errorStore.handleError(event.reason, '未處理的 Promise 錯誤');
})
```

### 6. IPC 整合

**新增 8 個 IPC Handlers**:
1. `log:write` - 從渲染程序寫入日誌
2. `log:get-files` - 取得日誌檔案列表
3. `log:read-file` - 讀取日誌檔案
4. `log:export` - 匯出日誌
5. `log:open-directory` - 開啟日誌目錄
6. `error:get-stats` - 取得錯誤統計
7. `error:clear-stats` - 清除錯誤統計
8. `log:set-level` - 設定日誌等級

**Preload API 擴展**:
```typescript
window.electronAPI.log(level, message, context?, error?)
window.electronAPI.getLogFiles()
window.electronAPI.readLogFile(filePath, maxLines?)
window.electronAPI.exportLogs()
window.electronAPI.openLogDirectory()
window.electronAPI.getErrorStats()
window.electronAPI.clearErrorStats()
window.electronAPI.setLogLevel(level)
```

### 7. 主程序整合

#### index.ts 改進
- 應用啟動時初始化 Logger 和 ErrorHandler
- 所有關鍵操作記錄日誌
- 錯誤自動捕獲和記錄
- 應用關閉時清理資源

改進後的日誌輸出示例：
```
[2025-11-09 10:30:00] [INFO] Application starting...
[2025-11-09 10:30:01] [INFO] Database initialized
[2025-11-09 10:30:01] [INFO] Default data initialized
[2025-11-09 10:30:02] [INFO] Application initialized successfully
```

## 技術實作細節

### 錯誤處理架構

```
┌─────────────────────────────────────────┐
│           User Interface                │
│  ┌───────────────────────────────────┐  │
│  │  ErrorNotificationContainer       │  │
│  │  - 顯示錯誤通知                   │  │
│  │  - 自動堆疊和移除                 │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Error Store (Pinia)             │
│  - 錯誤通知管理                         │
│  - 根據嚴重程度分類                     │
│  - 自動記錄到日誌                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Renderer Logger (IPC)              │
│  - 發送日誌到主程序                     │
│  - Console 即時輸出                     │
└──────────────┬──────────────────────────┘
               │
               ▼ IPC
┌─────────────────────────────────────────┐
│       Main Process Logger               │
│  - 檔案寫入                             │
│  - 日誌管理                             │
│  - 錯誤統計                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Error Handler                     │
│  - 全域錯誤捕獲                         │
│  - 錯誤分類和處理                       │
│  - 錯誤恢復策略                         │
└─────────────────────────────────────────┘
```

### 日誌存儲架構

```
userData/logs/
├── app-2025-11-09.log          # 今天的日誌
├── app-2025-11-08.log          # 昨天的日誌
├── app-2025-11-07.log
├── ...
├── exports/
│   ├── logs-export-2025-11-09T10-30-00.json
│   └── ...
```

### 錯誤處理策略

#### 分層處理
1. **UI 層**: 用戶友好的錯誤訊息
2. **業務層**: 錯誤分類和記錄
3. **資料層**: 原始錯誤保留
4. **系統層**: 全域錯誤捕獲

#### 錯誤恢復
- **Low 嚴重程度**: 僅記錄，不影響操作
- **Medium 嚴重程度**: 顯示警告，允許繼續
- **High 嚴重程度**: 顯示錯誤，中止當前操作
- **Critical 嚴重程度**: 顯示錯誤對話框，可能退出應用

## 程式碼統計

| 項目 | 數量 |
|------|------|
| **新增檔案** | 10 個 |
| **總代碼行數** | ~1,800 行 |
| **錯誤類別** | 9 種 |
| **錯誤代碼** | 40+ 個 |
| **IPC Handlers** | 8 個 |
| **Vue 組件** | 3 個 |

### 新增檔案清單

```
src/
├── shared/
│   ├── constants/
│   │   └── error-codes.ts                 (100 行)
│   └── errors/
│       └── app-error.ts                   (180 行)
├── main/
│   └── logging/
│       ├── logger.ts                      (420 行)
│       ├── error-handler.ts               (280 行)
│       └── index.ts                       (2 行)
└── renderer/
    ├── stores/
    │   └── error.ts                       (140 行)
    ├── utils/
    │   └── logger.ts                      (100 行)
    └── components/
        ├── common/
        │   ├── ErrorNotification.vue      (120 行)
        │   └── ErrorNotificationContainer.vue (30 行)
        └── settings/
            └── LogViewer.vue              (380 行)
```

### 修改檔案清單

```
src/
├── main/
│   ├── index.ts                           (+30 行)
│   ├── ipc-handlers.ts                    (+130 行)
│   └── preload.ts                         (+9 行)
└── renderer/
    ├── App.vue                            (+30 行)
    ├── router/index.ts                    (+5 行)
    └── components/
        └── dashboard/
            └── MainDashboard.vue          (+12 行)
```

## 使用範例

### 主程序錯誤處理

```typescript
import { Logger } from './logging/logger';
import { ErrorHandler } from './logging/error-handler';
import { DatabaseError, ERROR_CODES } from '../shared/errors/app-error';

const logger = Logger.getInstance();
const errorHandler = ErrorHandler.getInstance();

// 記錄日誌
logger.info('Starting database operation', { userId: '123' });

try {
  // 執行操作
  const result = await database.query(sql);
  logger.debug('Query result', { rowCount: result.length });
} catch (error) {
  // 建立特定錯誤
  const dbError = new DatabaseError(
    'Failed to execute query',
    ERROR_CODES.DB_QUERY_FAILED,
    { sql, userId: '123' },
    error as Error
  );

  // 處理錯誤
  errorHandler.handleError(dbError, {
    logError: true,
    showDialog: true
  });
}

// 安全執行
const result = await errorHandler.safeExecute(async () => {
  return await riskyOperation();
});
```

### 渲染程序錯誤處理

```typescript
import { logger } from '@/utils/logger';
import { useErrorStore } from '@/stores/error';

const errorStore = useErrorStore();

// 記錄日誌
logger.info('User action', { action: 'click', button: 'submit' });

try {
  await submitForm(data);
  errorStore.showInfo('表單提交成功');
} catch (error) {
  logger.error('Form submission failed', error);
  errorStore.showError('表單提交失敗', error.message);
}

// 使用 Store 的安全執行
const result = await errorStore.safeExecute(
  async () => await apiCall(),
  '呼叫 API 失敗'
);
```

### IPC Handler 錯誤處理

```typescript
import { ErrorHandler } from './logging/error-handler';

const errorHandler = ErrorHandler.getInstance();

// 包裝 IPC Handler
ipcMain.handle('data:save', errorHandler.wrapIPCHandler(
  async (event, data) => {
    // 業務邏輯
    const result = await saveData(data);
    return { success: true, result };
  }
));
```

## 主要優勢

### 1. 完整的錯誤追蹤
- 所有錯誤都被記錄和分類
- 完整的堆疊追蹤保留
- 錯誤統計和分析

### 2. 開發者友好
- 結構化日誌格式
- 易於搜尋和篩選
- 詳細的錯誤上下文

### 3. 用戶友好
- 清晰的錯誤訊息
- 非阻塞式通知
- 可選的詳情展示

### 4. 維護便利
- 自動日誌清理
- 日誌檔案管理
- 匯出功能

### 5. 效能優化
- 虛擬滾動（大量日誌）
- 防抖機制（日誌寫入）
- 條件式日誌等級

## 測試建議

### 單元測試
- [ ] Logger 日誌寫入和讀取
- [ ] ErrorHandler 錯誤分類
- [ ] AppError 序列化
- [ ] ErrorStore 通知管理

### 整合測試
- [ ] IPC 日誌通訊
- [ ] 日誌檔案寫入和讀取
- [ ] 錯誤統計追蹤
- [ ] 全域錯誤捕獲

### UI 測試
- [ ] 錯誤通知顯示
- [ ] LogViewer 篩選和搜尋
- [ ] 日誌詳情對話框
- [ ] 匯出功能

## 未來改進

### 功能增強
1. **錯誤回報服務整合**
   - Sentry / Bugsnag 整合
   - 自動錯誤上傳
   - 錯誤趨勢分析

2. **日誌分析**
   - 錯誤模式識別
   - 效能瓶頸分析
   - 使用行為追蹤

3. **進階篩選**
   - 正則表達式搜尋
   - 時間範圍篩選
   - 多條件組合

4. **日誌視覺化**
   - 錯誤趨勢圖表
   - 時間軸視圖
   - 熱力圖

### 效能優化
1. **日誌壓縮**
   - gzip 壓縮舊日誌
   - 減少磁碟使用

2. **索引建立**
   - 日誌索引檔案
   - 加速搜尋

3. **分頁載入**
   - 延遲載入日誌
   - 減少記憶體使用

## 相關文件

- [TASK_SUMMARY.md](../../TASK_SUMMARY.md) - 專案總覽
- [error-codes.ts](../../src/shared/constants/error-codes.ts) - 錯誤代碼定義
- [app-error.ts](../../src/shared/errors/app-error.ts) - 錯誤類別
- [logger.ts](../../src/main/logging/logger.ts) - 日誌管理器
- [error-handler.ts](../../src/main/logging/error-handler.ts) - 錯誤處理器

## 總結

Task 13 成功建立了一個完整、專業的錯誤處理和日誌記錄系統，為應用程式提供了：

✅ **分層錯誤管理** - 從 UI 到系統層的完整錯誤處理
✅ **結構化日誌** - JSON 格式，易於搜尋和分析
✅ **用戶友好** - 清晰的錯誤訊息和通知系統
✅ **開發者工具** - 強大的日誌查看器和統計功能
✅ **自動化管理** - 日誌清理、統計追蹤、錯誤捕獲
✅ **生產就緒** - 完整的錯誤恢復策略和監控機制

這個系統為應用程式的穩定性、可維護性和用戶體驗奠定了堅實的基礎。

---

**最後更新**: 2025-11-09
**文檔版本**: v1.0
