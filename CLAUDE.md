# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 專案概述

Just Chat It 是一個現代化的**多 AI 聊天桌面應用程式**，採用 **Electron + Vue 3 + Vuetify 3** 架構，實現與多個 AI 服務（ChatGPT、Claude、Gemini 等）的同時對話功能。

- **當前版本**: MVP v1.0.0 (已完成所有 15 個核心任務)
- **專案狀態**: ✅ MVP 開發完成，資料庫已重構為 PGlite
- **核心技術**: TypeScript + Vue 3 Composition API + PGlite (PostgreSQL WASM)

**重要文檔**（優先級順序）:
1. **`TODO.md`** - 後續待辦事項和功能規劃
2. **`docs/DATABASE_ARCHITECTURE.md`** - PGlite 資料庫完整架構
3. **`MVP_SUMMARY.md`** - MVP v1.0.0 總結報告
4. **`PGLITE_SERVER_INTEGRATION.md`** - 開發工具配置
5. **`WINDOWS_FIX.md`** 及 **`RUNTIME_ERRORS_FIX.md`** - 已知問題修復記錄

---

## ⚡ 快速命令參考

### 開發和建置
```bash
npm install              # 安裝所有依賴
npm run dev             # 開發模式啟動（熱重載）
npm run build           # 建置應用（TypeScript + Vite）
npm run dist            # 打包桌面應用（當前平台）
npm run build:win       # Windows 應用打包
npm run build:mac       # macOS 應用打包
npm run build:linux     # Linux 應用打包
```

### 測試與檢查
```bash
npm run test                    # 執行單元測試（Vitest）
npm run test -- path/to/file    # 執行單個測試文件
npm run test:coverage          # 測試覆蓋率報告
npm run type-check             # TypeScript 類型檢查
npm run lint:check             # 檢查代碼品質（不修復）
```

### 代碼品質
```bash
npm run lint            # ESLint 檢查並自動修復
npm run format          # Prettier 格式化代碼
npm run format:check    # 檢查代碼格式（不修改）
npm run lint:check      # ESLint 僅檢查（不修復）
```

### 預覽和調試
```bash
npm run preview         # 預覽構建結果（無 Electron）
```

---

## 🛠️ 開發環境設定

### 環境要求
- **Node.js**: v16+ （推薦 v18 LTS）
- **npm**: v8+
- **操作系統**: Windows / macOS / Linux
- **編輯器**: VS Code （推薦）

### VS Code 推薦擴展
- **Vue.volar** - Vue 3 官方支持
- **TypeScript.tsserver** - TypeScript 語言支持
- **dbaeumer.vscode-eslint** - ESLint 實時檢查
- **esbenp.prettier-vscode** - Prettier 格式化
- **bradlc.vscode-tailwindcss** - CSS 智能提示（可選）

### 初始設定步驟
```bash
# 1. 克隆並安裝依賴
git clone <repo>
cd Just-Chat-It
npm install

# 2. 開發模式啟動（默認在 http://localhost:5173）
npm run dev

# 3. （可選）啟動 PGlite 開發服務器
# 用於使用 psql、DBeaver 等標準工具調試資料庫
pglite-server
# 連接: psql -h localhost -p 5432 -U postgres -d postgres
```

### 當前開發狀況
⚠️ **未完成的更改** — 檢查 git 狀態：
```bash
git status      # 查看所有修改
git diff        # 查看詳細改動
```

---

## 📊 技術架構

### 核心技術棧
| 用途 | 技術 | 版本 |
|-----|------|------|
| 桌面框架 | Electron | ^27.0.0 |
| UI 框架 | Vue 3 + Vuetify 3 | ^3.3.0 / ^3.4.0 |
| 狀態管理 | Pinia | ^2.1.0 |
| 路由 | Vue Router | ^4.2.0 |
| 資料庫 | PGlite (PostgreSQL WASM) | 0.3.3 |
| 語言 | TypeScript | ^5.2.0 |
| 構建工具 | Vite | ^4.5.0 |
| 測試 | Vitest | ^0.34.0 |
| 格式化 | Prettier | ^3.0.0 |

### 應用架構模式

