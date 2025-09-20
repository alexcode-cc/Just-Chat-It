# 設計文件

## 概述

多AI聊天桌面應用程式是一個基於 Electron + Vue3 + Vuetify 的現代化桌面應用，採用 iOS 26 Liquid Glass 設計語言。應用程式允許用戶透過多個獨立視窗與不同AI服務進行對話，每個視窗都具備獨立的會話管理、離線存取功能，並整合提示詞管理和智能剪貼簿功能。

## 架構

### 整體架構

```
┌─────────────────────────────────────────────────────────────┐
│                    主程序 (Main Process)                      │
├─────────────────────────────────────────────────────────────┤
│  • 應用程式生命週期管理                                        │
│  • 多視窗管理 (BrowserWindow)                                │
│  • 系統托盤與熱鍵註冊                                         │
│  • 本地資料庫管理 (SQLite)                                   │
│  • 剪貼簿監控                                               │
│  • IPC 通訊協調                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ IPC 通訊
                              │
┌─────────────────────────────────────────────────────────────┐
│                   渲染程序 (Renderer Process)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   主控制面板     │  │   AI聊天視窗     │  │   比較視窗       ││
│  │                │  │                │  │                ││
│  │ • 視窗管理      │  │ • WebView整合   │  │ • 多AI並排      ││
│  │ • AI狀態顯示    │  │ • 會話管理      │  │ • 結果比較      ││
│  │ • 提示詞倉庫    │  │ • 離線記錄      │  │ • 同步發送      ││
│  │ • 系統設定      │  │ • 額度追蹤      │  │                ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 技術棧架構

```
┌─────────────────────────────────────────────────────────────┐
│                        前端層                                │
├─────────────────────────────────────────────────────────────┤
│  Vue 3 (Composition API) + Vuetify 3 + Liquid Glass CSS    │
│  • 響應式狀態管理 (Pinia)                                   │
│  • 路由管理 (Vue Router)                                    │
│  • 組件化設計                                               │
│  • Liquid Glass 視覺效果                                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       應用層                                 │
├─────────────────────────────────────────────────────────────┤
│  Electron 框架                                              │
│  • 主程序 (Node.js 環境)                                    │
│  • 渲染程序 (Chromium 環境)                                 │
│  • IPC 通訊機制                                             │
│  • 原生 API 整合                                            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       資料層                                 │
├─────────────────────────────────────────────────────────────┤
│  • SQLite 本地資料庫                                        │
│  • 檔案系統存取                                             │
│  • 系統剪貼簿 API                                           │
│  • 系統通知 API                                             │
└─────────────────────────────────────────────────────────────┘
```

## 組件和介面

### 主要組件結構

#### 1. 主控制面板 (MainDashboard)
```
MainDashboard
├── AppHeader (應用標題列)
├── AIStatusGrid (AI狀態網格)
│   └── AIStatusCard × 6 (各AI狀態卡片)
├── QuickActions (快速操作區)
│   ├── NewChatButton (新聊天按鈕)
│   ├── CompareButton (比較模式按鈕)
│   └── PromptLibraryButton (提示詞倉庫按鈕)
├── RecentChats (最近聊天記錄)
└── SettingsPanel (設定面板)
```

#### 2. AI聊天視窗 (ChatWindow)
```
ChatWindow
├── WindowHeader (視窗標題列)
│   ├── AILogo (AI標誌)
│   ├── WindowControls (視窗控制)
│   └── StatusIndicator (狀態指示器)
├── WebViewContainer (WebView容器)
│   └── AIWebView (AI網頁聊天介面)
├── ChatHistory (聊天記錄側邊欄)
└── PromptInput (提示詞輸入區)
```

#### 3. 比較視窗 (CompareWindow)
```
CompareWindow
├── CompareHeader (比較視窗標題)
├── PromptInputArea (統一提示詞輸入)
├── AIGridContainer (AI網格容器)
│   └── AIComparePanel × N (各AI比較面板)
│       ├── AIHeader (AI標題)
│       ├── AIWebView (AI WebView)
│       └── StatusBar (狀態列)
└── CompareControls (比較控制)
```

### 核心介面定義

#### AI服務介面
```typescript
interface AIService {
  id: string;
  name: string;
  displayName: string;
  webUrl: string;
  icon: string;
  hotkey: string;
  isAvailable: boolean;
  quotaResetTime?: Date;
  lastUsed?: Date;
}
```

#### 聊天會話介面
```typescript
interface ChatSession {
  id: string;
  aiServiceId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  metadata?: Record<string, any>;
}
```

#### 提示詞介面
```typescript
interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  usageCount: number;
  isFavorite: boolean;
}
```

## 資料模型

### 資料庫架構 (SQLite)

#### 表格設計

**ai_services 表**
```sql
CREATE TABLE ai_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  web_url TEXT NOT NULL,
  icon_path TEXT,
  hotkey TEXT,
  is_available BOOLEAN DEFAULT 1,
  quota_reset_time DATETIME,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**chat_sessions 表**
