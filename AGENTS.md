# AGENTS.md

This file provides guidance to AI agents (including Cursor, Windsurf, Claude Code, and other AI coding assistants) when working with code in this repository.

> **Note**: This file is synchronized with `CLAUDE.md` to ensure consistent guidance across different AI development tools.

## 專案概述

Just Chat It 是一個現代化的多AI聊天桌面應用程式，採用 Electron + Vue 3 + Vuetify 架構，實現與多個AI服務（ChatGPT、Claude、Gemini等）的同時對話功能。

**當前版本**: MVP v1.0.0 (已完成所有 15 個核心任務)
**專案狀態**: ✅ MVP 開發完成，準備部署
**重要文檔**:
- MVP 總結: `MVP_SUMMARY.md`
- 待辦事項: `TODO.md`
- 任務詳情: `docs/mvp/task-*.md`

## 開發命令

### 專案設定與開發
```bash
# 安裝依賴
npm install

# 開發模式啟動
npm run dev

# 建置應用程式
npm run build

# 打包桌面應用
npm run dist
```

### 測試
```bash
# 執行單元測試
npm run test

# 執行E2E測試
npm run test:e2e

# 測試覆蓋率報告
npm run test:coverage
```

### 程式碼品質
```bash
# ESLint檢查
npm run lint

# 自動修復程式碼格式
npm run lint:fix

# Prettier格式化
npm run format
```

## 技術架構

### 核心技術棧
- **Electron**: 跨平台桌面應用框架
- **Vue 3**: 前端框架（使用 Composition API）
- **Vuetify 3**: Material Design 組件庫
- **TypeScript**: 類型安全開發
- **Vite**: 現代化建置工具
- **Pinia**: 狀態管理
- **SQLite**: 本地資料庫

### 架構模式
- **主程序 (Main Process)**: 處理應用生命週期、多視窗管理、系統整合、資料庫操作
- **渲染程序 (Renderer Process)**: Vue 3 應用邏輯、UI 渲染、WebView 整合
- **IPC 通訊**: 主程序與渲染程序間的型別安全通訊

## 專案結構

```
src/
├── main/                   # Electron 主程序
│   ├── window-manager.ts   # 視窗管理
│   ├── ipc-handlers.ts     # IPC 事件處理
│   ├── system-integration/ # 系統整合（托盤、熱鍵、剪貼簿）
│   └── database/           # SQLite 資料庫管理
├── renderer/               # Vue 渲染程序
│   ├── components/         # Vue 組件
│   │   ├── common/         # 通用組件
│   │   ├── dashboard/      # 主控制面板
│   │   ├── chat/           # 聊天相關組件
│   │   ├── compare/        # AI比較功能
│   │   ├── prompts/        # 提示詞管理
│   │   └── settings/       # 設定介面
│   ├── stores/             # Pinia 狀態管理
│   ├── types/              # TypeScript 類型定義
│   ├── utils/              # 工具函數
│   └── styles/             # 樣式檔案（含 Liquid Glass 效果）
├── shared/                 # 共用程式碼
│   ├── types/              # 共用類型定義
│   ├── constants/          # 常數定義
│   └── utils/              # 共用工具函數
└── assets/                 # 靜態資源
```

## 核心功能實作

### 多視窗管理
- 每個 AI 服務獨立的 BrowserWindow
- WebView 整合各 AI 服務網頁介面
- 視窗狀態和位置的持久化儲存

### 狀態管理架構
主要 Pinia Stores：
- **AIStore**: AI 服務管理、視窗狀態、額度追蹤
- **ChatStore**: 聊天會話管理、訊息記錄
- **PromptStore**: 提示詞庫管理
- **SettingsStore**: 應用程式設定

### 資料庫設計
SQLite 表格（共 9 個）：
- `ai_services`: AI 服務配置
- `chat_sessions`: 聊天會話
- `chat_messages`: 聊天訊息
- `prompts`: 提示詞庫
- `app_settings`: 應用程式設定
- `window_states`: 視窗狀態
- `quota_records`: 額度追蹤
- `comparison_sessions`: 比較會話
- `comparison_responses`: AI 回應