```
主程序 (Main Process)
├── Electron 生命週期管理
├── 多視窗管理 (BrowserWindow)
├── IPC 通訊層 (80+ handlers)
├── 系統整合 (托盤、熱鍵、剪貼簿)
└── 資料庫層 (PGlite + Repository Pattern)

渲染程序 (Renderer Process)
├── Vue 3 應用（Composition API）
├── Pinia 狀態管理（6 個 stores）
├── 組件層（dashboard、chat、settings 等）
├── WebView 整合（各 AI 服務網頁）
└── 樣式系統（Liquid Glass 視覺效果）

共用層 (Shared)
├── TypeScript 類型定義
├── IPC channel 常數定義
├── 通用工具函數
└── 常數和枚舉
```

### 重要的架構決策

1. **IPC 通訊型別安全**
   - Preload 腳本明確公開所有 API
   - 使用 TypeScript 介面定義 channel 常數
   - 主程序 handlers 完整的錯誤處理和日誌

2. **Repository Pattern 資料層**
   - 所有資料庫操作通過 Repository 類別
   - BaseRepository 統一錯誤處理
   - 8 個 Repository 類別處理 10 個資料表

3. **Pinia Store 架構**
   - 6 個主要 Store: AI, Chat, Prompt, Settings, Compare, Error
   - Store 間通訊使用 actions（不直接存取 state）
   - 持久化使用資料庫（不用 localStorage）

4. **PGlite 資料庫整合**
   - 純 WASM 實作，無需原生模組編譯
   - 異步 API：所有 Repository 方法使用 async/await
   - DatabaseManager 單例模式管理連接
   - 參數化查詢防止 SQL 注入

---

## 📁 專案結構詳解

```
src/
├── main/                              # Electron 主程序
│   ├── index.ts                       # 應用入口
│   ├── window-manager.ts              # 多視窗管理（BrowserWindow 創建和生命週期）
│   ├── ipc-handlers.ts                # IPC 事件處理（80+ handlers）
│   ├── preload.ts                     # Preload 腳本（API 安全暴露）
│   ├── system-integration/            # 系統整合模組
│   │   ├── hotkey-manager.ts          # 全域熱鍵註冊和管理
│   │   ├── tray-manager.ts            # 系統托盤整合
│   │   ├── clipboard-monitor.ts       # 剪貼簿監控（可選）
│   │   └── notification-service.ts    # 系統通知
│   └── database/                      # PGlite 資料庫層
│       ├── manager.ts                 # DatabaseManager（單例）
│       ├── migrations.ts              # 資料庫初始化和遷移
│       └── repositories/              # Repository Pattern 實現
│           ├── BaseRepository.ts
│           ├── AIServiceRepository.ts
│           ├── ChatSessionRepository.ts
│           ├── ChatMessageRepository.ts
│           ├── PromptRepository.ts
│           ├── SettingsRepository.ts
│           ├── WindowStateRepository.ts
│           ├── HotKeyRepository.ts
│           ├── QuotaRepository.ts
│           └── ComparisonRepository.ts
│
├── renderer/                          # Vue 3 渲染程序
│   ├── App.vue                        # 根組件
│   ├── main.ts                        # Vue 應用入口
│   ├── components/                    # Vue 組件層
│   │   ├── common/                    # 通用組件（按鈕、卡片等）
│   │   ├── dashboard/                 # 主控制面板組件
│   │   ├── chat/                      # 聊天相關組件（ChatWindow、MessageList 等）
│   │   ├── compare/                   # AI 比較功能組件
│   │   ├── prompts/                   # 提示詞管理組件
│   │   └── settings/                  # 設定介面組件
│   │
│   ├── stores/                        # Pinia 狀態管理（6 個 stores）
│   │   ├── ai.ts                      # AI 服務狀態（視窗、額度）
│   │   ├── chat.ts                    # 聊天會話和訊息
│   │   ├── prompt.ts                  # 提示詞庫管理
│   │   ├── settings.ts                # 應用設定
│   │   ├── compare.ts                 # 比較功能狀態
│   │   └── error.ts                   # 全局錯誤處理
│   │
│   ├── types/                         # TypeScript 類型定義
│   │   ├── index.ts                   # 公共類型
│   │   ├── api.ts                     # API 相關類型
│   │   ├── database.ts                # 資料庫模型類型
│   │   └── ipc.ts                     # IPC 通訊類型
│   │
│   ├── utils/                         # 工具函數
│   │   ├── format.ts                  # 格式化函數（日期、文本等）
│   │   ├── validate.ts                # 驗證函數
│   │   ├── dom.ts                     # DOM 操作輔助
│   │   └── error-handler.ts           # 錯誤處理工具
│   │
│   ├── styles/                        # 全局樣式
│   │   ├── main.scss                  # 全局樣式入口
│   │   ├── variables.scss             # CSS 變數定義
│   │   ├── liquid-glass.scss          # Liquid Glass 效果
│   │   ├── theme.scss                 # 主題系統
│   │   └── responsive.scss            # 響應式設計
│   │
│   ├── chat-window.html               # 聊天視窗 HTML 模板
│   └── vite-env.d.ts                  # Vite 環境類型定義
│
├── shared/                            # 共用程式碼（主和渲染程序都可用）
│   ├── types/                         # 共用類型定義
│   │   └── index.ts
│   ├── constants/                     # 常數定義
│   │   ├── AI_SERVICES.ts             # AI 服務配置
│   │   ├── IPC_CHANNELS.ts            # IPC channel 常數
│   │   ├── ERROR_CODES.ts             # 錯誤代碼定義
│   │   └── APP_CONFIG.ts              # 應用程式配置
│   └── utils/                         # 共用工具函數
│       ├── logger.ts                  # 日誌記錄
│       └── validators.ts              # 通用驗證函數
│
└── assets/                            # 靜態資源
    ├── icons/                         # 應用圖示
    └── images/                        # 圖片資源
```

