# Task 1 實作計劃：建立專案基礎架構

## 🧠 Ultra Think 深度分析

### 📋 任務內容解析
**Task 1**: 建立專案基礎架構
- 初始化 Electron + Vue3 + Vuetify 專案結構
- 設定 TypeScript 配置和開發環境
- 建立基本的主程序和渲染程序架構
- 配置 Vite 建置工具和熱重載
- 更新 TASK_SUMMARY.md 記錄專案基礎架構完成狀況
- 執行 Git Commit (feat: 建立專案基礎架構和開發環境)

### 🔍 深度技術分析

#### 1. **架構複雜度評估**
- **技術棧整合難度**: ⭐⭐⭐⭐ (高)
- **配置複雜度**: ⭐⭐⭐⭐ (高)
- **版本相容性風險**: ⭐⭐⭐ (中高)

#### 2. **核心技術挑戰**
- **Electron + Vite 整合**: 需要正確處理主程序/渲染程序的建置分離
- **TypeScript 配置**: 需要同時支援 Node.js 和 Browser 環境的類型
- **Vue3 + Vuetify3**: 需要處理 SSR 相容性和主題系統整合
- **IPC 通訊架構**: 需要設計型別安全的跨程序通訊

#### 3. **關鍵決策點**
- **建置工具選擇**: Vite vs Webpack (選擇 Vite 以獲得更快的開發體驗)
- **程序隔離策略**: contextIsolation + preload script 確保安全性
- **狀態管理架構**: Pinia 整合時機和架構設計
- **樣式系統**: SCSS + CSS Variables 為 Liquid Glass 做準備

## 📝 詳細實作計劃

### 🎯 階段一：專案初始化與基礎配置 (預估 2-3 小時)

#### 1.1 專案結構建立
```bash
# 建立專案根目錄結構
mkdir -p src/{main,renderer,shared,assets}
mkdir -p src/renderer/{components,stores,types,utils,styles}
mkdir -p src/renderer/components/{common,dashboard,chat,compare,prompts,settings}
mkdir -p src/shared/{types,constants,utils}
mkdir -p tests/{unit,integration,e2e}
mkdir -p resources/{icons,images}
```

#### 1.2 套件管理與依賴安裝
```json
{
  "name": "just-chat-it",
  "version": "1.0.0",
  "main": "dist/main/index.js",
  "dependencies": {
    "vue": "^3.3.0",
    "vuetify": "^3.4.0",
    "pinia": "^2.1.0",
    "vue-router": "^4.2.0",
    "electron": "^27.0.0",
    "sqlite3": "^5.1.0"
  },
  "devDependencies": {
    "vite": "^4.5.0",
    "typescript": "^5.2.0",
    "@vitejs/plugin-vue": "^4.4.0",
    "vite-plugin-electron": "^0.14.0",
    "vite-plugin-electron-renderer": "^0.14.0",
    "electron-builder": "^24.6.0",
    "vitest": "^0.34.0",
    "@vue/test-utils": "^2.4.0",
    "eslint": "^8.50.0",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "prettier": "^3.0.0",
    "sass": "^1.69.0",
    "concurrently": "^8.2.0"
  }
}
```

#### 1.3 TypeScript 配置策略

**根目錄 tsconfig.json (基礎配置)**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/*"],
      "@main/*": ["src/main/*"],
      "@shared/*": ["src/shared/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

**src/main/tsconfig.json (主程序)**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "lib": ["ES2020"],
    "target": "ES2020",
    "outDir": "../../dist/main",
    "types": ["node"]
  },
  "include": ["./**/*"],
  "exclude": ["node_modules"]
}
```

**src/renderer/tsconfig.json (渲染程序)**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "target": "ES2020",
    "outDir": "../../dist/renderer",
    "types": ["vite/client", "node"]
  },
  "include": ["./**/*", "../shared/**/*"],
  "exclude": ["node_modules"]
}
```

### 🎯 階段二：Electron 主程序架構 (預估 1-2 小時)

#### 2.1 主程序核心模組

**src/main/index.ts - 應用程式入口點**
```typescript
import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { setupIpcHandlers } from './ipc-handlers';
import path from 'path';

class Application {
  private windowManager: WindowManager;

  constructor() {
    this.windowManager = new WindowManager();
    this.setupApp();
  }

  private setupApp() {
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', this.onActivate);
  }

  private async onReady() {
    setupIpcHandlers();
    await this.windowManager.createMainWindow();
  }

  private onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.windowManager.createMainWindow();
    }
  }
}

new Application();
```

