## Task 6: 實作系統托盤和熱鍵功能 ✅ 已完成

**完成日期**: 2025-11-08

### 功能概述

成功實作了完整的系統托盤整合和全域熱鍵管理系統，包含托盤選單、全域快捷鍵註冊、熱鍵自訂設定、熱鍵衝突檢測機制，以及與資料庫的持久化整合。

### 主要技術實作重點

#### 1. TrayManager 系統托盤管理器

- ✅ `src/main/system-integration/tray-manager.ts` - 托盤管理類別（250+ 行）
  - 系統托盤圖示建立和管理
  - 動態托盤選單（AI 服務列表）
  - 托盤點擊事件處理
  - 主視窗顯示/隱藏切換
  - AI 服務快速啟動
  - 設定面板快速開啟
  - 關於對話框顯示
  - 跨平台圖示支援（macOS/Windows/Linux）
  - 圖示缺失時的優雅降級

**核心功能**:
- 單擊托盤圖示：切換主視窗顯示/隱藏
- 右鍵選單：顯示完整的操作選單
- AI 服務子選單：快速開啟各 AI 聊天視窗
- 設定入口：直接導航到設定頁面
- 退出功能：完整的應用程式退出

**托盤選單結構**:
```
- 顯示主面板
- ─────────────
- AI 服務
  - 開啟 ChatGPT
  - 開啟 Claude
  - 開啟 Gemini
  - 開啟 Perplexity
  - 開啟 Grok
  - 開啟 Copilot
- ─────────────
- 設定
- ─────────────
- 關於
- 退出
```

#### 2. HotkeyManager 全域熱鍵管理器

- ✅ `src/main/system-integration/hotkey-manager.ts` - 熱鍵管理類別（350+ 行）
  - 全域熱鍵註冊和管理
  - 預設熱鍵配置系統
  - 熱鍵啟用/停用控制
  - 熱鍵衝突檢測
  - 熱鍵組合驗證
  - 動態熱鍵更新
  - 批次熱鍵操作
  - 剪貼簿內容整合

**預設熱鍵配置**:
- `CommandOrControl+Shift+Space` - 顯示主控制面板
- `CommandOrControl+Shift+1` - 開啟 ChatGPT
- `CommandOrControl+Shift+2` - 開啟 Claude
- `CommandOrControl+Shift+3` - 開啟 Gemini
- `CommandOrControl+Shift+4` - 開啟 Perplexity
- `CommandOrControl+Shift+5` - 開啟 Grok
- `CommandOrControl+Shift+6` - 開啟 Copilot

**核心方法**:
```typescript
- initialize(customHotkeys?) - 初始化並註冊所有熱鍵
- registerHotkey(config) - 註冊單一熱鍵
- unregisterHotkey(id) - 取消註冊熱鍵
- updateHotkey(id, newAccelerator) - 更新熱鍵組合
- toggleHotkey(id, enabled) - 啟用/停用熱鍵
- checkConflict(accelerator) - 檢查熱鍵衝突
- validateAccelerator(accelerator) - 驗證熱鍵格式
- getAllHotkeys() - 取得所有已註冊的熱鍵
```

**智能功能**:
- 熱鍵觸發時自動檢查剪貼簿內容
- 剪貼簿內容自動填入聊天視窗
- 視窗狀態智能恢復（最小化/隱藏）
- 跨平台快捷鍵支援（CommandOrControl）

#### 3. 資料庫擴展（熱鍵持久化）

**新增類型定義** (`src/shared/types/database.ts`)
```typescript
export interface HotkeySettings {
  id: string;                    // 熱鍵ID
  name: string;                  // 顯示名稱
  accelerator: string;           // 熱鍵組合
  description: string;           // 描述
  category: 'system' | 'ai-service' | 'custom';
  enabled: boolean;              // 是否啟用
  aiServiceId?: string;          // 關聯的AI服務ID
  createdAt: Date;
  updatedAt: Date;
}
```

**資料庫表格** (`src/main/database/schema.ts`)
- 新增 `hotkey_settings` 表格
- 索引：category, enabled, ai_service_id
- 外鍵約束：關聯 ai_services 表

#### 4. HotkeySettingsRepository 資料存取層

- ✅ `src/main/database/repositories/hotkey-settings-repository.ts` - 完整實作（230+ 行）

