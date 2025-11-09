# Task 12: 系統設定介面優化

**完成日期**: 2025-11-09

**狀態**: ✅ 已完成

---

## 📋 任務目標

完善系統設定介面，包括實作熱鍵自訂設定、優化外觀設定功能、增加設定備份與還原功能，提供使用者完整的應用程式配置能力。

---

## ✨ 核心成果

### 1. 熱鍵輸入組件（HotkeyInput.vue）

**檔案**: `src/renderer/components/settings/HotkeyInput.vue` (300+ 行)

**核心功能**:
- ✅ **即時熱鍵捕獲**: 點擊輸入框後按下鍵盤組合鍵自動捕獲
- ✅ **智能按鍵識別**: 支援修飾鍵（Ctrl/Alt/Shift/Command）和功能鍵
- ✅ **格式化顯示**: 將 Electron 的 accelerator 格式轉為使用者友善顯示
- ✅ **衝突檢測**: 即時檢查熱鍵是否與現有設定衝突
- ✅ **跨平台支援**: 自動適配 macOS 和 Windows/Linux 的修飾鍵命名

**技術亮點**:
```typescript
// 標準化按鍵名稱，支援跨平台
function normalizeKey(event: KeyboardEvent): string {
  if (event.metaKey || event.key === 'Meta') {
    return process.platform === 'darwin' ? 'Command' : 'Super';
  }
  if (event.ctrlKey || event.key === 'Control') {
    return 'CommandOrControl';
  }
  // ... 其他修飾鍵和特殊鍵處理
}

// 格式化顯示（Windows: Ctrl+Shift+A, macOS: ⌘+Shift+A）
function formatAccelerator(accelerator: string): string {
  return accelerator.split('+').map((key) => {
    const keyMap: Record<string, string> = {
      CommandOrControl: process.platform === 'darwin' ? '⌘' : 'Ctrl',
      // ...
    };
    return keyMap[key] || key.toUpperCase();
  }).join(' + ');
}
```

**使用者體驗**:
- 點擊輸入框進入錄製模式
- 顯示「按下您想要設定的熱鍵組合...」提示
- 即時顯示衝突警告
- 支援 ESC 取消錄製
- 支援清除熱鍵按鈕

### 2. 熱鍵編輯器（HotkeyEditor.vue）

**檔案**: `src/renderer/components/settings/HotkeyEditor.vue` (350+ 行)

**主要功能**:
- ✅ **分類管理**: 系統熱鍵和 AI 服務熱鍵分別顯示
- ✅ **批次編輯**: 支援同時修改多個熱鍵後一次儲存
- ✅ **啟用/停用**: 每個熱鍵可獨立啟用或停用
- ✅ **重置功能**: 一鍵重置所有熱鍵為預設值
- ✅ **變更追蹤**: 追蹤哪些熱鍵已修改，只更新變更的項目

**介面設計**:
```
┌─────────────────────────────────────┐
│ 熱鍵設定                             │
│ [重新載入] [重置為預設] [儲存變更]   │
├─────────────────────────────────────┤
│ 🖥️ 系統熱鍵                          │
│                                     │
│ ☑️ 顯示/隱藏主視窗                   │
│   [Ctrl + Shift + Space]            │
│                                     │
│ ☑️ 開啟比較視窗                     │
│   [Ctrl + Shift + C]                │
├─────────────────────────────────────┤
│ 🤖 AI 服務熱鍵                       │
│                                     │
│ ☑️ 開啟 ChatGPT                     │
│   [Ctrl + Shift + 1]                │
│                                     │
│ ☑️ 開啟 Claude                      │
│   [Ctrl + Shift + 2]                │
└─────────────────────────────────────┘
```

**資料流程**:
1. 從資料庫載入所有熱鍵設定
2. 使用者修改熱鍵時標記為已變更
3. 點擊儲存時批次更新已變更的熱鍵
4. 更新成功後清除變更標記

### 3. 外觀設定增強

**新增功能**:

#### 3.1 預設方案系統

提供 5 種預設的 Liquid Glass 效果方案：