**src/main/window-manager.ts - 視窗管理**
```typescript
import { BrowserWindow, screen } from 'electron';
import path from 'path';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private chatWindows: Map<string, BrowserWindow> = new Map();

  async createMainWindow(): Promise<BrowserWindow> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
      width: Math.min(1200, width - 100),
      height: Math.min(800, height - 100),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
      },
      frame: false,
      transparent: true,
      titleBarStyle: 'hidden'
    });

    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    return this.mainWindow;
  }

  createChatWindow(aiServiceId: string): BrowserWindow {
    const chatWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
      },
      frame: false,
      transparent: true
    });

    this.chatWindows.set(aiServiceId, chatWindow);

    chatWindow.on('closed', () => {
      this.chatWindows.delete(aiServiceId);
    });

    return chatWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  getChatWindow(aiServiceId: string): BrowserWindow | undefined {
    return this.chatWindows.get(aiServiceId);
  }
}
```

**src/main/preload.ts - 預載入腳本**
```typescript
import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // 視窗控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // AI 服務
  createChatWindow: (serviceId: string) => ipcRenderer.invoke('ai:create-chat-window', serviceId),

  // 系統整合
  readClipboard: () => ipcRenderer.invoke('system:read-clipboard'),

  // 資料庫
  saveData: (table: string, data: any) => ipcRenderer.invoke('db:save', table, data),
  loadData: (table: string, query?: any) => ipcRenderer.invoke('db:load', table, query)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
```

#### 2.2 IPC 事件處理
**src/main/ipc-handlers.ts**
```typescript
import { ipcMain, BrowserWindow } from 'electron';

export function setupIpcHandlers() {
  // 視窗控制
  ipcMain.handle('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.handle('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  // AI 服務相關 IPC handlers 將在後續階段實作
}
```

### 🎯 階段三：Vue3 + Vuetify 渲染程序 (預估 2-3 小時)

#### 3.1 Vue 應用程式架構

**src/renderer/main.ts - Vue 應用入口**
```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import App from './App.vue';
import routes from './router';

// Vuetify 樣式
import 'vuetify/styles';
import './styles/main.scss';

// 創建 Vuetify 實例
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'liquidGlass',
    themes: {
      liquidGlass: {
        dark: false,
        colors: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          accent: '#3B82F6',
          surface: 'rgba(255, 255, 255, 0.1)',
          background: 'rgba(248, 250, 252, 0.8)',
        }
      }
    }
  }
});

// 創建路由
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 創建 Pinia store
const pinia = createPinia();

// 創建 Vue 應用
const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(vuetify);
app.mount('#app');
```

**src/renderer/App.vue - 根組件**
```vue
<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
// 基本的 App 組件，路由將決定顯示的內容
</script>

<style lang="scss">
// 全域樣式將在 styles/main.scss 中定義
</style>
```

**src/renderer/router/index.ts - 路由配置**
```typescript
import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/components/dashboard/MainDashboard.vue')
  },
  {
    path: '/chat/:serviceId',
    name: 'Chat',
    component: () => import('@/components/chat/ChatWindow.vue')
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/components/compare/CompareWindow.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/components/settings/SettingsPanel.vue')
  }
];

export default routes;
```

#### 3.2 基礎組件結構

**src/renderer/components/dashboard/MainDashboard.vue**
```vue
<template>
  <v-container fluid class="liquid-glass-bg pa-0">
    <div class="window-title-bar">
      <span class="app-title">Just Chat It</span>
      <window-controls />
    </div>

    <v-main class="pa-4">
      <h1 class="text-h4 mb-4">多 AI 聊天桌面</h1>
      <p>基礎架構已建立，準備進行後續功能開發</p>
    </v-main>
  </v-container>
</template>

<script setup lang="ts">
import WindowControls from '@/components/common/WindowControls.vue';
</script>

<style lang="scss" scoped>
.liquid-glass-bg {
  min-height: 100vh;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(20px);
}

.window-title-bar {
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  -webkit-app-region: drag;
}

.app-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
}
</style>
```

