## Task 4: 建立多視窗管理系統 ✅ 已完成

**完成日期**: 2025-11-08

### 功能概述

成功實作了完整的多視窗管理系統，包含視窗狀態持久化、自動儲存/恢復、IPC通訊機制，以及無邊框視窗控制功能。應用程式現在能夠記住每個視窗的位置、大小和狀態，並在重啟後自動恢復。

### 主要技術實作重點

#### 1. 資料庫 Schema 擴展

**新增 WindowState 類型定義** (`src/shared/types/database.ts`)
```typescript
export interface WindowState {
  id: string;                    // 視窗ID (main, chat-chatgpt, etc.)
  windowType: 'main' | 'chat' | 'compare' | 'settings';
  aiServiceId?: string;          // 關聯的AI服務ID
  x: number;                     // X座標
  y: number;                     // Y座標
  width: number;                 // 寬度
  height: number;                // 高度
  isMaximized: boolean;          // 最大化狀態
  isMinimized: boolean;          // 最小化狀態
  isFullscreen: boolean;         // 全螢幕狀態
  sessionId?: string;            // 關聯的會話ID
  createdAt: Date;
  updatedAt: Date;
}
```

**資料庫表格** (`src/main/database/schema.ts`)
- 新增 `window_states` 表格
- 包含位置、大小、狀態標誌欄位
- 外鍵約束連接 `ai_services` 和 `chat_sessions`
- 索引優化：`window_type` 和 `ai_service_id`

#### 2. WindowStateRepository 資料存取層

**完整實作** (`src/main/database/repositories/window-state-repository.ts`, 290+ 行)

**核心方法**:
- `create(state)` - 建立視窗狀態記錄
- `update(id, updates)` - 更新視窗狀態
- `upsert(state)` - 建立或更新（智能判斷）
- `findById(id)` - 根據ID查詢
- `findByWindowType(type)` - 根據類型查詢
- `findByAIServiceId(id)` - 根據AI服務查詢

**專用方法**:
- `updatePosition(id, x, y)` - 更新位置
- `updateSize(id, width, height)` - 更新大小
- `updateBounds(id, x, y, width, height)` - 更新位置和大小
- `updateStateFlags(id, isMaximized, isMinimized, isFullscreen)` - 更新狀態標誌
- `getMainWindowState()` - 取得主視窗狀態
- `getAllChatWindowStates()` - 取得所有聊天視窗狀態
- `cleanupOldStates(type, keepCount)` - 清理舊記錄

**資料轉換邏輯**:
```typescript
// 資料庫欄位 (snake_case) ↔ TypeScript 介面 (camelCase)
protected rowToEntity(row: any): WindowState {
  return {
    id: row.id,
    windowType: row.window_type,
    aiServiceId: row.ai_service_id,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    isMaximized: Boolean(row.is_maximized),
    isMinimized: Boolean(row.is_minimized),
    isFullscreen: Boolean(row.is_fullscreen),
    sessionId: row.session_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
```

#### 3. WindowManager 擴展

**新增成員變數** (`src/main/window-manager.ts`)
```typescript
private windowStateRepo: WindowStateRepository;
private saveStateTimeouts: Map<string, NodeJS.Timeout> = new Map();
```

**視窗狀態恢復** (createMainWindow 和 createChatWindow)
```typescript
// 從資料庫恢復上次的視窗狀態
const savedState = this.windowStateRepo.getMainWindowState();

const windowOptions = {
  width: savedState?.width || defaultWidth,
  height: savedState?.height || defaultHeight,
  x: savedState?.x,
  y: savedState?.y,
  // ... 其他選項
};

// 恢復最大化狀態
if (savedState?.isMaximized) {
  window.maximize();
}
```

**自動狀態追蹤** (setupWindowStateTracking)
- 監聽視窗移動 (`move`)
- 監聽視窗大小調整 (`resize`)
- 監聽最大化/取消最大化 (`maximize`, `unmaximize`)
- 監聽最小化/恢復 (`minimize`, `restore`)
- 監聽全螢幕切換 (`enter-full-screen`, `leave-full-screen`)
- 視窗關閉前最後保存 (`close`)

**防抖機制** (500ms)
```typescript
const debouncedSave = () => {
  const existingTimeout = this.saveStateTimeouts.get(windowId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    this.saveWindowState(window, windowId, aiServiceId);
  }, 500);

  this.saveStateTimeouts.set(windowId, timeout);
};
```

**清理機制** (cleanup)
- 清除所有計時器
- 最後一次保存所有視窗狀態
- 在應用程式關閉時自動調用

#### 4. IPC 通訊機制擴展

**新增 IPC Handlers** (`src/main/ipc-handlers.ts`)

**視窗控制**:
- `window:minimize` - 最小化視窗
- `window:maximize` - 最大化/取消最大化切換
- `window:close` - 關閉視窗
- `window:toggle-fullscreen` - 全螢幕切換
- `window:is-maximized` - 查詢最大化狀態
- `window:is-fullscreen` - 查詢全螢幕狀態
- `window:get-bounds` - 取得視窗位置和大小
- `window:set-bounds` - 設定視窗位置和大小

**視窗狀態管理**:
- `window-state:get` - 取得指定視窗狀態
- `window-state:save` - 儲存視窗狀態
- `window-state:get-main` - 取得主視窗狀態
- `window-state:get-all-chat` - 取得所有聊天視窗狀態

