# 專案結構規範

## 整體專案架構

```
Just-Chat-It/
├── src/                        # 原始碼目錄
│   ├── main/                   # Electron主程序
│   ├── renderer/               # Vue渲染程序
│   ├── shared/                 # 共用程式碼
│   └── assets/                 # 靜態資源
├── tests/                      # 測試檔案
├── docs/                       # 專案文件
│   ├── specs/                  # 功能規格文件
│   └── steering/               # 專案指導文件
├── dist/                       # 建置輸出
└── resources/                  # 應用程式資源
```

## 主程序結構 (src/main/)

```
main/
├── index.ts                    # 主程序入口點
├── window-manager.ts           # 視窗管理器
├── ipc-handlers.ts            # IPC事件處理
├── system-integration/         # 系統整合功能
│   ├── tray.ts                # 系統托盤
│   ├── hotkeys.ts             # 全域熱鍵
│   ├── clipboard.ts           # 剪貼簿監控
│   └── notifications.ts       # 桌面通知
├── database/                   # 資料庫相關
│   ├── connection.ts          # 資料庫連接
│   ├── migrations/            # 資料庫遷移
│   └── repositories/          # 資料存取層
└── utils/                     # 主程序工具函數
```

## 渲染程序結構 (src/renderer/)

```
renderer/
├── main.ts                    # 渲染程序入口
├── App.vue                    # 根組件
├── components/                # Vue組件
│   ├── common/               # 通用組件
│   │   ├── LiquidGlassButton.vue
│   │   ├── LiquidGlassCard.vue
│   │   └── WindowControls.vue
│   ├── dashboard/            # 主控制面板組件
│   │   ├── MainDashboard.vue
│   │   ├── AIStatusGrid.vue
│   │   └── QuickActions.vue
│   ├── chat/                 # 聊天相關組件
│   │   ├── ChatWindow.vue
│   │   ├── AIWebView.vue
│   │   └── ChatHistory.vue
│   ├── compare/              # 比較功能組件
│   │   ├── CompareWindow.vue
│   │   └── AIComparePanel.vue
│   ├── prompts/              # 提示詞管理組件
│   │   ├── PromptLibrary.vue
│   │   ├── PromptEditor.vue
│   │   └── PromptCard.vue
│   └── settings/             # 設定頁面組件
│       ├── SettingsPanel.vue
│       ├── ThemeSettings.vue
│       └── HotkeySettings.vue
├── stores/                   # Pinia狀態管理
│   ├── ai.ts                # AI服務狀態
│   ├── chat.ts              # 聊天會話狀態
│   ├── prompt.ts            # 提示詞狀態
│   ├── settings.ts          # 應用程式設定
│   └── ui.ts                # UI狀態
├── router/                   # Vue Router配置
│   └── index.ts
├── types/                    # TypeScript類型定義
│   ├── ai-service.ts
│   ├── chat.ts
│   ├── prompt.ts
│   └── settings.ts
├── utils/                    # 工具函數
│   ├── date.ts
│   ├── validation.ts
│   └── format.ts
├── styles/                   # 樣式檔案
│   ├── main.scss            # 主樣式檔案
│   ├── liquid-glass.scss    # Liquid Glass效果
│   ├── themes/              # 主題檔案
│   │   ├── light.scss
│   │   └── dark.scss
│   └── components/          # 組件樣式
└── assets/                   # 渲染程序資源
    ├── icons/
    ├── images/
    └── fonts/
```

## 共用程式碼結構 (src/shared/)

```
shared/
├── types/                     # 共用類型定義
│   ├── ipc.ts                # IPC通訊類型
│   ├── database.ts           # 資料庫類型
│   └── common.ts             # 通用類型
├── constants/                # 常數定義
│   ├── ai-services.ts        # AI服務配置
│   ├── hotkeys.ts            # 預設熱鍵
│   └── app-config.ts         # 應用程式配置
└── utils/                    # 共用工具函數
    ├── crypto.ts             # 加密工具
    ├── validation.ts         # 驗證工具
    └── logger.ts             # 日誌工具
```

## 測試結構 (tests/)

```
tests/
├── unit/                     # 單元測試
│   ├── main/                # 主程序測試
│   ├── renderer/            # 渲染程序測試
│   └── shared/              # 共用程式碼測試
├── integration/             # 整合測試
│   ├── ipc/                # IPC通訊測試
│   ├── database/           # 資料庫測試
│   └── webview/            # WebView整合測試
├── e2e/                    # 端到端測試
│   ├── chat-flow.spec.ts   # 聊天流程測試
│   ├── hotkeys.spec.ts     # 熱鍵功能測試
│   └── multi-window.spec.ts # 多視窗測試
├── fixtures/               # 測試資料
└── helpers/                # 測試輔助函數
```

## 組件命名規範

### Vue組件
- **頁面組件**: `[Feature]Page.vue` (例: `ChatPage.vue`)
- **佈局組件**: `[Layout]Layout.vue` (例: `MainLayout.vue`)
- **功能組件**: `[Feature][Component].vue` (例: `ChatWindow.vue`)
- **通用組件**: `[Component].vue` (例: `Button.vue`)

### 檔案命名
- **組件檔案**: PascalCase (例: `ChatWindow.vue`)
- **工具檔案**: kebab-case (例: `date-utils.ts`)
- **類型檔案**: kebab-case (例: `ai-service.ts`)
- **常數檔案**: kebab-case (例: `app-config.ts`)

## 資料夾組織原則

### 功能導向分組
- 相關功能的組件放在同一資料夾
- 每個功能模組包含組件、樣式、測試
- 避免過深的巢狀結構

### 共用資源集中
- 通用組件放在`common/`資料夾
- 共用工具函數放在`utils/`資料夾
- 類型定義集中在`types/`資料夾

### 測試檔案對應
- 測試檔案結構對應原始碼結構
- 單元測試檔案命名: `[filename].test.ts`
- E2E測試檔案命名: `[feature].spec.ts`

## 匯入路徑規範

### 路徑別名設定
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  }
});
```

### 匯入順序
1. Node.js內建模組
2. 第三方套件
3. 專案內部模組 (使用別名)
4. 相對路徑匯入

```typescript
// 範例
import { app } from 'electron';
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';

import { AIService } from '@shared/types/ai-service';
import { WindowManager } from '@main/window-manager';
import ChatWindow from '@/components/chat/ChatWindow.vue';

import './styles/main.scss';
```

## 配置檔案組織

### 根目錄配置
- `package.json`: 專案依賴和腳本
- `tsconfig.json`: TypeScript配置
- `vite.config.ts`: Vite建置配置
- `electron-builder.json`: 打包配置
- `.eslintrc.js`: ESLint規則
- `vitest.config.ts`: 測試配置

### 環境配置
- `.env.development`: 開發環境變數
- `.env.production`: 生產環境變數
- `.env.test`: 測試環境變數

## 資源管理

### 圖示資源
- 應用程式圖示: `resources/icons/`
- UI圖示: `src/assets/icons/`
- AI服務圖示: `src/assets/ai-logos/`

### 多語言支援 (預留)
```
src/locales/
├── zh-TW.json              # 繁體中文
├── zh-CN.json              # 簡體中文
├── en-US.json              # 英文
└── ja-JP.json              # 日文
```

這個結構設計確保了程式碼的可維護性、可擴展性和團隊協作效率。