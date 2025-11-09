import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { setupIpcHandlers } from './ipc-handlers';
import { DatabaseManager } from './database/database-manager';
import { initializeDefaultData } from './database/init-data';
import { TrayManager, HotkeyManager, ClipboardManager } from './system-integration';
import { HotkeySettingsRepository } from './database/repositories';
import { Logger } from './logging/logger';
import { ErrorHandler } from './logging/error-handler';
import path from 'path';

class Application {
  private windowManager: WindowManager;
  private dbManager: DatabaseManager;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private trayManager: TrayManager | null = null;
  private hotkeyManager: HotkeyManager | null = null;
  private clipboardManager: ClipboardManager | null = null;

  constructor() {
    // 初始化日誌和錯誤處理
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();

    this.windowManager = new WindowManager();
    this.dbManager = DatabaseManager.getInstance();
    this.setupApp();
  }

  private setupApp() {
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', () => this.onActivate());
    app.on('before-quit', () => this.onBeforeQuit());
    app.on('will-quit', () => this.onWillQuit());
  }

  private async onReady() {
    try {
      this.logger.info('Application starting...');

      // 初始化資料庫
      this.dbManager.initialize();
      this.logger.info('Database initialized');

      // 初始化預設資料（包含預設熱鍵設定）
      await initializeDefaultData();
      this.logger.info('Default data initialized');

    // 建立主視窗
    await this.windowManager.createMainWindow();

    // 建立系統托盤
    this.trayManager = new TrayManager(this.windowManager);
    this.trayManager.createTray();

    // 初始化剪貼簿管理器
    this.clipboardManager = new ClipboardManager(this.windowManager, {
      enabled: true,
      autoFocus: true,
      monitorInterval: 500,
    });

    // 開始監控剪貼簿（根據設定）
    this.clipboardManager.startMonitoring();

    // 設定 IPC handlers (傳入 windowManager 和 clipboardManager)
    setupIpcHandlers(this.windowManager, this.clipboardManager);

    // 初始化全域熱鍵（傳入剪貼簿管理器）
    this.hotkeyManager = new HotkeyManager(this.windowManager, this.clipboardManager);

    // 從資料庫載入自訂熱鍵設定
    const hotkeyRepo = new HotkeySettingsRepository();
    const enabledHotkeys = hotkeyRepo.findEnabled();

    if (enabledHotkeys.length > 0) {
      // 使用自訂設定
      const customHotkeys: any = {};
      enabledHotkeys.forEach((hotkey) => {
        if (hotkey.aiServiceId) {
          customHotkeys[hotkey.aiServiceId] = hotkey.accelerator;
        } else if (hotkey.id === 'show-main-panel') {
          customHotkeys.showMainPanel = hotkey.accelerator;
        }
      });

      this.hotkeyManager.initialize(customHotkeys);
    } else {
      // 使用預設設定
      this.hotkeyManager.initialize();
    }

      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.fatal('Failed to initialize application', error as Error);
      this.errorHandler.handleError(error as Error, {
        showDialog: true,
        exitOnFatal: true,
      });
    }
  }

  private onWindowAllClosed() {
    // macOS 保持應用程式運行（托盤圖示仍可用）
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
    this.logger.info('Application is about to quit, cleaning up...');

    // 清理視窗狀態追蹤並保存最後狀態
    this.windowManager.cleanup();

    // 關閉資料庫連接
    this.dbManager.close();

    // 關閉日誌流
    this.logger.close();
  }

  private onWillQuit() {
    // 清理剪貼簿管理器
    if (this.clipboardManager) {
      this.clipboardManager.cleanup();
    }

    // 清理全域熱鍵
    if (this.hotkeyManager) {
      this.hotkeyManager.cleanup();
    }

    // 銷毀系統托盤
    if (this.trayManager) {
      this.trayManager.destroy();
    }
  }
}

new Application();