### Liquid Glass 視覺效果
- 採用 backdrop-filter 和 CSS 變數實現玻璃擬態效果
- 動態光影追蹤滑鼠位置
- 與 Vuetify 主題系統整合

## 開發規範

### 檔案命名
- Vue 組件: PascalCase (如 `ChatWindow.vue`)
- 工具函數: camelCase (如 `formatDate.ts`)
- 常數: UPPER_SNAKE_CASE (如 `AI_SERVICES.ts`)
- 類型定義: PascalCase (如 `AIService.ts`)

### TypeScript 要求
- 啟用嚴格模式
- 明確的類型定義，避免使用 `any`
- 介面優於類型別名
- IPC 通訊使用型別安全的 channel

### Vue 3 規範
- 使用 Composition API
- 明確定義 Props 和 Emits
- 響應式資料使用 ref/reactive

### CSS 規範
- 使用 SCSS 預處理器
- BEM 命名規範
- CSS 變數用於主題管理
- 響應式設計原則

## 重要開發注意事項

### WebView 整合
- 每個 AI 服務使用獨立的 WebView 載入官方網頁
- 實作離線存取功能，儲存聊天記錄到本地資料庫
- 處理網路錯誤和服務不可用狀態
- **MVP 經驗**: DOM 選擇器需要定期維護，AI 網站更新會導致擷取失效
- **建議**: 實作選擇器版本控制和自動檢測機制

### 系統整合功能
- 全域熱鍵註冊和管理
- 系統托盤整合
- 剪貼簿內容監控
- 桌面通知
- **MVP 經驗**: 熱鍵衝突需要提前檢測和警告
- **建議**: 提供熱鍵使用教學和常見衝突解決方案

### 效能考量
- 多視窗的記憶體管理
- WebView 資源清理
- Liquid Glass 效果的硬體加速
- 大量聊天記錄的虛擬化滾動
- **MVP 效能基準**:
  - 主視窗載入: < 2 秒
  - 記憶體使用: ~200-300 MB (單視窗)
  - CPU 使用: < 2% (閒置狀態)
  - 效能監控開銷: < 1% CPU

### 錯誤處理
- 分層錯誤處理：UI層、業務層、資料層、系統層
- 優雅降級到離線模式
- 用戶友好的錯誤訊息顯示
- **MVP 實作細節**:
  - 40+ 錯誤代碼分類
  - 4 個嚴重程度等級 (Debug/Info/Warn/Error/Fatal)
  - 自動日誌記錄和清理（保留 30 天）
  - 結構化 JSON 日誌格式

## 測試策略

### 測試類型與覆蓋率

- **單元測試**: Store actions、工具函數、資料模型（Vitest）
  - 目標覆蓋率: 80%+
  - MVP 狀態: 63+ 測試案例

- **整合測試**: IPC 通訊、資料庫操作、WebView 整合
  - Repository 層完整測試
  - IPC handlers 端到端測試

- **E2E 測試**: 完整用戶流程（Playwright for Electron）
  - 基礎設施已建立
  - 測試場景規劃完成（10+ 流程）

- **視覺回歸測試**: Liquid Glass 效果一致性
  - 待實作

### 測試最佳實踐

1. **測試隔離**
   - 每個測試獨立執行，使用 beforeEach 清理狀態
   - Mock 外部依賴（Electron API、資料庫）
   - 避免測試間相互影響

2. **測試資料工廠**
   - 使用統一的測試資料生成函數
   - 避免硬編碼測試資料
   - 測試邊界條件和異常情況

3. **Mock 策略**
   - Electron API 需要完整 Mock
   - 資料庫使用 in-memory 模式
   - 網路請求使用 Mock Service Worker

4. **效能測試**
   - 測試大量資料處理效能
   - 監控測試執行時間
   - 設定效能基準線

## MVP 實作經驗總結

### 已驗證的架構模式