---

## 🔄 核心功能實作指南

### 添加新的 AI 服務

1. **在 `shared/constants/AI_SERVICES.ts` 中定義服務配置**
   ```typescript
   export const NEW_SERVICE = {
     id: 'new-service',
     name: 'New AI Service',
     url: 'https://...',
     icon: 'mdi-...'
   }
   ```

2. **在資料庫中添加記錄**
   - AIServiceRepository 提供 CRUD 方法
   - 確保使用 async/await

3. **在 AIStore 中添加視窗狀態管理**
   - 跟蹤視窗開啟/關閉狀態
   - 儲存視窗位置和尺寸

4. **創建 WebView 整合**
   - 在 window-manager.ts 中創建新的 BrowserWindow
   - 設定 WebView partition 隔離

5. **添加 IPC handlers**
   - 在 ipc-handlers.ts 中添加服務特定的 handlers
   - 包括內容擷取和狀態同步

### 添加新的資料庫表

1. **定義 TypeScript 類型**
   ```typescript
   // src/renderer/types/database.ts
   export interface NewTable {
     id: number
     name: string
     // 其他欄位...
   }
   ```

2. **創建 Repository 類**
   ```typescript
   // src/main/database/repositories/NewTableRepository.ts
   export class NewTableRepository extends BaseRepository {
     // 實作 CRUD 操作
   }
   ```

3. **添加資料庫遷移**
   - 在 migrations.ts 中定義表格建立 SQL
   - 使用參數化查詢

4. **添加 IPC handlers**
   - 在 ipc-handlers.ts 中暴露 Repository 方法

### 添加新的提示詞功能

1. **擴展 PromptRepository**
   - 添加新的查詢方法
   - 支援標籤、分類等過濾

2. **在 PromptStore 中添加 actions**
   - 調用 IPC handlers
   - 更新本地狀態

3. **創建提示詞管理 UI 組件**
   - 在 renderer/components/prompts/ 中添加組件

---

## 🔌 IPC 通訊指南

### IPC 通訊架構

```
主程序 (Main Process)              渲染程序 (Renderer Process)
      ↑                                   ↑
      │ ipcMain.handle()                 │ ipcRenderer.invoke()
      │ (異步事件処理)                    │
      ├─────────────────────────────────┤
      │ IPC Channel 常數 (shared)        │
      └─────────────────────────────────┘
```

### 實作新的 IPC Handler 檢查清單

1. **定義 IPC Channel 常數**
   ```typescript
   // shared/constants/IPC_CHANNELS.ts
   export const IPC_NEW_FEATURE = {
     GET: 'new-feature:get',
     CREATE: 'new-feature:create',
     UPDATE: 'new-feature:update'
   }
   ```

2. **在 Preload 中暴露 API**
   ```typescript
   // src/main/preload.ts
   contextBridge.exposeInMainWorld('api', {
     newFeature: {
       get: (id) => ipcRenderer.invoke(IPC_NEW_FEATURE.GET, id),
       create: (data) => ipcRenderer.invoke(IPC_NEW_FEATURE.CREATE, data)
     }
   })
   ```