**src/renderer/components/common/WindowControls.vue**
```vue
<template>
  <div class="window-controls">
    <v-btn
      icon
      size="small"
      variant="text"
      @click="minimizeWindow"
      class="control-btn"
    >
      <v-icon size="16">mdi-minus</v-icon>
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      @click="maximizeWindow"
      class="control-btn"
    >
      <v-icon size="16">mdi-square-outline</v-icon>
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      @click="closeWindow"
      class="control-btn close-btn"
    >
      <v-icon size="16">mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const minimizeWindow = () => {
  window.electronAPI?.minimizeWindow();
};

const maximizeWindow = () => {
  window.electronAPI?.maximizeWindow();
};

const closeWindow = () => {
  window.electronAPI?.closeWindow();
};
</script>

<style lang="scss" scoped>
.window-controls {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;

  &.close-btn:hover {
    background-color: #ff5f57 !important;
    color: white !important;
  }
}
</style>
```

### 🎯 階段四：Vite 建置配置最佳化 (預估 1 小時)

#### 4.1 Vite 主配置
**vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'src/main/index.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            sourcemap: process.env.NODE_ENV === 'development',
            minify: process.env.NODE_ENV !== 'development',
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'src/main/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            sourcemap: process.env.NODE_ENV === 'development',
            minify: process.env.NODE_ENV !== 'development',
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
```

#### 4.2 Electron Builder 配置
**electron-builder.json**
```json
{
  "appId": "com.alexcode.just-chat-it",
  "productName": "Just Chat It",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "resources/**/*",
    "package.json"
  ],
  "mac": {
    "category": "public.app-category.productivity",
    "target": "dmg"
  },
  "win": {
    "target": "nsis"
  },
  "linux": {
    "target": "AppImage"
  }
}
```

### 🎯 階段五：開發工具與品質保證 (預估 1 小時)

#### 5.1 開發腳本配置
**package.json scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "build:electron": "npm run build && electron-builder",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.vue --fix",
    "lint:check": "eslint src --ext .ts,.vue",
    "format": "prettier --write \"src/**/*.{ts,vue,scss}\"",
    "format:check": "prettier --check \"src/**/*.{ts,vue,scss}\"",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "type-check": "vue-tsc --noEmit"
  }
}
```

#### 5.2 ESLint 配置
**.eslintrc.js**
```javascript
module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/no-explicit-any': 'warn',
    'vue/multi-word-component-names': 'off'
  }
};
```

#### 5.3 Prettier 配置
**.prettierrc**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

