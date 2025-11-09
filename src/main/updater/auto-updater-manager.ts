/**
 * 自動更新管理器
 * 負責檢查和安裝應用程式更新
 */

import { autoUpdater, UpdateInfo } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import { logger } from '../logging';

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export class AutoUpdaterManager {
  private static instance: AutoUpdaterManager;
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  private constructor() {
    this.setupAutoUpdater();
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): AutoUpdaterManager {
    if (!AutoUpdaterManager.instance) {
      AutoUpdaterManager.instance = new AutoUpdaterManager();
    }
    return AutoUpdaterManager.instance;
  }

  /**
   * 設定主視窗
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * 設定 auto-updater
   */
  private setupAutoUpdater(): void {
    // 配置 auto-updater
    autoUpdater.autoDownload = false; // 不自動下載，讓使用者決定
    autoUpdater.autoInstallOnAppQuit = true; // 退出時自動安裝

    // 設定日誌
    autoUpdater.logger = logger;

    // 監聽更新事件
    this.setupEventListeners();

    logger.info('AutoUpdater initialized');
  }

  /**
   * 設定事件監聽器
   */
  private setupEventListeners(): void {
    // 檢查更新時
    autoUpdater.on('checking-for-update', () => {
      this.isChecking = true;
      logger.info('Checking for updates...');
      this.sendToRenderer('update:checking');
    });

    // 發現可用更新
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.isChecking = false;
      logger.info('Update available', info);
      this.sendToRenderer('update:available', info);
      this.showUpdateAvailableDialog(info);
    });

    // 沒有可用更新
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.isChecking = false;
      logger.info('Update not available', info);
      this.sendToRenderer('update:not-available', info);
    });

    // 下載進度
    autoUpdater.on('download-progress', (progress: UpdateProgress) => {
      logger.debug('Download progress', progress);
      this.sendToRenderer('update:download-progress', progress);
    });

    // 更新已下載
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      logger.info('Update downloaded', info);
      this.sendToRenderer('update:downloaded', info);
      this.showUpdateDownloadedDialog(info);
    });

    // 錯誤處理
    autoUpdater.on('error', (error: Error) => {
      this.isChecking = false;
      logger.error('Update error', error);
      this.sendToRenderer('update:error', { message: error.message });
    });
  }

  /**
   * 發送訊息給渲染程序
   */
  private sendToRenderer(channel: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * 顯示「有可用更新」對話框
   */
  private async showUpdateAvailableDialog(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const { response } = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '發現新版本',
      message: `發現新版本 ${info.version}`,
      detail: `目前版本: ${autoUpdater.currentVersion}\n新版本: ${info.version}\n\n是否要下載更新？`,
      buttons: ['下載更新', '稍後提醒', '不再提醒'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      // 下載更新
      await this.downloadUpdate();
    } else if (response === 2) {
      // 不再提醒（可以儲存到設定中）
      logger.info('User disabled update notifications');
    }
  }

  /**
   * 顯示「更新已下載」對話框
   */
  private async showUpdateDownloadedDialog(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const { response } = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '更新已下載',
      message: '更新已下載完成',
      detail: `新版本 ${info.version} 已下載完成。\n\n是否要立即重新啟動並安裝更新？`,
      buttons: ['立即重啟', '稍後重啟'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      // 立即重啟並安裝
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true);
      });
    }
  }

  /**
   * 檢查更新
   */
  async checkForUpdates(): Promise<void> {
    if (this.isChecking) {
      logger.warn('Update check already in progress');
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error('Failed to check for updates', error as Error);
      throw error;
    }
  }

  /**
   * 下載更新
   */
  async downloadUpdate(): Promise<void> {
    try {
      logger.info('Starting update download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Failed to download update', error as Error);
      throw error;
    }
  }

  /**
   * 立即安裝更新
   */
  quitAndInstall(): void {
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * 啟動定期檢查（每 4 小時檢查一次）
   */
  startPeriodicCheck(intervalHours: number = 4): void {
    if (this.updateCheckInterval) {
      logger.warn('Periodic update check already started');
      return;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;

    // 立即檢查一次
    setTimeout(() => {
      this.checkForUpdates();
    }, 60000); // 啟動後 1 分鐘檢查

    // 定期檢查
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);

    logger.info('Periodic update check started', {
      intervalHours,
      intervalMs,
    });
  }

  /**
   * 停止定期檢查
   */
  stopPeriodicCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      logger.info('Periodic update check stopped');
    }
  }

  /**
   * 取得目前版本
   */
  getCurrentVersion(): string {
    return autoUpdater.currentVersion.version;
  }

  /**
   * 設定更新源（用於測試）
   */
  setFeedURL(url: string): void {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url,
    });
    logger.info('Update feed URL set', { url });
  }
}

export const autoUpdaterManager = AutoUpdaterManager.getInstance();