**AI 聊天視窗**:
```typescript
ipcMain.handle('ai:create-chat-window', async (event, serviceId: string) => {
  // 檢查視窗是否已存在
  const existingWindow = windowManager.getChatWindow(serviceId);
  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus();
    return { success: true, existed: true };
  }

  // 建立新視窗並載入 AI 服務網址
  const chatWindow = windowManager.createChatWindow(serviceId);
  const service = aiServiceRepo.findById(serviceId);
  if (service) {
    await chatWindow.loadURL(service.webUrl);
    aiServiceRepo.updateLastUsed(serviceId);
  }

  return { success: true, existed: false };
});
```

#### 5. Preload 腳本更新

**新增 API 方法** (`src/main/preload.ts`)
```typescript
const electronAPI = {
  // 視窗控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  getWindowBounds: () => ipcRenderer.invoke('window:get-bounds'),
  setWindowBounds: (bounds) => ipcRenderer.invoke('window:set-bounds', bounds),

  // 視窗狀態管理
  getWindowState: (windowId) => ipcRenderer.invoke('window-state:get', windowId),
  saveWindowState: (windowId, state) => ipcRenderer.invoke('window-state:save', windowId, state),
  getMainWindowState: () => ipcRenderer.invoke('window-state:get-main'),
  getAllChatWindowStates: () => ipcRenderer.invoke('window-state:get-all-chat'),

  // AI 服務
  createChatWindow: (serviceId) => ipcRenderer.invoke('ai:create-chat-window', serviceId),

  // ... 其他 API
};
```

**型別安全**:
```typescript
export type ElectronAPI = typeof electronAPI;

// 在 renderer 程序中使用
window.electronAPI.minimizeWindow();
window.electronAPI.createChatWindow('chatgpt');
```

#### 6. 主程序整合

**更新** (`src/main/index.ts`)
```typescript
private async onReady() {
  // 初始化資料庫
  this.dbManager.initialize();

  // 傳入 windowManager 到 IPC handlers
  setupIpcHandlers(this.windowManager);

  // 建立主視窗（自動恢復狀態）
  await this.windowManager.createMainWindow();
}

private onBeforeQuit() {
  // 清理視窗狀態追蹤並保存最後狀態
  this.windowManager.cleanup();

  // 關閉資料庫連接
  this.dbManager.close();
}
```

### 技術亮點

#### 1. 防抖保存機制
使用 500ms 防抖避免頻繁寫入資料庫，提升效能同時確保狀態正確儲存。

#### 2. 智能狀態恢復
應用程式啟動時自動從資料庫讀取上次的視窗狀態，包括位置、大小和最大化狀態。

#### 3. 多視窗獨立管理
每個視窗有獨立的 ID 和狀態追蹤，支援同時開啟多個 AI 聊天視窗。

#### 4. 型別安全 IPC
使用 TypeScript 定義完整的 ElectronAPI 型別，確保渲染程序和主程序間的型別安全通訊。

#### 5. 優雅關閉
應用程式關閉時自動清理所有計時器並保存最後狀態，確保不遺失資料。

### 程式碼統計

- **新增檔案數**: 1 (window-state-repository.ts)
- **修改檔案數**: 6
- **新增程式碼**: ~500+ 行
- **IPC Handlers**: 12 個
- **Repository 方法**: 16 個

### 檔案分佈

```
src/
├── shared/
│   ├── types/
│   │   └── database.ts              # ✅ 新增 WindowState 介面
│   └── constants/
│       └── database.ts              # ✅ 新增 WINDOW_STATES 常數
├── main/
│   ├── database/
│   │   ├── schema.ts                # ✅ 新增 window_states 表格
│   │   └── repositories/
│   │       ├── window-state-repository.ts  # ✅ 新增（290+ 行）
│   │       └── index.ts             # ✅ 導出 WindowStateRepository
│   ├── window-manager.ts            # ✅ 擴展（217 行，+120 行）
│   ├── ipc-handlers.ts              # ✅ 擴展（265 行，+100 行）
│   ├── preload.ts                   # ✅ 更新（36 行，+15 行）
│   └── index.ts                     # ✅ 更新（整合 cleanup）
```

### 遇到的挑戰和解決方案

#### 挑戰 1: 頻繁的狀態保存影響效能
**問題**: 視窗移動和調整大小會觸發大量事件，頻繁寫入資料庫

**解決方案**: 實作 500ms 防抖機制
```typescript
const debouncedSave = () => {
  const existingTimeout = this.saveStateTimeouts.get(windowId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  const timeout = setTimeout(() => {
    this.saveWindowState(window, windowId, aiServiceId);
  }, 500);
  this.saveStateTimeouts.set(windowId, timeout);
};
```

#### 挑戰 2: 應用關閉時可能遺失最後狀態
**問題**: 防抖計時器可能導致關閉時未保存最後狀態

**解決方案**:
- 監聽 `close` 事件立即保存
- 實作 `cleanup()` 方法在 `before-quit` 時調用
- 清理所有計時器並強制保存所有視窗

#### 挑戰 3: WindowManager 未傳入 IPC handlers
**問題**: IPC handlers 需要訪問 windowManager 實例

**解決方案**: 修改 setupIpcHandlers 接受可選參數
```typescript
export function setupIpcHandlers(manager?: WindowManager) {
  if (manager) {
    windowManager = manager;
  }
  // ...
}

// 在主程序中
setupIpcHandlers(this.windowManager);
```

### 下一階段準備

**Task 5**: 實作 AI 服務整合
- WebView 載入 AI 服務
- 多視窗並行對話
- 聊天記錄本地儲存

現有的視窗管理系統為多 AI 服務同時運行提供了完整的基礎設施。

### 備註

Task 4 成功建立了完整的多視窗管理和狀態持久化系統。系統能夠自動記住每個視窗的位置和狀態，並在應用程式重啟後恢復。所有視窗控制功能都透過 IPC 通訊機制暴露給渲染程序，實現了主程序和渲染程序的完全分離。

