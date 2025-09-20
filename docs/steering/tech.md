# 技術規範

## 技術棧

### 核心框架
- **Electron**: 跨平台桌面應用框架
- **Vue 3**: 前端框架，使用Composition API
- **Vuetify 3**: Material Design組件庫
- **TypeScript**: 類型安全的JavaScript超集
- **Vite**: 現代化建置工具

### 狀態管理與資料
- **Pinia**: Vue 3狀態管理庫
- **SQLite**: 本地資料庫
- **Vue Router**: 路由管理

### 開發工具
- **Vitest**: 單元測試框架
- **Playwright**: E2E測試工具
- **ESLint + Prettier**: 程式碼品質工具

## 建置與開發命令

### 專案初始化
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

### 測試命令
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

## 架構原則

### 主程序 (Main Process)
- 負責應用程式生命週期管理
- 多視窗管理和IPC通訊
- 系統整合功能（托盤、熱鍵、通知）
- 資料庫操作和檔案系統存取

### 渲染程序 (Renderer Process)
- Vue 3應用程式邏輯
- 用戶介面渲染和互動
- WebView整合AI服務
- Liquid Glass視覺效果

### IPC通訊規範
- 使用typed IPC channels
- 錯誤處理和超時機制
- 資料序列化和驗證

## 程式碼規範

### 檔案命名
- 組件: PascalCase (例: `ChatWindow.vue`)
- 工具函數: camelCase (例: `formatDate.ts`)
- 常數: UPPER_SNAKE_CASE (例: `AI_SERVICES.ts`)
- 類型定義: PascalCase (例: `AIService.ts`)

### 目錄結構
```
src/
├── main/           # 主程序程式碼
├── renderer/       # 渲染程序程式碼
│   ├── components/ # Vue組件
│   ├── stores/     # Pinia stores
│   ├── types/      # TypeScript類型定義
│   ├── utils/      # 工具函數
│   └── styles/     # 樣式檔案
├── shared/         # 共用程式碼
└── assets/         # 靜態資源
```

### TypeScript規範
- 嚴格模式啟用
- 明確的類型定義
- 避免使用`any`類型
- 介面優於類型別名

### Vue 3規範
- 使用Composition API
- 單檔案組件 (SFC)
- Props和Emits明確定義
- 響應式資料使用ref/reactive

### CSS規範
- 使用SCSS預處理器
- BEM命名規範
- CSS變數用於主題
- 響應式設計原則

## Liquid Glass視覺效果

### CSS架構
```scss
// 核心液態玻璃效果
.liquid-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  // 動態光影效果
}

// 互動式效果
.liquid-glass-interactive {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  // 滑鼠追蹤光影
}
```

### 效能考量
- 使用CSS transform而非position變更
- 適當的will-change屬性
- 避免過度的backdrop-filter使用
- 硬體加速優化

## 資料庫設計

### SQLite最佳實踐
- 使用事務處理批量操作
- 適當的索引設計
- 資料庫版本管理和遷移
- 備份和恢復機制

### 資料模型
- 明確的外鍵關係
- JSON欄位用於彈性資料
- 時間戳記使用ISO格式
- 軟刪除機制

## 錯誤處理

### 分層錯誤處理
1. **UI層**: 用戶友好的錯誤訊息
2. **業務層**: 業務邏輯錯誤處理
3. **資料層**: 資料庫和網路錯誤
4. **系統層**: 系統級錯誤和崩潰恢復

### 日誌記錄
- 結構化日誌格式
- 不同級別的日誌 (error, warn, info, debug)
- 敏感資料過濾
- 日誌輪轉和清理

## 效能優化

### 記憶體管理
- WebView資源清理
- 事件監聽器移除
- 大型物件及時釋放
- 記憶體洩漏監控

### 渲染優化
- 虛擬滾動大量資料
- 圖片懶載入
- 組件按需載入
- CSS動畫硬體加速

## 安全考量

### 資料安全
- 本地資料加密
- 敏感資訊不記錄日誌
- 安全的IPC通訊
- WebView安全設定

### 系統安全
- 最小權限原則
- 輸入驗證和清理
- 防止程式碼注入
- 安全的更新機制