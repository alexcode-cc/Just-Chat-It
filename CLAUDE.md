# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Just Chat It 是一個現代化的多AI聊天桌面應用程式，採用 Electron + Vue 3 + Vuetify 架構，實現與多個AI服務（ChatGPT、Claude、Gemini等）的同時對話功能。

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
SQLite 表格：
- `ai_services`: AI 服務配置
- `chat_sessions`: 聊天會話
- `chat_messages`: 聊天訊息
- `prompts`: 提示詞庫
- `app_settings`: 應用程式設定

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

### 系統整合功能
- 全域熱鍵註冊和管理
- 系統托盤整合
- 剪貼簿內容監控
- 桌面通知

### 效能考量
- 多視窗的記憶體管理
- WebView 資源清理
- Liquid Glass 效果的硬體加速
- 大量聊天記錄的虛擬化滾動

### 錯誤處理
- 分層錯誤處理：UI層、業務層、資料層、系統層
- 優雅降級到離線模式
- 用戶友好的錯誤訊息顯示

## 測試策略

- **單元測試**: Store actions、工具函數、資料模型（Vitest）
- **整合測試**: IPC 通訊、資料庫操作、WebView 整合
- **E2E 測試**: 完整用戶流程（Playwright for Electron）
- **視覺回歸測試**: Liquid Glass 效果一致性

## Git 提交規範

採用 AngularJS Git Commit Message Conventions：
- `feat: 功能描述` - 新功能
- `fix: 修復描述` - 錯誤修復
- `docs: 文件描述` - 文件更新
- `style: 樣式描述` - 程式碼格式調整
- `refactor: 重構描述` - 程式碼重構
- `test: 測試描述` - 測試相關
- `build: 建置描述` - 建置系統或外部相依性