3. **在主程序中實作 Handler**
   ```typescript
   // src/main/ipc-handlers.ts
   ipcMain.handle(IPC_NEW_FEATURE.GET, async (event, id) => {
     try {
       return await repository.getById(id)
     } catch (error) {
       logger.error('Failed to get:', error)
       throw error
     }
   })
   ```

4. **在 Vue 組件中調用**
   ```typescript
   // 在 setup() 中
   const result = await window.api.newFeature.get(id)
   ```

### IPC 通訊最佳實踐

- ✅ **始終使用 async/await** — IPC 是異步的
- ✅ **明確定義類型** — 使用 TypeScript interfaces
- ✅ **完整的錯誤處理** — 主程序中處理所有異常
- ✅ **日誌記錄** — 使用 logger 記錄操作
- ❌ **避免在 Preload 中進行重邏輯** — 只暴露 API
- ❌ **避免大資料傳輸** — 考慮分頁或流傳輸

---

## 🧪 測試策略

### 測試類型和覆蓋率目標

| 測試類型 | 工具 | 目標覆蓋率 | 現狀 |
|---------|------|----------|------|
| 單元測試 | Vitest | 80%+ | 63+ 案例 |
| 整合測試 | Vitest | 70%+ | Repository 層 |
| E2E 測試 | Playwright | 基本流程 | 基礎設施已建立 |
| 視覺回歸測試 | - | - | 待實作 |

### 運行測試

```bash
# 執行所有測試
npm run test

# 執行單個測試文件
npm run test -- src/renderer/stores/ai.spec.ts

# 監視模式（自動重新運行）
npm run test -- --watch

# 測試覆蓋率報告
npm run test:coverage

# 生成 HTML 覆蓋率報告
npm run test:coverage -- --reporter=html
```

### 測試檔案位置約定

- 單元測試：與原始檔案同目錄，命名為 `*.spec.ts`
- 整合測試：`src/__tests__/integration/`
- E2E 測試：`e2e/` （待實作）
- Mock 資料：`src/__tests__/fixtures/`

### 測試最佳實踐

1. **測試隔離**
   ```typescript
   beforeEach(() => {
     // 清理狀態
     vi.clearAllMocks()
   })
   ```

2. **Mock 外部依賴**
   ```typescript
   vi.mock('electron', () => ({
     ipcRenderer: { invoke: vi.fn() }
   }))
   ```

3. **使用測試資料工廠**
   ```typescript
   const createMockChat = (overrides = {}) => ({
     id: 1,
     title: 'Test Chat',
     ...overrides
   })
   ```

4. **測試異步代碼**
   ```typescript
   it('should handle async operations', async () => {
     const result = await someAsyncFunction()
     expect(result).toBe(expected)
   })
   ```

---

## 📋 開發規範

### 檔案命名規範

| 類型 | 規範 | 範例 |
|-----|------|------|
| Vue 組件 | PascalCase | `ChatWindow.vue`, `MessageList.vue` |
| TypeScript 檔案 | camelCase | `formatDate.ts`, `validate.ts` |
| 常數定義 | UPPER_SNAKE_CASE | `AI_SERVICES.ts`, `IPC_CHANNELS.ts` |
| 類型定義 | PascalCase | `AIService.ts`, `ChatMessage.ts` |
| 測試檔案 | *.spec.ts | `formatDate.spec.ts` |

### TypeScript 要求

- ✅ 啟用 TypeScript 嚴格模式
- ✅ 明確的類型定義（避免 `any`）
- ✅ 使用 interfaces 而非 type aliases（可優化性能）
- ✅ IPC 通訊使用型別安全的 channels
- ✅ 異步函數明確標記 `async`

### Vue 3 Composition API 規範

```typescript
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  props: {
    modelValue: String
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isLoading = ref(false)

    const upperValue = computed(() => props.modelValue.toUpperCase())

    onMounted(() => {
      // 初始化邏輯
    })

    onUnmounted(() => {
      // 清理邏輯
    })

    return { isLoading, upperValue }
  }
}
```

### SCSS/CSS 規範

```scss
// 使用 CSS 變數用於主題管理
$primary: var(--color-primary)
$spacing: var(--spacing-unit, 8px)

// BEM 命名規範
.chat-window {
  &__header { /* ... */ }
  &__body { /* ... */ }
  &__footer { /* ... */ }

  &--loading { /* 修飾符 */ }
}

// 響應式設計
@media (max-width: 768px) {
  .chat-window {
    padding: $spacing * 1
  }
}
```