1. **Repository Pattern 資料層**
   - 所有資料庫操作必須通過 Repository 類別
   - 使用 BaseRepository 統一錯誤處理和日誌記錄
   - 資料模型轉換集中在 Repository 層
   - 實作經驗：8 個 Repository 類別，處理 9 個資料表

2. **IPC 通訊模式**
   - 使用 TypeScript 介面定義 IPC 通道名稱常數
   - Preload 腳本必須明確公開所有 API
   - 主程序 handlers 需要完整的錯誤處理和日誌
   - 實作經驗：80+ IPC handlers，型別安全的雙向通訊

3. **效能監控整合**
   - 延遲啟動（應用啟動後 5 秒）避免影響啟動時間
   - 使用防抖機制（500ms）減少頻繁操作
   - 分層監控：系統層、程序層、視窗層
   - 實作經驗：記憶體、CPU、系統資源即時監控

4. **Liquid Glass 視覺系統**
   - CSS 變數集中管理主題參數
   - 使用 backdrop-filter 實現玻璃效果
   - 動態光影效果需要 JavaScript 與 CSS 配合
   - 提供 5 種預設方案和效能模式選項

### 關鍵技術決策

1. **SQLite WAL 模式**
   - 啟用 WAL 模式提升並發效能
   - 定期 checkpoint 控制 WAL 檔案大小
   - 使用 prepared statements 防止 SQL 注入

2. **WebView 隔離策略**
   - 使用 partition 機制隔離各 AI 服務
   - 禁用 Node.js 整合在 WebView 中
   - JavaScript 注入實現內容擷取

3. **Pinia Store 架構**
   - 6 個主要 Store: AI, Chat, Prompt, Settings, Compare, Error
   - Store 間通訊使用 actions 而非直接存取 state
   - 持久化使用資料庫而非 localStorage

### 已知陷阱與注意事項

1. **Electron 特定問題**
   - WebView 的 DOM 存取受限，需注入腳本
   - IPC 通訊是非同步的，需要正確處理 Promise
   - BrowserWindow 關閉需要明確清理資源（防止記憶體洩漏）

2. **Vue 3 Composition API**
   - 注意響應式資料的生命週期
   - 組件卸載時清理定時器和事件監聽器
   - Pinia actions 中避免直接修改其他 Store 的 state

3. **打包與分發**
   - 原生依賴（如 better-sqlite3）需要為所有平台編譯
   - macOS 公證需要 Apple Developer 帳號
   - Windows 防毒軟體可能誤報，需要程式碼簽署
   - 測試所有平台的安裝和更新流程

### 效能優化經驗

1. **記憶體管理**
   - 虛擬滾動處理大量列表（>1000 項）
   - WebView 資源及時清理
   - 圖片懶加載
   - 避免記憶體洩漏（事件監聽器清理）

2. **啟動優化**
   - 延遲載入非關鍵模組
   - 資料庫連接池複用
   - 最小化主程序初始化邏輯
   - 成果：主視窗載入 < 2 秒

3. **渲染優化**
   - Liquid Glass 效果使用 GPU 加速（transform3d, will-change）
   - 減少不必要的重繪（React.memo 概念應用）
   - 使用 CSS transform 替代 position
   - 成果：保持 60 FPS

## Git 提交規範

採用 AngularJS Git Commit Message Conventions（繁體中文）：
- `feat: 功能描述` - 新功能
- `fix: 修復描述` - 錯誤修復
- `docs: 文件描述` - 文件更新
- `style: 樣式描述` - 程式碼格式調整
- `refactor: 重構描述` - 程式碼重構
- `test: 測試描述` - 測試相關
- `build: 建置描述` - 建置系統或外部相依性

**提交訊息範例**：
```
feat: 新增 GPU 使用率監控功能

- 實作 GPU 使用率追蹤
- 新增 GPU 記憶體監控
- 整合到效能監控儀表板
- 新增相關單元測試

Closes #123
```

**提交前檢查清單**：
- [ ] 執行 `npm run lint` 無錯誤
- [ ] 執行 `npm run test` 所有測試通過
- [ ] 更新相關文檔
- [ ] 程式碼符合專案規範