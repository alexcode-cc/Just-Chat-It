# Task 10: 額度追蹤和提醒系統

**完成日期**: 2025-11-09

**任務類型**: MVP 功能開發

**狀態**: ✅ 已完成

---

## 📋 任務概述

實作完整的 AI 服務額度追蹤和桌面提醒系統，讓使用者能夠手動標記額度狀態、設定重置時間，並在額度即將重置時收到桌面通知提醒。

## 🎯 核心功能

### 10.1 額度狀態管理

**已實作內容**:

1. **QuotaRepository 資料庫層** (`src/main/database/repositories/quota-repository.ts`)
   - 完整的 CRUD 操作（建立、讀取、更新、刪除）
   - 額度狀態追蹤（available, depleted, unknown）
   - 重置時間管理和自動更新
   - 通知設定管理（提前通知時間、是否啟用）
   - 智能查詢方法：
     - `getByAIServiceId()` - 根據服務 ID 獲取額度
     - `getDepletedQuotas()` - 獲取所有已用盡的額度
     - `getQuotasNeedingNotification()` - 獲取需要通知的額度
     - `checkAndUpdateExpiredQuotas()` - 檢查並自動更新過期額度

2. **資料模型** (`src/shared/types/database.ts`)
   ```typescript
   interface QuotaTracking {
     id: string;
     aiServiceId: string;
     quotaStatus: 'available' | 'depleted' | 'unknown';
     quotaResetTime?: Date;
     notifyBeforeMinutes: number; // 預設 60 分鐘
     notifyEnabled: boolean;
     lastNotifiedAt?: Date;
     markedDepletedAt?: Date;
     notes?: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

3. **AIStore 狀態管理** (`src/renderer/stores/ai.ts`)
   - 新增 `quotaTrackings` Map 追蹤所有服務的額度狀態
   - 8 個額度管理 actions:
     - `loadQuotaTrackings()` - 載入所有額度追蹤資訊
     - `loadQuotaTracking(serviceId)` - 載入特定服務額度
     - `markQuotaDepleted()` - 標記額度為已用盡
     - `markQuotaAvailable()` - 標記額度為可用
     - `updateQuotaResetTime()` - 更新重置時間
     - `updateQuotaNotifySettings()` - 更新通知設定
     - `triggerQuotaCheck()` - 手動觸發額度檢查
     - `checkAvailability()` - 檢查所有服務可用性
   - 4 個計算屬性（getters）:
     - `getQuotaTracking()` - 獲取特定服務額度
     - `depletedServices` - 已用盡的服務列表
     - `upcomingResets` - 24 小時內即將重置的服務

### 10.2 桌面通知系統

**已實作內容**:

1. **NotificationManager** (`src/main/system-integration/notification-manager.ts`)
   - 完整的桌面通知管理器（210 行）
   - 自動額度監控（每分鐘檢查一次）
   - 智能通知邏輯：
     - 即將重置通知：在設定的提前時間發送
     - 已重置通知：額度重置後立即通知
   - 通知點擊處理：點擊通知自動顯示主視窗
   - 時間格式化：友好的倒計時顯示

2. **通知類型**:
   - **即將重置通知**:
     - 標題：`{AI名稱} 額度即將重置`
     - 內容：`您的 {AI名稱} 額度將在 {時間} 後重置`
   - **已重置通知**:
     - 標題：`{AI名稱} 額度已重置`
     - 內容：`您的 {AI名稱} 額度現在可用了`

3. **監控機制**:
   - 週期性檢查（每 60 秒）
   - 自動偵測過期額度
   - 防止重複通知（使用 lastNotifiedAt 追蹤）
   - 啟動時立即執行首次檢查

### 10.3 前端額度管理介面

**已實作內容**:

1. **QuotaStatusCard 組件** (`src/renderer/components/quota/QuotaStatusCard.vue`)
   - 單個 AI 服務的額度狀態卡片（350+ 行）
   - 視覺化狀態指示：
     - 🟢 綠色 - 額度可用
     - 🔴 紅色 - 額度已用盡
     - ⚪ 灰色 - 狀態未知
   - 即時倒計時顯示：
     - 友好的時間格式（天/小時/分鐘）
     - 進度條視覺化（顏色漸變：紅→黃→綠）
   - 快速操作按鈕：
     - 標記為已用盡（附設定對話框）
     - 標記為可用
     - 通知設定
   - 自動更新機制（每分鐘刷新倒計時）

2. **QuotaManager 組件** (`src/renderer/components/quota/QuotaManager.vue`)
   - 完整的額度管理面板（450+ 行）
   - 統計儀表板：
     - 可用服務數量
     - 已用盡服務數量
     - 24 小時內即將重置的服務數量
     - 啟用通知的服務數量
   - 搜尋與篩選：
     - 服務名稱搜尋
     - 狀態篩選（全部/可用/已用盡/未知）
     - 多種排序方式（名稱/狀態/重置時間）
   - 響應式網格佈局（12/6/4 欄）
   - 快速操作提示卡片

3. **Dashboard 整合** (`src/renderer/components/dashboard/MainDashboard.vue`)
   - 新增「額度追蹤」快速入口卡片
   - 路由配置：`/quota`
   - 視覺一致性：Liquid Glass 效果

### IPC 通訊層

**已實作的 IPC Handlers** (`src/main/ipc-handlers.ts`):

```typescript
// 8 個額度相關的 IPC handlers
'quota:get-by-service'          // 獲取特定服務額度
'quota:get-all'                 // 獲取所有額度
'quota:mark-depleted'           // 標記為已用盡
'quota:mark-available'          // 標記為可用
'quota:update-reset-time'       // 更新重置時間
'quota:update-notify-settings'  // 更新通知設定
'quota:get-depleted'            // 獲取所有已用盡的額度
'quota:trigger-check'           // 手動觸發檢查
```

**Preload API 更新** (`src/main/preload.ts`):
```typescript
electronAPI.getQuotaByService()
electronAPI.getAllQuotas()
electronAPI.markQuotaDepleted()
electronAPI.markQuotaAvailable()
electronAPI.updateQuotaResetTime()
electronAPI.updateQuotaNotifySettings()
electronAPI.getDepletedQuotas()
electronAPI.triggerQuotaCheck()
```

---

## 📊 技術實作統計

| 項目 | 數量/規模 |
|------|---------|
| **新增檔案** | 2 個 Vue 組件 |
| **修改檔案** | 4 個（AIStore, preload, router, MainDashboard） |
| **程式碼行數** | ~1,100+ 行 |
| **IPC Handlers** | 8 個（已存在） |
| **Preload APIs** | 8 個（新增） |
| **Store Actions** | 8 個（新增到 AIStore） |
| **Vue 組件** | 2 個（QuotaStatusCard, QuotaManager） |
| **資料庫相關** | QuotaRepository（已存在，252 行） |

---

## 🔧 技術架構

### 資料流程

```
┌─────────────────┐
│  前端 UI 組件    │
│ QuotaManager    │
│ QuotaStatusCard │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Pinia Store   │
│    AIStore      │
│  (quotaTrackings)│
└────────┬────────┘
         │
         ↓ IPC