**核心方法**:
- `upsert(hotkeySettings)` - 建立或更新
- `findByCategory(category)` - 根據分類查詢
- `findEnabled()` - 查詢所有啟用的熱鍵
- `findByAIServiceId(id)` - 根據 AI 服務查詢
- `findByAccelerator(accelerator)` - 根據熱鍵組合查詢
- `toggleEnabled(id)` - 切換啟用狀態
- `updateAccelerator(id, accelerator)` - 更新熱鍵組合
- `isAcceleratorUsed(accelerator, excludeId?)` - 檢查衝突
- `getAllAccelerators()` - 取得所有熱鍵組合（Map）
- `batchUpdate(settings)` - 批次更新
- `resetToDefaults(defaultSettings)` - 重置為預設
- `getCategoryStats()` - 取得分類統計

#### 5. 預設資料初始化

- ✅ 更新 `src/main/database/init-data.ts`
  - 初始化 7 個預設熱鍵設定
  - 1 個系統熱鍵（主面板）
  - 6 個 AI 服務熱鍵
  - 自動檢查避免重複初始化

#### 6. 主程序整合

- ✅ 更新 `src/main/index.ts` - Application 類別
  - 整合 TrayManager
  - 整合 HotkeyManager
  - 從資料庫載入自訂熱鍵設定
  - 應用啟動時自動註冊熱鍵
  - 應用退出時清理資源
  - `will-quit` 事件處理

**生命週期管理**:
```typescript
onReady() {
  - 建立系統托盤
  - 初始化全域熱鍵
  - 載入自訂熱鍵設定
}

onBeforeQuit() {
  - 清理視窗狀態
  - 關閉資料庫連接
}

onWillQuit() {
  - 清理全域熱鍵
  - 銷毀系統托盤
}
```

#### 7. IPC 通訊機制擴展

- ✅ 更新 `src/main/ipc-handlers.ts` - 新增熱鍵和通知處理器（120+ 行新增）

**熱鍵設定 IPC Handlers**:
- `hotkey:get-all` - 取得所有熱鍵設定
- `hotkey:get-enabled` - 取得啟用的熱鍵
- `hotkey:get-by-category` - 根據分類查詢
- `hotkey:get-by-id` - 根據 ID 查詢
- `hotkey:update` - 更新熱鍵設定
- `hotkey:update-accelerator` - 更新熱鍵組合
- `hotkey:toggle-enabled` - 切換啟用狀態
- `hotkey:check-conflict` - 檢查衝突
- `hotkey:batch-update` - 批次更新
- `hotkey:reset-defaults` - 重置為預設

**系統通知 IPC Handlers**:
- `notification:show` - 顯示桌面通知

#### 8. Preload 腳本更新

- ✅ 更新 `src/main/preload.ts` - 暴露熱鍵和通知 API（30+ 行新增）

**新增 API 方法**:
```typescript
// 熱鍵設定管理
getAllHotkeys()
getEnabledHotkeys()
getHotkeysByCategory(category)
getHotkeyById(id)
updateHotkey(id, data)
updateHotkeyAccelerator(id, accelerator)
toggleHotkeyEnabled(id)
checkHotkeyConflict(accelerator, excludeId?)
batchUpdateHotkeys(settings)
resetHotkeysToDefaults()

// 系統通知
showNotification(options)

// IPC 事件監聽
onNavigateTo(callback)
onShowAbout(callback)
onClipboardContent(callback)
```

### 技術亮點

#### 1. 跨平台支援
- macOS: Template 圖示、Dock 整合
- Windows: ICO 圖示、氣泡通知
- Linux: PNG 圖示、系統托盤

#### 2. 熱鍵衝突檢測
智能檢測熱鍵衝突，防止重複註冊：
```typescript
checkConflict(accelerator: string): HotkeyConfig | null {
  for (const [id, config] of this.registeredHotkeys) {
    if (config.accelerator === accelerator) {
      return config;
    }
  }
  return null;
}
```

#### 3. 動態托盤選單
根據 AI 服務可用性動態生成選單：
```typescript
const availableServices = aiServices.filter((s) => s.isAvailable);
const aiServiceMenuItems = availableServices.map((service) => ({
  label: `開啟 ${service.displayName}`,
  click: () => this.openChatWindow(service.id),
}));
```

#### 4. 剪貼簿智能整合
熱鍵觸發時自動檢查剪貼簿並填入內容：
```typescript
private checkClipboardAndFill(targetWindow?: Electron.BrowserWindow): void {
  const clipboardText = clipboard.readText();
  if (clipboardText && clipboardText.trim().length > 0) {
    targetWindow?.webContents.send('clipboard-content', clipboardText);
  }
}
```

