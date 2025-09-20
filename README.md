# Just Chat It - 多AI聊桌面應用程式

讓我們開始聊天吧 - 個現代化的桌面應用程式，讓用戶能夠同時與多個AI服務進行對話。採用創新的iOS 26 Liquid Glass設計，提供沉浸式的視覺體驗。

## ✨ 主要特色

- 🤖 **多AI整合**: 支援ChatGPT、Claude、Gemini、Perplexity、Grok、Copilot等主流AI服務
- ⚡ **效率優先**: 透過熱鍵、剪貼簿整合、提示詞管理等功能提升工作效率
- 🎨 **視覺創新**: 採用Liquid Glass設計，提供前衛的視覺體驗
- 🔒 **隱私保護**: 本地資料存儲，離線瀏覽功能，保護用戶隱私

## 🚀 核心功能

### 多視窗管理
每個AI服務都有獨立的聊天視窗，支援同時進行多個對話主題。

### 智能剪貼簿
自動檢測剪貼簿內容，快速開始AI對話，提升工作流程效率。

### 提示詞倉庫
管理和重複使用有效的提示詞，建立個人化的AI互動模式。

### 比較功能
同時向多個AI發送相同問題，比較不同AI的回應品質和角度。

### 額度管理
追蹤各AI服務的使用額度，智能提醒重置時間。

## 🛠️ 技術棧

- **Electron**: 跨平台桌面應用框架
- **Vue 3**: 前端框架，使用Composition API
- **Vuetify 3**: Material Design組件庫
- **TypeScript**: 類型安全的JavaScript超集
- **Vite**: 現代化建置工具
- **Pinia**: Vue 3狀態管理庫
- **SQLite**: 本地資料庫

## 📦 安裝與使用

### 系統需求
- Node.js 18.0 或更高版本
- npm 或 yarn 套件管理器

### 開發環境設定

```bash
# 複製專案
git clone git@github.com:alexcode-cc/Just-Chat-It.git
cd Just-Chat-It

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

## 🎯 目標用戶

- **專業工作者**: 需要頻繁使用AI工具進行工作的專業人士
- **研究人員**: 需要比較不同AI回應結果的研究者
- **內容創作者**: 需要AI協助進行創作和靈感激發的創作者
- **技術愛好者**: 喜歡嘗試新技術和工具的早期採用者

## 📁 專案結構

```
Just-Chat-It/
├── docs/                       # 專案文件
│   ├── specs/                  # 功能規格文件
│   └── steering/               # 專案指導文件
├── src/                        # 原始碼目錄
│   ├── main/                   # Electron主程序
│   ├── renderer/               # Vue渲染程序
│   ├── shared/                 # 共用程式碼
│   └── assets/                 # 靜態資源
├── tests/                      # 測試檔案
├── dist/                       # 建置輸出
└── resources/                  # 應用程式資源
```

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！請查看 [貢獻指南](CONTRIBUTING.md) 了解如何參與專案開發。

### Git提交規範

本專案採用 AngularJS Git Commit Message Conventions 規範：

- `feat: 功能描述` - 新功能
- `fix: 修復描述` - 錯誤修復  
- `docs: 文件描述` - 文件更新
- `style: 樣式描述` - 程式碼格式調整
- `refactor: 重構描述` - 程式碼重構
- `test: 測試描述` - 測試相關
- `build: 建置描述` - 建置系統或外部相依性

## 📄 授權

本專案採用 [MIT License](LICENSE) 授權。

## 🔗 相關連結

- [專案規格文件](docs/specs/)
- [技術指導文件](docs/steering/)
- [問題回報](https://github.com/alexcode-cc/Just-Chat-It/issues)
- [功能請求](https://github.com/alexcode-cc/Just-Chat-It/issues/new?template=feature_request.md)

## 📞 聯絡方式

如有任何問題或建議，歡迎透過以下方式聯絡：

- GitHub Issues: [提交問題](https://github.com/alexcode-cc/Just-Chat-It/issues)
- Email: alexcode.cc@outlook.com

---

⭐ 如果這個專案對你有幫助，請給我們一個星星！