┌─────────────────┐
│  IPC Handlers   │
│  (quota:*)      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ QuotaRepository │
│   (Database)    │
└─────────────────┘
```

### 通知流程

```
┌────────────────────┐
│ NotificationManager│
│  (每分鐘檢查)       │
└──────────┬─────────┘
           │
           ↓
┌──────────────────────┐
│ QuotaRepository      │
│ getQuotasNeedingNotif│
│ checkAndUpdateExpired│
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│   發送桌面通知        │
│ (Electron Notification)│
└──────────────────────┘
```

---

## 💡 核心功能特色

### 1. 智能額度追蹤

- **自動狀態更新**: 系統每分鐘自動檢查額度重置時間，過期後自動更新為「可用」狀態
- **手動狀態管理**: 使用者可隨時手動標記額度狀態（已用盡/可用）
- **靈活的重置時間**: 支援自訂重置時間，適應不同 AI 服務的額度週期

### 2. 多層級通知系統

- **提前通知**: 可設定提前 10-1440 分鐘通知（預設 60 分鐘）
- **重置通知**: 額度重置後立即通知使用者
- **個別控制**: 每個 AI 服務可獨立設定是否啟用通知
- **防重複機制**: 使用 `lastNotifiedAt` 避免重複發送相同通知

### 3. 視覺化管理介面

- **狀態一目了然**: 使用顏色和圖示清楚表示額度狀態
- **即時倒計時**: 友好的時間顯示（天/小時/分鐘）+ 進度條視覺化
- **統計儀表板**: 快速了解所有服務的額度概況
- **高效搜尋篩選**: 快速找到需要關注的服務

### 4. Liquid Glass 視覺設計

- **一致的設計語言**: 所有組件採用 Liquid Glass 風格
- **互動回饋**: 懸停效果、按鈕漣漪效果
- **響應式佈局**: 適應不同螢幕尺寸（手機/平板/桌面）

---

## 🎨 使用者體驗設計

### 標記額度為已用盡流程

1. 點擊「標記為已用盡」按鈕
2. 彈出對話框，填寫：
   - 重置時間（日期時間選擇器，預設明天此時）
   - 備註（選填，如「官方公告明天下午 3 點重置」）
3. 確認後：
   - 額度狀態變為「已用盡」（紅色）
   - 顯示倒計時進度條
   - 系統開始監控重置時間

### 通知設定流程

1. 點擊「設定」按鈕
2. 調整通知設定：
   - 啟用/停用通知（開關）
   - 提前通知時間（滑桿，10-1440 分鐘）
3. 儲存後立即生效

### 額度重置提醒流程

1. **提前通知**（例如重置前 60 分鐘）:
   - 桌面通知：「ChatGPT 額度即將重置」
   - 內容：「您的 ChatGPT 額度將在 1 小時 0 分鐘 後重置」

2. **重置後通知**:
   - 桌面通知：「ChatGPT 額度已重置」
   - 內容：「您的 ChatGPT 額度現在可用了」
   - 卡片狀態自動變為綠色「可用」

---

## 🔄 系統整合

### 與現有系統的整合

1. **AIStore 整合**:
   - 額度狀態與服務可用性同步
   - `markQuotaDepleted()` 會同時更新 `service.isAvailable = false`
   - `markQuotaAvailable()` 會同時更新 `service.isAvailable = true`

2. **資料庫整合**:
   - `quota_tracking` 表與 `ai_services` 表透過 `ai_service_id` 關聯
   - 初始化時自動為所有 AI 服務建立額度追蹤記錄

3. **通知系統整合**:
   - NotificationManager 在應用啟動時自動啟動監控
   - 與主視窗整合，點擊通知可喚起主視窗

4. **路由整合**:
   - 新增 `/quota` 路由
   - Dashboard 快速入口直接導航

---

## 📝 程式碼品質

### 類型安全

- ✅ 完整的 TypeScript 類型定義
- ✅ QuotaTracking 介面明確定義
- ✅ IPC 通訊使用型別安全的參數

### 錯誤處理

- ✅ 所有非同步操作都包含 try-catch
- ✅ 錯誤訊息記錄到 console
- ✅ 使用者友好的錯誤提示（透過 AIStore.error）

### 效能優化

- ✅ 倒計時每分鐘更新一次（避免過度渲染）
- ✅ 使用 Map 資料結構快速查詢額度狀態
- ✅ 防抖機制避免重複通知

---

## 🧪 測試建議

### 功能測試

1. **額度標記測試**:
   - [ ] 標記服務為已用盡，檢查狀態更新
   - [ ] 標記服務為可用，檢查狀態更新
   - [ ] 設定重置時間，檢查倒計時顯示

2. **通知測試**:
   - [ ] 設定短期重置時間（例如 2 分鐘後）
   - [ ] 確認提前通知正確發送
   - [ ] 確認重置後通知正確發送
   - [ ] 測試點擊通知喚起主視窗

3. **UI 測試**:
   - [ ] 檢查統計數字是否正確
   - [ ] 測試搜尋和篩選功能
   - [ ] 測試排序功能
   - [ ] 檢查響應式佈局（不同螢幕尺寸）

### 整合測試

1. **資料持久化測試**:
   - [ ] 設定額度狀態後重啟應用，檢查狀態是否保留
   - [ ] 修改通知設定後重啟，檢查設定是否保留

2. **跨組件測試**:
   - [ ] 在 QuotaManager 中標記額度，檢查 Dashboard 中服務卡片狀態
   - [ ] 檢查 AIStore 狀態與資料庫同步

---

## 🚀 未來改進建議

### 功能擴展

1. **自動額度偵測**:
   - 透過 WebView 監控實際使用情況
   - 自動標記額度用盡（目前為手動標記）

2. **額度使用統計**:
   - 記錄歷史使用量
   - 視覺化圖表（週/月使用趨勢）
   - 預測額度用盡時間

3. **多重通知渠道**:
   - 除了桌面通知，支援郵件通知
   - 支援自訂通知音效

4. **額度分享**:
   - 多使用者共享額度追蹤
   - 團隊協作功能

### 效能優化

1. **通知批次處理**:
   - 多個服務同時重置時，合併為一個通知

2. **智能檢查頻率**:
   - 根據最近的重置時間動態調整檢查頻率
   - 無即將重置的服務時降低檢查頻率

### UX 改進

1. **快速設定**:
   - 預設重置週期範本（每日/每週/每月）
   - 一鍵設定多個服務

2. **提醒方式**:
   - 支援在應用內顯示 Banner 提醒
   - 徽章數字顯示即將重置的服務數量

---

## 📚 相關文件

- [Task 1: 專案基礎架構](./task-1.md) - 基礎框架
- [Task 2: 核心資料層](./task-2.md) - 資料庫架構
- [Task 5: AI 服務整合](./task-5.md) - AI 服務管理
- [Task 6: 系統托盤和熱鍵](./task-6.md) - 系統整合

---

## ✅ 完成清單

- [x] **10.1** 建立額度狀態管理
  - [x] QuotaRepository 資料存取層
  - [x] QuotaTracking 資料模型
  - [x] AIStore 額度追蹤 actions
  - [x] IPC Handlers 和 Preload APIs

- [x] **10.2** 實作桌面通知系統
  - [x] NotificationManager 通知管理器
  - [x] 自動額度監控（每分鐘檢查）
  - [x] 即將重置通知
  - [x] 已重置通知
  - [x] 通知點擊處理

- [x] **10.3** 建立額度狀態介面
  - [x] QuotaStatusCard 組件
  - [x] QuotaManager 組件
  - [x] 統計儀表板
  - [x] 搜尋與篩選功能
  - [x] Dashboard 快速入口
  - [x] 路由配置

---

**最後更新**: 2025-11-09

**文檔版本**: v1.0