---

## ⚠️ 重要注意事項和已知陷阱

### Electron 特定問題

| 問題 | 解決方案 |
|-----|--------|
| WebView 的 DOM 存取受限 | 使用 JavaScript 注入進行內容擷取 |
| IPC 通訊是異步的 | 始終使用 await 或 .then() 處理 Promise |
| 記憶體洩漏（BrowserWindow 關閉） | 在 window-manager.ts 明確清理資源 |
| Preload 腳本限制 | 只在 Preload 中暴露 API，不進行複雜邏輯 |

### Vue 3 Composition API 注意事項

- ⚠️ 響應式資料的生命週期管理
- ⚠️ 組件卸載時清理定時器和事件監聽器
- ⚠️ Pinia actions 中避免直接修改其他 Store 的 state
- ⚠️ 避免在 computed 中進行副作用操作

### 打包與分發注意事項

**PGlite 配置**:
- 純 WASM 實作，無需原生模組編譯
- Vite: 將 `@electric-sql/pglite` 標記為 external
- electron-builder: 明確包含 `node_modules/@electric-sql/**/*`
- 設定 `npmRebuild: false`
- 確保 WASM 文件被正確打包

**平台特定**:
- **Windows**: 路徑標準化（使用正斜杠），防毒軟體可能誤報
- **macOS**: 公證需要 Apple Developer 帳號
- **Linux**: 測試不同發行版兼容性

### 資料庫操作注意事項

- ✅ 所有資料庫操作都必須通過 Repository 類別
- ✅ 使用參數化查詢防止 SQL 注入：`$1, $2, ...`
- ✅ 異步操作：所有 Repository 方法使用 `async/await`
- ✅ Windows 路徑兼容性：使用正斜杠格式路徑
- ❌ 避免直接在 Store actions 中執行 SQL
- ❌ 避免在主線程中執行長時間的資料庫查詢

### WebView 和內容擷取

**已知限制**:
- DOM 選擇器依賴 AI 網站結構，更新後可能失效
- 無法擷取圖片和附件
- 格式化內容可能遺失部分樣式

**最佳實踐**:
- 定期檢查選擇器的有效性
- 實作選擇器版本控制
- 提供用戶反饋機制
- 考慮使用官方 API（如果可用）

### 效能優化基準

| 指標 | 目標 | 現狀 |
|-----|------|------|
| 主視窗載入 | < 2 秒 | ✅ 已達成 |
| 記憶體使用（單視窗） | ~200-300 MB | ✅ 已達成 |
| CPU 使用（閒置） | < 2% | ✅ 已達成 |
| 效能監控開銷 | < 1% CPU | ✅ 已達成 |

---

## 🔐 安全性指南

### 敏感資料處理

- ❌ **不要** 在代碼中硬編碼 API keys
- ✅ **使用** 環境變數或安全存儲（SQLite 加密）
- ✅ **限制** IPC API 暴露範圍
- ✅ **驗證** 所有渲染程序的請求

### Content Security Policy (CSP)

```html
<!-- src/renderer/chat-window.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'"
>
```

### 參數化查詢（防止 SQL 注入）

```typescript
// ✅ 正確的方式
await db.query('SELECT * FROM users WHERE id = $1', [userId])

// ❌ 錯誤的方式（永遠不要這樣做）
await db.query(`SELECT * FROM users WHERE id = ${userId}`)
```

---

## 📝 Git 提交規範

採用 **AngularJS Git Commit Message Conventions**（繁體中文）：

```
<type>: <subject>

<body>

<footer>
```

### 提交類型

| 類型 | 說明 | 範例 |
|-----|------|------|
| `feat` | 新功能 | `feat: 新增 GPU 使用率監控` |
| `fix` | 錯誤修復 | `fix: 修復異步 Repository 方法缺少 await` |
| `docs` | 文件更新 | `docs: 更新資料庫架構文檔` |
| `style` | 代碼格式調整（無邏輯改變） | `style: 格式化 TypeScript 代碼` |
| `refactor` | 代碼重構（無功能改變） | `refactor: 簡化 IPC handlers 邏輯` |
| `test` | 測試相關 | `test: 新增 AIStore 單元測試` |
| `build` | 建置系統或依賴更新 | `build: 升級 Vue 到 3.4.0` |

### 提交訊息範例