#### 5. 優雅的資源清理
確保應用程式退出時正確清理所有資源：
```typescript
cleanup(): void {
  globalShortcut.unregisterAll();
  this.registeredHotkeys.clear();
}
```

### 程式碼統計

- **新增檔案數**: 3
- **修改檔案數**: 7
- **新增程式碼**: ~1,200+ 行
- **Repository 方法**: 15 個
- **IPC Handlers**: 11 個
- **預設熱鍵**: 7 個

### 檔案分佈

```
src/
├── main/
│   ├── system-integration/
│   │   ├── tray-manager.ts         # ✅ 新增（250+ 行）
│   │   ├── hotkey-manager.ts       # ✅ 新增（350+ 行）
│   │   └── index.ts                # ✅ 新增（統一導出）
│   ├── database/
│   │   ├── schema.ts               # ✅ 更新（新增 hotkey_settings 表）
│   │   ├── init-data.ts            # ✅ 更新（初始化預設熱鍵）
│   │   └── repositories/
│   │       ├── hotkey-settings-repository.ts  # ✅ 新增（230+ 行）
│   │       └── index.ts            # ✅ 更新（導出）
│   ├── index.ts                    # ✅ 更新（整合 Tray 和 Hotkey）
│   ├── ipc-handlers.ts             # ✅ 更新（+120 行）
│   └── preload.ts                  # ✅ 更新（+30 行）
├── shared/
│   └── types/
│       └── database.ts             # ✅ 更新（新增 HotkeySettings）
└── resources/
    └── icons/                      # ✅ 建立目錄（圖示資源）
```

### 遇到的挑戰和解決方案

#### 挑戰 1: 全域熱鍵衝突
**問題**: 熱鍵可能與系統或其他應用程式衝突

**解決方案**:
- 實作衝突檢測機制
- 提供自訂熱鍵功能
- 使用 CommandOrControl 跨平台修飾鍵
- 註冊失敗時給予明確錯誤訊息

#### 挑戰 2: 托盤圖示缺失
**問題**: 專案初期沒有準備好托盤圖示檔案

**解決方案**:
- 檢查圖示檔案是否存在
- 提供預設圖示降級方案
- 使用 `nativeImage.createEmpty()` 建立佔位符
- 跨平台圖示格式支援（PNG/ICO/Template）

#### 挑戰 3: macOS 視窗關閉行為
**問題**: macOS 關閉所有視窗時應用程式應繼續運行

**解決方案**:
```typescript
private onWindowAllClosed() {
  // macOS 保持應用程式運行（托盤圖示仍可用）
  if (process.platform !== 'darwin') {
    app.quit();
  }
}
```

#### 挑戰 4: 熱鍵設定持久化
**問題**: 需要在應用程式重啟後保留自訂熱鍵

**解決方案**:
- 建立完整的資料庫表格和 Repository
- 應用啟動時從資料庫載入設定
- 提供批次更新功能
- 支援重置為預設設定

### 功能特性

#### 系統托盤特性
- 🎯 單擊切換主視窗
- 📋 動態 AI 服務選單
- ⚙️ 快速存取設定
- 🚪 優雅的退出機制
- 💻 跨平台圖示支援
- 🔄 選單即時更新

#### 全域熱鍵特性
- ⌨️ 預設熱鍵配置
- 🎛️ 自訂熱鍵組合
- 🔍 衝突檢測機制
- 🔄 動態啟用/停用
- 📋 剪貼簿整合
- 💾 設定持久化
- 🔧 批次更新支援

#### 使用者體驗
- ⚡ 快速啟動 AI 服務
- 🎯 鍵盤優先操作
- 📱 托盤最小化支援
- 🔔 桌面通知整合
- 💡 智能剪貼簿填入

### 下一階段準備

**Task 7**: 實作剪貼簿智能整合
- 剪貼簿監控系統
- 智能內容填入功能
- 剪貼簿功能設定

現有的熱鍵系統已經為剪貼簿整合提供了基礎功能（熱鍵觸發時檢查剪貼簿）。

### 備註

Task 6 成功建立了完整的系統托盤和全域熱鍵管理系統。所有功能都已整合到主程序，並透過 IPC 通訊機制暴露給渲染程序。系統支援自訂熱鍵設定、衝突檢測、持久化儲存，並提供了優雅的資源管理和清理機制。托盤圖示提供了快速存取各項功能的入口，熱鍵系統讓使用者能夠透過鍵盤快速操作應用程式。

