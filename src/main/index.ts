import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { setupIpcHandlers } from './ipc-handlers';
import { DatabaseManager } from './database/database-manager';
import { initializeDefaultData } from './database/init-data';
import path from 'path';

class Application {
  private windowManager: WindowManager;
  private dbManager: DatabaseManager;

  constructor() {
    this.windowManager = new WindowManager();
    this.dbManager = DatabaseManager.getInstance();
    this.setupApp();
  }

  private setupApp() {
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', () => this.onActivate());
    app.on('before-quit', () => this.onBeforeQuit());
  }

  private async onReady() {
    // 初始化資料庫
    this.dbManager.initialize();

    // 初始化預設資料
    await initializeDefaultData();

    // 設定 IPC handlers (傳入 windowManager)
    setupIpcHandlers(this.windowManager);

    // 建立主視窗
    await this.windowManager.createMainWindow();
  }

  private onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.windowManager.createMainWindow();
    }
  }

  private onBeforeQuit() {
    // 清理視窗狀態追蹤並保存最後狀態
    this.windowManager.cleanup();

    // 關閉資料庫連接
    this.dbManager.close();
  }
}

new Application();
