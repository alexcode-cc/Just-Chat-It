import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { WindowStateRepository } from './database/repositories';
import { WindowState } from '../shared/types/database';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private chatWindows: Map<string, BrowserWindow> = new Map();
  private windowStateRepo: WindowStateRepository | null = null;
  private saveStateTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // 延遲初始化 WindowStateRepository（在首次使用時才創建）
    // 確保資料庫已初始化後再訪問
  }

  /**
   * 延遲初始化 WindowStateRepository
   * 在首次需要時才創建，確保資料庫已初始化
   */
  private getWindowStateRepository(): WindowStateRepository {
    if (!this.windowStateRepo) {
      this.windowStateRepo = new WindowStateRepository();
    }
    return this.windowStateRepo;
  }

  async createMainWindow(): Promise<BrowserWindow> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // 嘗試從資料庫恢復上次的視窗狀態
    const savedState = this.getWindowStateRepository().getMainWindowState();

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: savedState?.width || Math.min(1200, width - 100),
      height: savedState?.height || Math.min(800, height - 100),
      x: savedState?.x,
      y: savedState?.y,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
      frame: false,
      transparent: true,
      titleBarStyle: 'hidden',
    };

    this.mainWindow = new BrowserWindow(windowOptions);

    // 恢復最大化狀態
    if (savedState?.isMaximized) {
      this.mainWindow.maximize();
    }

    // 設定視窗事件監聽器來追蹤狀態變化
    this.setupWindowStateTracking(this.mainWindow, 'main');

    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    return this.mainWindow;
  }

  createChatWindow(aiServiceId: string): BrowserWindow {
    // 嘗試恢復上次的視窗狀態
    const savedState = this.getWindowStateRepository().findByAIServiceId(aiServiceId);

    const chatWindow = new BrowserWindow({
      width: savedState?.width || 1000,
      height: savedState?.height || 700,
      x: savedState?.x,
      y: savedState?.y,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '../preload/preload.js'),
        webviewTag: true, // 啟用 webview 標籤以載入 AI 服務網頁
      },
      frame: false,
      transparent: true,
      roundedCorners: true, // 啟用圓角（如果平台支持）
      backgroundColor: '#00000000', // 透明背景
    });

    // 恢復最大化狀態
    if (savedState?.isMaximized) {
      chatWindow.maximize();
    }

    // 設定視窗狀態追蹤
    const windowId = `chat-${aiServiceId}`;
    this.setupWindowStateTracking(chatWindow, windowId, aiServiceId);

    this.chatWindows.set(aiServiceId, chatWindow);

    chatWindow.on('closed', () => {
      this.chatWindows.delete(aiServiceId);
      // 清理定時器
      const timeout = this.saveStateTimeouts.get(windowId);
      if (timeout) {
        clearTimeout(timeout);
        this.saveStateTimeouts.delete(windowId);
      }
    });

    return chatWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  getChatWindow(aiServiceId: string): BrowserWindow | undefined {
    return this.chatWindows.get(aiServiceId);
  }

  /**
   * 設定視窗狀態追蹤
   */
  private setupWindowStateTracking(
    window: BrowserWindow,
    windowId: string,
    aiServiceId?: string
  ): void {
    // 防抖保存 - 避免頻繁寫入資料庫
    const debouncedSave = () => {
      const existingTimeout = this.saveStateTimeouts.get(windowId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        this.saveWindowState(window, windowId, aiServiceId);
      }, 500); // 500ms 防抖

      this.saveStateTimeouts.set(windowId, timeout);
    };

    // 監聽視窗移動
    window.on('move', debouncedSave);

    // 監聽視窗大小調整
    window.on('resize', debouncedSave);

    // 監聽最大化狀態
    window.on('maximize', debouncedSave);
    window.on('unmaximize', debouncedSave);

    // 監聽最小化狀態
    window.on('minimize', debouncedSave);
    window.on('restore', debouncedSave);

    // 監聽全螢幕狀態
    window.on('enter-full-screen', debouncedSave);
    window.on('leave-full-screen', debouncedSave);

    // 視窗關閉前最後保存一次
    window.on('close', () => {
      this.saveWindowState(window, windowId, aiServiceId);
    });
  }

  /**
   * 保存視窗狀態到資料庫
   */
  private saveWindowState(window: BrowserWindow, windowId: string, aiServiceId?: string): void {
    try {
      const bounds = window.getBounds();
      const isMaximized = window.isMaximized();
      const isMinimized = window.isMinimized();
      const isFullscreen = window.isFullScreen();

      // 判斷視窗類型
      const windowType = windowId === 'main' ? 'main' : 'chat';

      const state: Partial<WindowState> & { id: string } = {
        id: windowId,
        windowType,
        aiServiceId,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized,
        isMinimized,
        isFullscreen,
      };

      this.getWindowStateRepository().upsert(state);
      console.log(`Window state saved for ${windowId}`);
    } catch (error) {
      console.error(`Failed to save window state for ${windowId}:`, error);
    }
  }

  /**
   * 取得或恢復視窗狀態
   */
  public getWindowState(windowId: string): WindowState | null {
    return this.getWindowStateRepository().findById(windowId);
  }

  /**
   * 清理所有視窗狀態追蹤
   */
  public cleanup(): void {
    // 清除所有定時器
    this.saveStateTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.saveStateTimeouts.clear();

    // 最後一次保存所有視窗狀態
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.saveWindowState(this.mainWindow, 'main');
    }

    this.chatWindows.forEach((window, aiServiceId) => {
      if (!window.isDestroyed()) {
        this.saveWindowState(window, `chat-${aiServiceId}`, aiServiceId);
      }
    });
  }
}