```
feat: 新增 AI 服務額度追蹤功能

- 實作 QuotaRepository 支援額度管理
- 添加 quota_tracking 資料表
- 集成到 AIStore 進行實時追蹤
- 在設定介面顯示額度使用情況
- 新增相關單元測試（覆蓋率 85%+）

Closes #123
Co-Authored-By: Team Member <email>
```

### 提交前檢查清單

```bash
# 1. 類型檢查
npm run type-check

# 2. 代碼品質檢查
npm run lint:check

# 3. 代碼格式檢查
npm run format:check

# 4. 運行單元測試（與本次更改相關）
npm run test -- src/path/to/affected.spec.ts

# 5. 最後提交
git add .
git commit -m "feat: 功能描述"
```

---

## 🔗 常用資源和工具

### 官方文檔
- [Electron 文檔](https://www.electronjs.org/docs)
- [Vue 3 官方文檔](https://vuejs.org/)
- [Vuetify 3 文檔](https://vuetifyjs.com/)
- [Pinia 文檔](https://pinia.vuejs.org/)
- [TypeScript 官方文檔](https://www.typescriptlang.org/)
- [PGlite 文檔](https://pglite.io/)

### 開發工具

| 工具 | 用途 | 命令 |
|-----|------|------|
| **VS Code** | 代碼編輯器 | - |
| **DevTools** | Electron 調試 | F12 或 Ctrl+Shift+I |
| **psql** | 資料庫客戶端 | `psql -h localhost -p 5432 -U postgres` |
| **DBeaver** | 圖形化資料庫管理工具 | 連接 localhost:5432 |
| **Vitest UI** | 測試可視化 | `npm run test -- --ui` |

### 推薦的 VS Code 設定

```json
{
  "[vue]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsserver.experimental.enableProjectDiagnostics": true,
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 📚 進階主題

### Liquid Glass 視覺效果實作

Liquid Glass 是使用 CSS 和 JavaScript 實現的玻璃擬態效果：

- **CSS 變數**：集中管理主題參數（顏色、透明度等）
- **backdrop-filter**：實現毛玻璃效果
- **JavaScript 動畫**：滑鼠追蹤的動態光影
- **效能優化**：GPU 加速（transform3d, will-change）

詳見：`src/renderer/styles/liquid-glass.scss`

### 效能監控系統

四層監控架構：
1. **系統層**：CPU、記憶體、磁碟使用率
2. **程序層**：Electron 進程資源使用
3. **視窗層**：各 BrowserWindow 的資源佔用
4. **應用層**：自訂性能指標

延遲啟動和防抖機制避免影響應用效能。

### 錯誤處理系統

- **40+ 錯誤代碼分類**
- **4 個嚴重程度等級**：Debug/Info/Warn/Error/Fatal
- **自動日誌記錄**：結構化 JSON 格式，保留 30 天
- **用戶友好的錯誤訊息**

詳見：`shared/constants/ERROR_CODES.ts` 和 `src/shared/utils/logger.ts`

### WebView 隔離和安全

- **Partition 隔離**：各 AI 服務使用獨立的 WebView partition
- **禁用 Node.js**：WebView 中不能存取 Node.js API
- **內容擷取**：通過 JavaScript 注入進行受控提取
- **Cookie 隔離**：各服務的 Cookie 獨立存儲

---

## 🆘 常見問題和疑難排解

### 開發相關

**Q: 開發時熱重載不工作？**
A: 檢查 Vite 配置，確保在監視模式。重新啟動 `npm run dev`。

**Q: TypeScript 類型錯誤但代碼能運行？**
A: 運行 `npm run type-check` 查看詳細錯誤。確保依賴項已安裝。

**Q: 資料庫操作返回 undefined？**
A: 檢查是否在 Repository 方法前添加了 `await`。所有操作都是異步的。

### 打包相關

**Q: Windows 應用被防毒軟體標記為威脅？**
A: 這是誤報（false positive）。見 `WINDOWS_FIX.md`。

**Q: macOS 無法打開應用（未驗證的開發者）？**
A: 需要代碼簽名和公證。見 PGLITE_SERVER_INTEGRATION.md。

**Q: 打包後 WASM 文件找不到？**
A: 檢查 electron-builder 配置，確保 `node_modules/@electric-sql/**/*` 被包含。

---

**最後更新**: 2025-11-13
**維護者**: Just Chat It 開發團隊
