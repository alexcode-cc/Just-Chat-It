# Just Chat It - 讓我們開始聊天吧 🚀

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0--MVP-blue)
![Status](https://img.shields.io/badge/status-MVP%20Complete-success)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

**一個現代化的多 AI 聊天桌面應用程式**

採用 Electron + Vue 3 + Vuetify 架構，整合多個主流 AI 服務
創新的 Liquid Glass 設計，提供沉浸式的視覺體驗

[功能特色](#-核心功能) • [快速開始](#-安裝與使用) • [文檔](#-專案文檔) • [貢獻](#-貢獻指南)

</div>

---

## 📊 專案狀態

**MVP 版本**: v1.0.0 ✅
**開發週期**: 2025-11-08 ~ 2025-11-09
**完成任務**: 15/15 (100%)
**測試覆蓋**: 63+ 測試案例
**程式碼行數**: ~16,740+ 行

> 🎉 **MVP 開發已完成！** 所有核心功能已實作並測試完成，應用程式已準備好進行生產環境部署。

## ✨ 主要特色

- 🤖 **多AI整合**: 支援ChatGPT、Claude、Gemini、Perplexity、Grok、Copilot等主流AI服務
- ⚡ **效率優先**: 透過熱鍵、剪貼簿整合、提示詞管理等功能提升工作效率
- 🎨 **視覺創新**: 採用Liquid Glass設計，提供前衛的視覺體驗
- 🔒 **隱私保護**: 本地資料存儲，離線瀏覽功能，保護用戶隱私

## 🚀 核心功能

### 🪟 多視窗管理
- 每個 AI 服務獨立的 BrowserWindow
- 視窗狀態和位置自動持久化儲存
- 支援同時開啟多個對話主題
- 下次啟動自動恢復視窗配置

### 🤖 AI 服務整合
- **支援 6 個主流 AI 服務**：ChatGPT、Claude、Gemini、Perplexity、Grok、Copilot
- 使用 WebView 載入官方網頁介面
- 獨立的會話管理和隔離機制
- 自動服務健康檢查和狀態監控

### 📋 智能剪貼簿
- 自動檢測剪貼簿內容變化
- 智能識別內容類型（URL、程式碼、純文字）
- 快速插入到當前聊天視窗
- 剪貼簿歷史記錄管理

### 💡 提示詞管理系統
- 完整的提示詞倉庫功能
- 8 種預設分類（通用、程式開發、寫作、翻譯等）
- 使用次數追蹤和收藏功能
- 搜尋、篩選、排序功能
- 快速選擇器一鍵插入

### ⚖️ AI 比較功能
- 同時向多個 AI 發送相同問題
- 並排比較不同 AI 的回應
- 比較結果儲存和匯出（JSON/Markdown）
- 支援 2-6 個 AI 同時比較

### 📊 額度追蹤與提醒
- 手動標記 AI 服務額度狀態
- 額度重置時間倒數計時
- 桌面通知提醒（提前通知和重置通知）
- 視覺化額度狀態儀表板

### 💾 離線存取功能
- 自動擷取 WebView 對話內容
- 完整的離線對話記錄瀏覽
- 進階搜尋和篩選功能
- 對話記錄匯出（Markdown/JSON）

### ⚙️ 系統整合
- **全域熱鍵**：7 個預設熱鍵組合，支援自訂
- **系統托盤**：最小化到托盤，快速選單存取
- **桌面通知**：額度提醒、系統通知
- **剪貼簿監控**：即時內容檢測

### 🎨 Liquid Glass 視覺設計
- 玻璃擬態效果（backdrop-filter）
- 動態光影追蹤滑鼠位置
- 5 種預設主題方案（標準、柔和、強烈、極簡、關閉）
- 淺色/深色模式切換
- 流暢的動畫和過渡效果

### 🔧 系統設定
- 完整的設定介面（6 個分頁）
- 熱鍵自訂和管理
- Liquid Glass 效果調整
- 設定備份與還原（JSON 匯入/匯出）
- 重置所有設定功能

### 🐛 錯誤處理與日誌
- 分層錯誤處理（UI、業務、資料、系統層）
- 40+ 錯誤代碼分類
- 自動日誌記錄和管理（保留 30 天）
- 日誌查看器和匯出功能
- 用戶友好的錯誤通知

### ⚡ 效能監控
- 記憶體和 CPU 使用率監控
- 系統資源追蹤
- 自動效能警告和優化建議
- 效能報告和統計

### 🔄 自動更新
- 定期檢查 GitHub Releases
- 背景下載和安裝
- 更新進度顯示
- 用戶友好的更新對話框

## 🛠️ 技術棧

### 核心框架
- **Electron** ^27.0.0 - 跨平台桌面應用框架
- **Vue 3** ^3.3.0 - 前端框架（Composition API）
- **Vuetify 3** ^3.4.0 - Material Design 組件庫
- **TypeScript** ^5.2.0 - 類型安全開發
- **Vite** ^4.5.0 - 現代化建置工具

### 狀態管理與資料
- **Pinia** - Vue 3 狀態管理（6 個主要 Store）
- **SQLite** (better-sqlite3) - 本地資料庫（9 個表）
- **Repository Pattern** - 資料存取層（8 個 Repository）

### 測試與品質
- **Vitest** - 單元測試框架
- **Playwright** - E2E 測試（Electron 適配）
- **ESLint** - 程式碼檢查
- **Prettier** - 程式碼格式化

### 打包與分發
- **Electron Builder** - 應用程式打包
- **electron-updater** - 自動更新機制
- 支援平台：Windows (x64, ia32), macOS (x64, arm64), Linux (x64)

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
│   ├── mvp/                    # MVP 任務文檔（15 個任務）
│   ├── specs/                  # 功能規格文件
│   ├── plans/                  # 開發計劃
│   └── steering/               # 專案指導文件
├── src/                        # 原始碼目錄
│   ├── main/                   # Electron 主程序
│   │   ├── database/           # SQLite 資料庫管理
│   │   ├── system-integration/ # 系統整合（托盤、熱鍵、剪貼簿）
│   │   ├── performance/        # 效能監控
│   │   ├── updater/            # 自動更新
│   │   ├── logging/            # 錯誤處理和日誌
│   │   └── services/           # 業務服務
│   ├── renderer/               # Vue 渲染程序
│   │   ├── components/         # Vue 組件（28+ 個）
│   │   ├── stores/             # Pinia 狀態管理（6 個 Store）
│   │   ├── types/              # TypeScript 類型定義
│   │   ├── utils/              # 工具函數
│   │   └── styles/             # 樣式檔案（Liquid Glass）
│   ├── shared/                 # 共用程式碼
│   │   ├── types/              # 共用類型定義
│   │   ├── constants/          # 常數定義
│   │   └── utils/              # 共用工具函數
│   └── assets/                 # 靜態資源
├── tests/                      # 測試檔案
│   ├── unit/                   # 單元測試
│   ├── integration/            # 整合測試
│   ├── e2e/                    # E2E 測試
│   └── fixtures/               # 測試數據
├── scripts/                    # 建置腳本
├── dist/                       # 建置輸出
└── resources/                  # 應用程式資源
```

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！無論是報告錯誤、提出功能建議、改進文檔或提交程式碼，都非常感謝。

### 如何貢獻
1. Fork 本專案
2. 創建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'feat: 新增某個很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

詳細資訊請參考開發文檔：
- [開發指南](CLAUDE.md) - 開發規範和最佳實踐
- [待辦事項](TODO.md) - 可以貢獻的項目列表

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

## 📚 專案文檔

### 核心文檔
- **[MVP 開發總結](MVP_SUMMARY.md)** - 完整的 MVP 開發過程和成果
- **[待辦事項](TODO.md)** - 後續開發計畫和改進項目
- **[開發指南](CLAUDE.md)** - 開發規範和最佳實踐
- **[AI 代理指南](AGENTS.md)** - AI 開發工具使用指南

### 任務文檔
- [Task 1: 專案基礎架構](docs/mvp/task-1.md)
- [Task 2: 核心資料層](docs/mvp/task-2.md)
- [Task 3: Liquid Glass 視覺系統](docs/mvp/task-3.md)
- [查看所有 15 個任務](docs/mvp/)

### 規格文檔
- [功能需求文件](docs/specs/requirements.md)
- [設計文件](docs/specs/design.md)
- [實作計劃](docs/specs/tasks.md)

## 📊 效能基準

### 啟動效能
- 主視窗載入：< 2 秒
- 應用程式啟動：< 3 秒

### 運行效能（閒置狀態）
- 記憶體使用：~200-300 MB（單視窗）
- CPU 使用：< 2%
- 效能監控開銷：< 1% CPU

### 打包大小
- Windows：~150-200 MB
- macOS：~170-220 MB
- Linux：~150-200 MB

## 🚢 發布與下載

> **注意**：應用程式尚未正式發布。首個正式版本（v1.0.0）即將推出。

敬請期待以下平台的安裝程式：
- **Windows**：NSIS 安裝程式、Portable 免安裝版
- **macOS**：DMG 映像檔（支援 Intel 和 Apple Silicon）
- **Linux**：AppImage、DEB、RPM

發布後將提供自動更新功能。

## 🔗 相關連結

- [問題回報](https://github.com/alexcode-cc/Just-Chat-It/issues)
- [功能請求](https://github.com/alexcode-cc/Just-Chat-It/issues/new?template=feature_request.md)
- [版本發布](https://github.com/alexcode-cc/Just-Chat-It/releases)

## 📞 聯絡方式

如有任何問題或建議，歡迎透過以下方式聯絡：

- GitHub Issues: [提交問題](https://github.com/alexcode-cc/Just-Chat-It/issues)
- Email: alexcode.cc@outlook.com

## 🙏 致謝

感謝所有為這個專案做出貢獻的人！

特別感謝以下開源專案：
- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [Vuetify](https://vuetifyjs.com/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)

## 📝 更新日誌

### v1.0.0-MVP (2025-11-09)
- ✅ 完成所有 15 個核心任務
- ✅ 實作完整的 AI 服務整合
- ✅ 完成 Liquid Glass 視覺系統
- ✅ 實作效能監控和自動更新
- ✅ 完成測試框架（63+ 測試案例）
- ✅ 完成跨平台打包配置

查看 [MVP 開發總結](MVP_SUMMARY.md) 了解詳細資訊。

---

<div align="center">

**⭐ 如果這個專案對你有幫助，請給我們一個星星！**

Made with ❤️ by [alexcode-cc](https://github.com/alexcode-cc)

</div>