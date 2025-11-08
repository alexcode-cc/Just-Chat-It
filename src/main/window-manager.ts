import { BrowserWindow, screen } from 'electron';
import path from 'path';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private chatWindows: Map<string, BrowserWindow> = new Map();

  async createMainWindow(): Promise<BrowserWindow> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
      width: Math.min(1200, width - 100),
      height: Math.min(800, height - 100),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '../preload/index.js'),
      },
      frame: false,
      transparent: true,
      titleBarStyle: 'hidden',
    });

    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    return this.mainWindow;
  }

  createChatWindow(aiServiceId: string): BrowserWindow {
    const chatWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '../preload/index.js'),
      },
      frame: false,
      transparent: true,
    });

    this.chatWindows.set(aiServiceId, chatWindow);

    chatWindow.on('closed', () => {
      this.chatWindows.delete(aiServiceId);
    });

    return chatWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  getChatWindow(aiServiceId: string): BrowserWindow | undefined {
    return this.chatWindows.get(aiServiceId);
  }
}