| 方案名稱 | 效果強度 | 透明度 | 模糊程度 | 適用場景 |
|---------|---------|--------|---------|---------|
| 標準 | 70% | 10% | 80% | 平衡的視覺效果 |
| 柔和 | 50% | 5% | 60% | 較低的透明度和效果 |
| 強烈 | 90% | 15% | 95% | 高強度視覺效果 |
| 極簡 | 30% | 3% | 40% | 最小化效果 |
| 關閉 | 0% | 0% | 0% | 停用所有效果 |

**實作細節**:
```typescript
// 預設方案定義
const liquidGlassPresets = [
  {
    name: '標準',
    description: '平衡的視覺效果',
    settings: {
      enabled: true,
      intensity: 70,
      opacity: 10,
      blurAmount: 80,
      enableMouseTracking: true,
      enableRipple: true,
      enableScrollEffect: true,
    },
  },
  // ... 其他方案
];

// 檢查當前方案
const isPresetActive = (preset) => {
  const current = settings.value.liquidGlass;
  return current.intensity === preset.settings.intensity &&
         current.opacity === preset.settings.opacity &&
         // ... 其他屬性比對
};
```

#### 3.2 設定項目優化

- **視覺分組**: 將設定分為「基本設定」和「進階效果」
- **停用狀態**: 關閉 Liquid Glass 時自動停用所有子選項
- **說明文字**: 為每個進階效果添加說明
  - 滑鼠追蹤光影: 「滑鼠移動時產生動態光影效果」
  - 波紋效果: 「點擊時產生水波紋動畫」
  - 捲動光影: 「捲動時產生流動光影效果」

### 4. 進階設定頁面

**新增設定分頁**: 進階設定

#### 4.1 設定備份與還原

**匯出設定**:
- 一鍵將所有設定匯出為 JSON 檔案
- 檔案命名格式: `just-chat-it-settings-YYYY-MM-DD.json`
- 包含所有設定項目（主題、Liquid Glass、熱鍵、剪貼簿等）

**匯入設定**:
- 支援從 JSON 檔案還原設定
- 自動驗證檔案格式
- 合併預設值以確保新增的設定項目有預設值
- 匯入後立即生效並儲存到資料庫

**技術實作**:
```typescript
// 匯出設定
const exportSettings = () => {
  const settingsJson = settingsStore.exportSettings();
  const blob = new Blob([settingsJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `just-chat-it-settings-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// 匯入設定
const importSettings = async (event: Event) => {
  const file = target.files?.[0];
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target?.result as string;
    await settingsStore.importSettings(content);
  };
  reader.readAsText(file);
};
```

#### 4.2 重置設定功能

- 一鍵將所有設定還原為預設值
- 顯示確認對話框避免誤操作
- 警告訊息建議先備份目前設定
- 重置後立即生效

### 5. 設定頁面架構優化

**設定分頁結構**:

```
設定面板
├── 📱 一般設定
│   ├── 主題選擇
│   ├── 語言設定
│   ├── 系統托盤選項
│   ├── 視窗永遠置頂
│   └── 最小化到托盤
├── 🎨 外觀設定
│   ├── 預設方案（5 個卡片）
│   ├── 自訂設定
│   │   ├── Liquid Glass 開關
│   │   ├── 效果強度滑桿
│   │   ├── 透明度滑桿
│   │   └── 模糊程度滑桿
│   └── 進階效果
│       ├── 滑鼠追蹤光影
│       ├── 波紋效果
│       └── 捲動光影
├── 📋 剪貼簿設定
│   ├── 啟用剪貼簿檢查
│   ├── 自動聚焦輸入框
│   └── 剪貼簿狀態監控
├── ⌨️ 熱鍵設定
│   ├── 系統熱鍵
│   │   ├── 顯示/隱藏主視窗
│   │   └── 開啟比較視窗
│   └── AI 服務熱鍵
│       ├── ChatGPT
│       ├── Claude
│       ├── Gemini
│       ├── Perplexity
│       ├── Grok
│       └── Copilot
├── ⚙️ 進階設定
│   ├── 設定備份與還原
│   │   ├── 匯出設定
│   │   └── 匯入設定
│   └── 重置設定
└── ℹ️ 關於
    └── 應用程式資訊