```sql
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  ai_service_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
);
```

**chat_messages 表**
```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_user BOOLEAN NOT NULL,
  metadata TEXT, -- JSON格式
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);
```

**prompts 表**
```sql
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT, -- JSON陣列格式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT 0
);
```

**app_settings 表**
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 狀態管理 (Pinia Store)

#### 主要 Store 結構

**AIStore**
```typescript
export const useAIStore = defineStore('ai', {
  state: () => ({
    services: [] as AIService[],
    activeWindows: new Map<string, BrowserWindow>(),
    quotaStatus: new Map<string, QuotaInfo>()
  }),
  
  actions: {
    async loadAIServices(),
    async createChatWindow(serviceId: string),
    async updateQuotaStatus(serviceId: string, resetTime: Date),
    async checkAvailability()
  }
});
```

**ChatStore**
```typescript
export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [] as ChatSession[],
    currentSession: null as ChatSession | null,
    messages: [] as ChatMessage[]
  }),
  
  actions: {
    async createSession(aiServiceId: string),
    async saveMessage(message: ChatMessage),
    async loadSessionHistory(sessionId: string),
    async searchMessages(query: string)
  }
});
```

**PromptStore**
```typescript
export const usePromptStore = defineStore('prompt', {
  state: () => ({
    prompts: [] as Prompt[],
    categories: [] as string[],
    recentPrompts: [] as Prompt[]
  }),
  
  actions: {
    async savePrompt(prompt: Prompt),
    async loadPrompts(),
    async searchPrompts(query: string),
    async toggleFavorite(promptId: string)
  }
});
```

## 錯誤處理

### 錯誤分類與處理策略

#### 1. 網路連接錯誤
- **檢測機制**: WebView載入失敗事件監聽
- **處理策略**: 顯示離線模式，提供重試選項
- **用戶體驗**: 優雅降級到離線瀏覽模式

#### 2. AI服務不可用
- **檢測機制**: HTTP狀態碼監控，額度限制檢測
- **處理策略**: 自動標記服務狀態，設定重置提醒
- **用戶體驗**: 清晰的狀態指示和替代建議

#### 3. 資料庫錯誤
- **檢測機制**: SQLite操作異常捕獲
- **處理策略**: 自動備份，資料恢復機制
- **用戶體驗**: 透明的資料同步狀態

#### 4. 系統資源錯誤
- **檢測機制**: 記憶體使用監控，視窗數量限制
- **處理策略**: 自動清理，資源優化
- **用戶體驗**: 效能警告和建議

### 錯誤處理架構

```typescript
class ErrorHandler {
  static handleWebViewError(error: WebViewError) {
    // WebView載入錯誤處理
  }
  
  static handleDatabaseError(error: DatabaseError) {
    // 資料庫錯誤處理
  }
  
  static handleSystemError(error: SystemError) {
    // 系統級錯誤處理
  }
  
  static showUserFriendlyError(error: AppError) {
    // 用戶友好的錯誤顯示
  }
}
```

## 測試策略

### 測試層級

#### 1. 單元測試 (Unit Tests)
- **範圍**: Store actions, 工具函數, 資料模型
- **工具**: Vitest, Vue Test Utils
- **覆蓋率目標**: 80%+

#### 2. 整合測試 (Integration Tests)
- **範圍**: IPC通訊, 資料庫操作, WebView整合
- **工具**: Electron Testing, Playwright
- **重點**: 主程序與渲染程序間的資料流

