import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { setupIpcHandlers } from './ipc-handlers';
import path from 'path';

class Application {
  private windowManager: WindowManager;

  constructor() {
    this.windowManager = new WindowManager();
    this.setupApp();
  }

  private setupApp() {
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', () => this.onActivate());
  }

  private async onReady() {
    setupIpcHandlers();
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
}

new Application();
