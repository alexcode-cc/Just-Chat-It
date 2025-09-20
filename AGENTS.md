# Repository Guidelines

## 專案結構與模組組織
主程式碼集中於 `src/`，Electron 主程序在 `src/main/` 管理視窗生命週期、IPC 管道與 SQLite 整合；`src/renderer/` 負責 Vue 3 + Vuetify 介面，依功能細分 `components/`、`stores/`、`router/`、`types/`、`styles/` 與 `assets/`。跨層共用邏輯存放於 `src/shared/` 的 `types/`、`constants/`、`utils/`，請將跨進程契約與共用工具集中於此。測試資源位於 `tests/`，含 `unit/`、`integration/`、`e2e/`、`fixtures/` 與 `helpers/`；對應模組請 mirror 目錄層級。`docs/specs/` 提供產品需求，`docs/steering/` 定義技術準則，調整架構時記得同步更新。建置輸出寫入 `dist/`，打包資產放在 `resources/`。

## 建置、測試與開發指令
初始化請執行 `npm install`。本地開發使用 `npm run dev` (Vite + Electron) 啟動熱重載環境；需要跨裝置測試可加 `-- --host 0.0.0.0`。`npm run build` 生成 Vite 產物供預覽，`npm run preview` 驗證靜態輸出，`npm run dist` 透過 Electron Builder 產出多平台安裝檔。品質檢查流程包含 `npm run lint` (ESLint)、`npm run lint:fix`、`npm run format` (Prettier) 與 `npm run type-check`。測試命令：`npm run test` 使用 Vitest，`npm run test:e2e` 執行 Playwright，`npm run test:coverage` 產生 `coverage/lcov.info`；CI 會在 Node 18 與 20、三個作業系統上逐一跑完，請於本地確認後再推送。

## 程式風格與命名慣例
TypeScript 啟用 strict 模式，避免 `any`，採用界面與具名型別。Vue 單檔案組件使用 Composition API，檔名一律 PascalCase (`ChatWindow.vue`)，測試或輔助工具採 kebab-case (`prompt-history.spec.ts`、`ai-service-utils.ts`)。SCSS 使用 2 空白縮排並遵循 BEM，Liquid Glass 效果共用於 `styles/liquid-glass.scss`。提交前請執行 `npm run lint`、`npm run format`，並確保自動修復後無 diff。日誌、IPC 通道與常數請集中於 `src/shared/constants/` 與 `src/shared/utils/logger.ts`，避免重複定義。

## 測試準則
每個功能模組至少提供 happy path、錯誤路徑與邊界情境測試。Vitest 檔案命名使用 `*.spec.ts`，E2E 規格採 `*.e2e.ts` 並置於 `tests/e2e/`。整合測試應覆蓋 IPC handler、資料庫流程與多視窗控制；若新增 Playwright 測試，請在 PR 描述列出所覆蓋的 user journey。推送前確認 `npm run test:coverage`，若覆蓋率下降需在 PR 解釋補救計畫，並考慮新增 `tests/fixtures/` 或 `tests/helpers/` 以支援重複場景。

## Commit 與 PR 規範
Commit 採 Angular 風格 (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `chore`)，主述句使用祈使語氣且 72 字元以內，body 說明動機與影響。功能開發請從 `develop` 或對應工作分支出發，必要時 Rebase 以保持線性歷史。PR 需附上：變更摘要、測試結果 (`npm run test`, `npm run test:e2e`, `npm run lint`)、相關 Issue 或規格文件連結，以及 UI 變更的截圖或錄影。CI 必須全數通過，若調整打包或環境設定，請在 PR 中標註需要 reviewer 特別檢查的檔案。

## 安全與設定提示
機密環境變數請放在 `.env.local` 並透過 `dotenv` 或 Electron `process.env` 載入，切勿提交 API keys。Playwright 測試帳號與密鑰請以 GitHub Secret 管理，或在 `docs/specs/` 更新 mock 設定。上傳 Artifact 前清理 `dist/` 與快取，避免洩漏個人設定檔。若實作新 IPC 通道，請驗證 payload schema 並在 `src/shared/types/ipc.ts` 加入對應型別。
