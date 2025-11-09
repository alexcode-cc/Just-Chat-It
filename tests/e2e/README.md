# E2E 測試文檔

## 概述

此目錄包含 Just Chat It 應用程式的端到端（E2E）測試。這些測試模擬真實用戶互動，驗證應用程式的完整流程。

## 測試框架

E2E 測試使用以下工具：

- **Playwright**: 用於 Electron 應用程式的自動化測試
- **Vitest**: 測試執行器和斷言庫

## 設置

### 安裝依賴

```bash
npm install --save-dev @playwright/test playwright-electron
```

### 運行測試

```bash
# 執行所有 E2E 測試
npm run test:e2e

# 執行特定測試文件
npm run test:e2e tests/e2e/main-window.spec.ts

# 以 headed 模式運行（可見瀏覽器）
npm run test:e2e:headed
```

## 測試結構

```
tests/e2e/
├── README.md               # 本文件
├── setup.ts                # 測試設置和輔助函數
├── fixtures/               # 測試夾具和模擬數據
├── main-window.spec.ts     # 主視窗測試
├── ai-service.spec.ts      # AI 服務整合測試
├── prompt-library.spec.ts  # 提示詞庫測試
└── settings.spec.ts        # 設定頁面測試
```

## 測試範圍

### 已涵蓋的測試場景

1. **應用程式啟動**
   - 主視窗正確開啟
   - 初始狀態正確
   - 系統托盤圖示顯示

2. **導航流程**
   - 主控制面板導航
   - 路由切換
   - 頁面載入

3. **提示詞管理**
   - 建立新提示詞
   - 編輯提示詞
   - 刪除提示詞
   - 搜尋和篩選

4. **設定管理**
   - 主題切換
   - Liquid Glass 效果調整
   - 熱鍵設定
   - 設定持久化

### 待實作的測試場景

1. **AI 服務整合**
   - WebView 載入
   - 多視窗管理
   - 會話管理

2. **比較功能**
   - 多 AI 同時查詢
   - 結果顯示
   - 匯出功能

3. **離線功能**
   - 對話記錄查看
   - 搜尋歷史記錄
   - 匯出功能

4. **系統整合**
   - 熱鍵觸發
   - 系統托盤互動
   - 剪貼簿整合

## 最佳實踐

### 1. 測試獨立性

每個測試應該獨立運行，不依賴其他測試的狀態：

```typescript
describe('Prompt Library', () => {
  beforeEach(async () => {
    // 重置應用程式狀態
    await resetAppState();
  });

  it('should create a new prompt', async () => {
    // 測試邏輯
  });
});
```

### 2. 等待策略

使用適當的等待策略，避免不穩定的測試：

```typescript
// 好的做法：等待特定元素
await page.waitForSelector('[data-testid="prompt-list"]');

// 避免：固定時間等待
// await page.waitForTimeout(1000);
```

### 3. 選擇器策略

優先使用穩定的選擇器：

```typescript
// 最佳：使用 data-testid
await page.click('[data-testid="create-prompt-button"]');

// 可接受：使用 role
await page.click('button[role="button"]');

// 避免：使用 class 或 id（可能變更）
// await page.click('.btn-primary');
```

### 4. 清理資源

確保測試後清理資源：

```typescript
afterEach(async () => {
  // 關閉額外視窗
  await closeAllWindows();

  // 清理測試資料
  await cleanupTestData();
});
```

## 調試技巧

### 1. 截圖

在測試失敗時自動截圖：

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: `screenshots/${testInfo.title}.png` });
  }
});
```

### 2. 慢動作模式

減慢測試執行速度以便觀察：

```typescript
const browser = await chromium.launch({ slowMo: 100 });
```

### 3. 調試日誌

啟用詳細日誌輸出：

```bash
DEBUG=pw:api npm run test:e2e
```

## 持續整合

E2E 測試在 CI/CD 流程中自動執行：

```yaml
# .github/workflows/test.yml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## 效能考量

- 使用並行執行加速測試
- 合理使用測試資料
- 避免不必要的等待
- 重用應用程式實例（如可能）

## 參考資源

- [Playwright 文檔](https://playwright.dev/)
- [Electron Testing with Playwright](https://playwright.dev/docs/api/class-electron)
- [Vitest 文檔](https://vitest.dev/)