```

**UI/UX 改進**:
- ✅ 左側導航選單，右側設定內容
- ✅ 使用 Vuetify 圖示增強視覺辨識
- ✅ Liquid Glass 卡片樣式統一設計
- ✅ 響應式佈局支援（桌面版 3 欄，行動版單欄）
- ✅ 即時儲存，設定變更立即生效
- ✅ 狀態指示（已變更、已儲存、錯誤）

---

## 📊 程式碼統計

### 新增檔案

| 檔案 | 行數 | 說明 |
|------|------|------|
| `HotkeyInput.vue` | ~300 | 熱鍵輸入組件 |
| `HotkeyEditor.vue` | ~350 | 熱鍵編輯器組件 |

**總計**: 2 個新檔案，~650 行代碼

### 修改檔案

| 檔案 | 變更 | 說明 |
|------|------|------|
| `SettingsPanel.vue` | +350 行 | 新增進階設定、預設方案、匯入/匯出功能 |

**總計**: 1 個修改檔案，+350 行代碼

### 整體統計

- **總代碼行數**: ~1,000 行
- **Vue 組件**: 3 個（1 新增，2 修改）
- **新增功能**: 熱鍵編輯、預設方案、設定備份
- **IPC Handlers**: 已存在（Task 6 實作）
- **資料庫表**: 已存在（hotkey_settings）

---

## 🎯 功能特點

### 1. 熱鍵管理系統

**完整功能**:
- ✅ 視覺化熱鍵編輯介面
- ✅ 即時衝突檢測
- ✅ 分類管理（系統/AI 服務）
- ✅ 批次儲存機制
- ✅ 重置為預設值
- ✅ 啟用/停用控制

**支援的熱鍵**:
- 系統熱鍵: 主視窗、比較視窗等
- AI 服務熱鍵: 6 個 AI 服務快速啟動

### 2. 外觀自訂系統

**預設方案**:
- 5 種預設效果方案
- 一鍵切換
- 視覺化方案選擇
- 當前方案高亮顯示

**自訂調整**:
- 效果強度: 0-100%
- 透明度: 0-100%
- 模糊程度: 0-100%
- 進階效果開關（3 個）

### 3. 設定管理系統

**備份功能**:
- JSON 格式匯出
- 完整設定保存
- 自動檔案命名

**還原功能**:
- JSON 檔案匯入
- 格式驗證
- 錯誤處理

**重置功能**:
- 一鍵重置
- 確認對話框
- 安全警告

---

## 🛠️ 技術實作

### 1. 熱鍵捕獲機制

**按鍵事件處理**:
```typescript
function handleKeyDown(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();

  // ESC 取消錄製
  if (event.key === 'Escape') {
    stopRecording();
    return;
  }

  // 添加按下的鍵
  const key = normalizeKey(event);
  if (key) pressedKeys.value.add(key);

  // 檢查是否完整（修飾鍵 + 普通鍵）
  const hasModifier = Array.from(pressedKeys.value).some(k =>
    ['CommandOrControl', 'Control', 'Alt', 'Shift'].includes(k)
  );
  const hasNormalKey = Array.from(pressedKeys.value).some(k =>
    !['CommandOrControl', 'Control', 'Alt', 'Shift'].includes(k)
  );

  if (hasModifier && hasNormalKey) {
    const accelerator = buildAccelerator();
    validateAndEmit(accelerator);
    stopRecording();
  }
}
```

**Accelerator 建構**:
```typescript
function buildAccelerator(): string {
  const keys = Array.from(pressedKeys.value);

  // 修飾鍵排序
  const modifierOrder = ['CommandOrControl', 'Control', 'Alt', 'Shift'];
  const modifiers = keys.filter(k => modifierOrder.includes(k))
    .sort((a, b) => modifierOrder.indexOf(a) - modifierOrder.indexOf(b));

  const normalKeys = keys.filter(k => !modifierOrder.includes(k));

  return [...modifiers, ...normalKeys].join('+');
}
```

### 2. 預設方案系統

**方案比對**:
```typescript
const isPresetActive = (preset) => {
  const current = settings.value.liquidGlass;
  const presetSettings = preset.settings;

  return (
    current.enabled === presetSettings.enabled &&
    current.intensity === presetSettings.intensity &&
    current.opacity === presetSettings.opacity &&
    current.blurAmount === presetSettings.blurAmount &&
    current.enableMouseTracking === presetSettings.enableMouseTracking &&
    current.enableRipple === presetSettings.enableRipple &&
    current.enableScrollEffect === presetSettings.enableScrollEffect
  );
};
```

**方案應用**:
```typescript
const applyPreset = async (preset) => {
  await settingsStore.updateLiquidGlassSettings(preset.settings);
};
```

### 3. 設定匯入/匯出

**匯出機制**:
- 使用 Blob API 建立檔案
- createObjectURL 生成下載連結
- 自動觸發下載
- 清理 URL 資源

**匯入機制**:
- FileReader API 讀取檔案
- JSON.parse 解析內容
- Store 的 importSettings 方法處理
- 錯誤捕獲和使用者提示

### 4. Liquid Glass 視覺整合

**預設方案卡片樣式**:
```scss
.preset-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.15);
  }
}
```

---

## 🎨 使用者體驗

### 1. 熱鍵設定流程

1. 使用者進入「熱鍵設定」分頁
2. 看到系統熱鍵和 AI 服務熱鍵分類列表
3. 點擊想修改的熱鍵輸入框
4. 按下新的鍵盤組合
5. 系統自動檢測衝突並顯示警告（如有）
6. 無衝突時熱鍵更新成功
7. 點擊「儲存變更」批次保存所有修改

### 2. 外觀自訂流程

**使用預設方案**:
1. 進入「外觀設定」
2. 查看 5 個預設方案卡片
3. 點擊想要的方案
4. 效果立即應用並儲存

**自訂調整**:
1. 在「自訂設定」區域
2. 調整滑桿設定強度、透明度、模糊
3. 開關進階效果（滑鼠追蹤、波紋、捲動）
4. 每次調整自動儲存

### 3. 設定備份流程

**匯出**:
1. 進入「進階設定」
2. 點擊「匯出設定」
3. 瀏覽器自動下載 JSON 檔案

**匯入**:
1. 進入「進階設定」
2. 點擊「匯入設定」
3. 選擇先前匯出的 JSON 檔案
4. 設定自動還原並生效

---

## 🔧 整合與相依性

### 與現有系統整合

**HotkeyManager 整合**:
- 設定變更後透過 IPC 更新主程序的熱鍵註冊
- 支援動態更新熱鍵而不需重啟應用
- 熱鍵衝突檢測依賴 HotkeySettingsRepository

**SettingsStore 整合**:
- 所有設定統一透過 SettingsStore 管理
- 自動持久化到 SQLite 資料庫
- 支援設定版本管理（新設定項目有預設值）

**Liquid Glass 整合**:
- 預設方案直接呼叫 updateLiquidGlassSettings
- CSS 變數即時更新到 DOM
- 視覺效果無需重新載入頁面

### 資料庫依賴

使用現有資料表:
- **hotkey_settings**: 儲存熱鍵設定
- **app_settings**: 儲存應用程式設定

### IPC 通訊

使用現有 IPC API (Task 6 實作):
- `hotkey:get-all`
- `hotkey:update`
- `hotkey:batch-update`
- `hotkey:check-conflict`
- `hotkey:reset-defaults`

---

## 📝 使用說明

### 如何自訂熱鍵

1. 開啟主控制面板
2. 點擊左側選單的「設定」
3. 選擇「熱鍵設定」分頁
4. 找到要修改的熱鍵
5. 點擊輸入框，按下新的鍵盤組合
6. 確認無衝突後點擊「儲存變更」

**建議熱鍵組合**:
- 系統功能: `Ctrl+Shift+字母`
- AI 服務: `Ctrl+Shift+數字`
- 避免使用系統保留組合 (如 `Ctrl+C`, `Ctrl+V`)

### 如何切換外觀方案

**快速切換** (推薦新手):
1. 進入「外觀設定」
2. 在預設方案區域點擊想要的效果
3. 效果立即生效

**進階自訂** (進階使用者):
1. 進入「外觀設定」
2. 在自訂設定區域調整各項參數
3. 即時預覽效果
4. 自動儲存

### 如何備份設定

**定期備份** (建議):
1. 進入「進階設定」
2. 點擊「匯出設定」
3. 保存 JSON 檔案到安全位置

**還原設定**:
1. 進入「進階設定」
2. 點擊「匯入設定」
3. 選擇備份的 JSON 檔案

---

## ✅ 測試檢查清單

### 功能測試

- [x] 熱鍵輸入組件能正確捕獲鍵盤組合
- [x] 熱鍵衝突檢測正常運作
- [x] 熱鍵批次儲存功能正常
- [x] 預設方案切換即時生效
- [x] 外觀自訂參數即時更新
- [x] 設定匯出生成正確 JSON 檔案
- [x] 設定匯入能正確還原
- [x] 重置設定恢復預設值
- [x] 所有設定持久化到資料庫

### UI/UX 測試

- [x] 設定分頁導航流暢
- [x] Liquid Glass 效果正確顯示
- [x] 響應式佈局適配不同螢幕
- [x] 錯誤訊息清晰易懂
- [x] 確認對話框防止誤操作
- [x] 狀態指示明確（載入/成功/錯誤）

### 整合測試

- [x] 熱鍵變更後主程序正確更新
- [x] 外觀設定變更立即反映到 UI
- [x] 設定匯入不影響其他功能
- [x] 重置設定不破壞資料完整性

---

## 🎓 學習重點

### 1. 鍵盤事件處理

**關鍵技術**:
- KeyboardEvent 的 key、code、metaKey、ctrlKey 屬性
- 事件的 preventDefault 和 stopPropagation
- 跨平台按鍵映射

**最佳實踐**:
- 使用修飾鍵 + 普通鍵的組合
- 避免單一按鍵熱鍵（易誤觸）
- 提供清晰的視覺回饋

### 2. 檔案處理

**Blob API**:
- 創建 Blob 物件
- 生成下載 URL
- 清理記憶體資源

**FileReader API**:
- 讀取使用者選擇的檔案
- 非同步讀取機制
- 錯誤處理

### 3. 狀態管理

**變更追蹤**:
- 使用 Set 追蹤修改項目
- 批次更新減少資料庫操作
- 提供明確的變更指示

**即時同步**:
- Watch 監聽設定變更
- 自動儲存機制
- CSS 變數動態更新

---

## 🚀 未來改進方向

### 功能擴展

1. **熱鍵方案系統**
   - 預設熱鍵方案（遊戲模式、工作模式等）
   - 方案匯入/匯出
   - 快速切換方案

2. **外觀主題市集**
   - 社群分享的主題方案
   - 主題預覽功能
   - 一鍵安裝主題

3. **設定同步**
   - 雲端備份設定
   - 多裝置同步
   - 設定版本控制

### UI/UX 優化

1. **視覺預覽**
   - 外觀設定即時預覽
   - 熱鍵示範動畫
   - 互動式教學

2. **智能建議**
   - 推薦常用熱鍵組合
   - 偵測使用習慣調整建議
   - 效能優化建議

3. **進階搜尋**
   - 設定項目快速搜尋
   - 智能篩選
   - 常用設定快速存取

---

## 📚 相關文件

- [Task 3: Liquid Glass 視覺系統](./task-3.md) - 外觀效果基礎
- [Task 6: 系統托盤和熱鍵功能](./task-6.md) - 熱鍵管理基礎
- [Task 7: 剪貼簿智能整合](./task-7.md) - 設定面板基礎

---

## 🎉 總結

Task 12 成功完成了系統設定介面的優化，提供了完整的熱鍵自訂、外觀配置和設定管理功能。主要成就包括：

### 核心價值

1. **使用者自主性**: 讓使用者完全掌控應用程式的外觀和行為
2. **易用性**: 視覺化的設定介面，無需編輯配置檔案
3. **安全性**: 設定備份/還原機制，防止設定遺失
4. **靈活性**: 預設方案和自訂調整兼顧不同需求

### 技術突破

1. **熱鍵捕獲系統**: 即時、直觀的熱鍵輸入體驗
2. **預設方案機制**: 快速切換預定義的視覺效果
3. **設定持久化**: 完整的備份/還原/重置功能
4. **跨平台適配**: 自動適應不同作業系統的按鍵命名

### 使用者體驗

- ✅ 直覺的熱鍵設定流程
- ✅ 即時的視覺效果預覽
- ✅ 完整的設定管理工具
- ✅ 清晰的錯誤提示和確認對話框

**Task 12 為 Just Chat It 提供了專業級的設定系統，讓使用者能夠輕鬆自訂應用程式以符合個人偏好和工作流程。**

---

**文檔版本**: v1.0
**最後更新**: 2025-11-09
**文檔作者**: Claude Code