#### 3. 端到端測試 (E2E Tests)
- **範圍**: 完整用戶流程, 多視窗互動
- **工具**: Playwright for Electron
- **場景**: 
  - 開啟多個AI聊天視窗
  - 提示詞管理流程
  - 剪貼簿整合功能
  - 熱鍵操作

#### 4. 視覺回歸測試
- **範圍**: Liquid Glass效果, 響應式佈局
- **工具**: Percy, Chromatic
- **重點**: 確保視覺效果一致性

### 測試資料管理

```typescript
// 測試資料工廠
class TestDataFactory {
  static createAIService(overrides?: Partial<AIService>): AIService
  static createChatSession(overrides?: Partial<ChatSession>): ChatSession
  static createPrompt(overrides?: Partial<Prompt>): Prompt
}

// 測試資料庫
class TestDatabase {
  static async setup(): Promise<void>
  static async teardown(): Promise<void>
  static async seed(data: TestData): Promise<void>
}
```

### 效能測試

#### 記憶體使用測試
- 多視窗開啟時的記憶體消耗
- WebView資源管理
- 長時間運行的記憶體洩漏檢測

#### 渲染效能測試
- Liquid Glass效果的FPS測試
- 大量聊天記錄的捲動效能
- 視窗切換的響應時間

## Liquid Glass 視覺效果實作

### CSS 架構

#### 核心 Liquid Glass 樣式
```scss
// 液態玻璃基礎效果
.liquid-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  // 動態反射效果
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 70%
    );
    transform: rotate(-45deg);
    transition: transform 0.6s ease;
    pointer-events: none;
  }
  
  &:hover::before {
    transform: rotate(-45deg) translate(50%, 50%);
  }
}

// 互動式液態玻璃效果
.liquid-glass-interactive {
  @extend .liquid-glass;
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.2);
  }
}
```

#### 動態光影效果
```typescript
// 滑鼠追蹤光影效果
class LiquidGlassEffect {
  private element: HTMLElement;
  private rect: DOMRect;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.setupMouseTracking();
  }
  
  private setupMouseTracking() {
    this.element.addEventListener('mousemove', (e) => {
      this.rect = this.element.getBoundingClientRect();
      const x = ((e.clientX - this.rect.left) / this.rect.width) * 100;
      const y = ((e.clientY - this.rect.top) / this.rect.height) * 100;
      
      this.element.style.setProperty('--mouse-x', `${x}%`);
      this.element.style.setProperty('--mouse-y', `${y}%`);
      
      // 動態光影漸層
      const gradient = `radial-gradient(
        circle at ${x}% ${y}%,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.1) 30%,
        transparent 60%
      )`;
      
      this.element.style.setProperty('--dynamic-light', gradient);
    });
  }
}
```

### Vuetify 整合

#### 自訂 Vuetify 主題
```typescript
// vuetify.config.ts
import { createVuetify } from 'vuetify';

export default createVuetify({
  theme: {
    defaultTheme: 'liquidGlass',
    themes: {
      liquidGlass: {
        dark: false,
        colors: {
          primary: 'rgba(99, 102, 241, 0.8)',
          secondary: 'rgba(139, 92, 246, 0.8)',
          accent: 'rgba(59, 130, 246, 0.8)',
          surface: 'rgba(255, 255, 255, 0.1)',
          background: 'rgba(248, 250, 252, 0.8)',
        },
        variables: {
          'glass-blur': '20px',
          'glass-opacity': '0.1',
          'glass-border': 'rgba(255, 255, 255, 0.2)',
        }
      },
      liquidGlassDark: {
        dark: true,
        colors: {
          primary: 'rgba(99, 102, 241, 0.9)',
          secondary: 'rgba(139, 92, 246, 0.9)',
          accent: 'rgba(59, 130, 246, 0.9)',
          surface: 'rgba(0, 0, 0, 0.2)',
          background: 'rgba(15, 23, 42, 0.8)',
        }
      }
    }
  }
});
```

這個設計文件涵蓋了應用程式的完整架構，從技術選型到視覺效果實作，確保能夠滿足所有需求並提供優秀的用戶體驗。