#### 5.4 基礎樣式架構
**src/renderer/styles/main.scss**
```scss
// 重置和基礎樣式
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
  overflow: hidden;
}

// Liquid Glass 基礎效果（為後續階段準備）
.liquid-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

// 無邊框視窗樣式
.window-content {
  border-radius: 16px;
  overflow: hidden;
}

// 基礎動畫
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

#### 5.5 TypeScript 全域類型定義
**src/renderer/types/global.d.ts**
```typescript
import type { ElectronAPI } from '../../main/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
```

## ⚠️ 風險評估與應對策略

### 高風險項目
1. **版本相容性問題** (機率: 中等 | 影響: 高)
   - **應對**: 使用經過驗證的版本組合，建立 package-lock.json 鎖定版本
   - **檢測**: 建立自動化測試確保依賴正常運作

2. **Vite + Electron 整合複雜度** (機率: 高 | 影響: 中等)
   - **應對**: 使用成熟的 vite-plugin-electron，按步驟逐步整合
   - **檢測**: 確保開發模式和建置模式都能正常運作

3. **IPC 通訊架構設計** (機率: 中等 | 影響: 中等)
   - **應對**: 先實作基本通訊，使用 TypeScript 確保型別安全
   - **檢測**: 建立基本的 IPC 通訊測試

4. **安全性配置** (機率: 低 | 影響: 高)
   - **應對**: 嚴格遵循 Electron 安全最佳實踐
   - **檢測**: 確保 contextIsolation 和 nodeIntegration 設定正確

### 中風險項目
1. **路徑別名配置** (機率: 中等 | 影響: 低)
   - **應對**: 統一配置 TypeScript、Vite 和 ESLint 的路徑解析
2. **樣式系統整合** (機率: 低 | 影響: 中等)
   - **應對**: 循序漸進整合 Vuetify 和自定義樣式

## ✅ 成功標準檢查點

### 基礎功能驗證
- [ ] `npm run dev` 成功啟動應用程式
- [ ] Electron 視窗正常顯示，無錯誤訊息
- [ ] Vue 根組件正常渲染
- [ ] Vuetify 組件樣式正常顯示
- [ ] 視窗控制按鈕（最小化、最大化、關閉）正常運作
- [ ] TypeScript 編譯零錯誤警告

### 開發環境驗證
- [ ] 熱重載功能正常（修改程式碼自動重新載入）
- [ ] ESLint 檢查通過
- [ ] Prettier 格式化正常運作
- [ ] TypeScript 類型檢查通過

### 建置功能驗證
- [ ] `npm run build` 成功建置
- [ ] 建置輸出檔案結構正確
- [ ] 生產模式應用程式正常啟動

### 程式碼品質驗證
- [ ] 所有檔案遵循專案命名規範
- [ ] 路徑別名正常解析
- [ ] IPC 基礎通訊測試通過

## 📋 交付清單

### 檔案結構
```
src/
├── main/
│   ├── index.ts              ✅ 主程序入口
│   ├── window-manager.ts     ✅ 視窗管理
│   ├── ipc-handlers.ts       ✅ IPC 事件處理
│   └── preload.ts            ✅ 預載入腳本
├── renderer/
│   ├── main.ts               ✅ Vue 應用入口
│   ├── App.vue               ✅ 根組件
│   ├── components/
│   │   ├── common/
│   │   │   └── WindowControls.vue  ✅ 視窗控制
│   │   └── dashboard/
│   │       └── MainDashboard.vue   ✅ 主面板
│   ├── router/
│   │   └── index.ts          ✅ 路由配置
│   ├── styles/
│   │   └── main.scss         ✅ 主樣式檔案
│   └── types/
│       └── global.d.ts       ✅ 全域類型定義
└── shared/                   📁 共用程式碼目錄
```

### 配置檔案
- ✅ `package.json` - 專案依賴和腳本
- ✅ `tsconfig.json` - TypeScript 基礎配置
- ✅ `src/main/tsconfig.json` - 主程序 TS 配置
- ✅ `src/renderer/tsconfig.json` - 渲染程序 TS 配置
- ✅ `vite.config.ts` - Vite 建置配置
- ✅ `electron-builder.json` - 打包配置
- ✅ `.eslintrc.js` - ESLint 規則
- ✅ `.prettierrc` - Prettier 格式化配置

### 開發腳本
- ✅ `npm run dev` - 開發模式啟動
- ✅ `npm run build` - 建置應用程式
- ✅ `npm run lint` - 程式碼檢查
- ✅ `npm run format` - 程式碼格式化
- ✅ `npm run type-check` - TypeScript 類型檢查

## 🎯 實作後續步驟

### 立即後續任務
1. 建立 `TASK_SUMMARY.md` 並記錄 Task 1 完成狀況
2. 執行 Git commit: `feat: 建立專案基礎架構和開發環境`
3. 進行 Task 2: 實作核心資料層

### 為後續任務做準備
1. **資料庫整合點**: `src/shared/types` 中準備資料庫相關類型定義
2. **狀態管理整合**: `src/renderer/stores` 目錄已準備好 Pinia store
3. **樣式系統準備**: 基礎 Liquid Glass 樣式類別已定義
4. **組件架構**: 組件目錄結構已按功能模組組織

## 📝 注意事項

### 開發過程注意事項
1. **安全優先**: 確保 Electron 安全設定正確配置
2. **型別安全**: 所有 IPC 通訊都應有明確的 TypeScript 類型定義
3. **效能考量**: 開發模式下啟用 source map，生產模式下關閉以提升效能
4. **跨平台相容**: 測試 Windows、macOS、Linux 的基本功能

### 程式碼品質要求
1. **命名規範**: 嚴格遵循已定義的檔案和變數命名規範
2. **註解要求**: 關鍵邏輯和複雜配置需要適當註解
3. **錯誤處理**: 所有異步操作都應包含錯誤處理
4. **測試準備**: 為關鍵功能預留測試介面

這個實作計劃提供了完整的 Task 1 實作路線圖，確保建立穩固的專案基礎架構，為後續的功能開發奠定良好基礎。