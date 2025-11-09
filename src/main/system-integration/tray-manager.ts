import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import path from 'path';
import { AIServiceRepository } from '../database/repositories';
import { WindowManager } from '../window-manager';

/**
 * 系統托盤管理器
 * 負責建立和管理應用程式的系統托盤圖示和選單
 */
export class TrayManager {
  private tray: Tray | null = null;
  private windowManager: WindowManager;
  private aiServiceRepo: AIServiceRepository;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
    this.aiServiceRepo = new AIServiceRepository();
  }

  /**
   * 建立系統托盤
   */
  createTray(): void {
    // 建立托盤圖示
    const iconPath = this.getTrayIconPath();
    const icon = nativeImage.createFromPath(iconPath);

    // 根據平台調整圖示大小
    if (process.platform === 'darwin') {
      icon.setTemplateImage(true);
    }

    this.tray = new Tray(icon);

    // 設定工具提示
    this.tray.setToolTip('Just Chat It - 多AI聊天助手');

    // 設定托盤選單
    this.updateContextMenu();

    // 單擊托盤圖示時顯示/隱藏主視窗
    this.tray.on('click', () => {
      this.toggleMainWindow();
    });

    // macOS: 右鍵點擊顯示選單（Windows/Linux 會自動顯示）
    if (process.platform === 'darwin') {
      this.tray.on('right-click', () => {
        this.tray?.popUpContextMenu();
      });
    }

    console.log('System tray created');
  }

  /**
   * 更新托盤選單
   */
  updateContextMenu(): void {
    if (!this.tray) return;

    // 取得所有 AI 服務
    const aiServices = this.aiServiceRepo.findAll();
    const availableServices = aiServices.filter((s) => s.isAvailable);

    // 建立 AI 服務選單項目
    const aiServiceMenuItems = availableServices.map((service) => ({
      label: `開啟 ${service.displayName}`,
      click: () => this.openChatWindow(service.id),
    }));

    // 建立完整選單
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '顯示主面板',
        click: () => this.showMainWindow(),
      },
      { type: 'separator' },
      {
        label: 'AI 服務',
        submenu:
          aiServiceMenuItems.length > 0
            ? aiServiceMenuItems
            : [
                {
                  label: '沒有可用的服務',
                  enabled: false,
                },
              ],
      },
      { type: 'separator' },
      {
        label: '設定',
        click: () => this.openSettings(),
      },
      { type: 'separator' },
      {
        label: '關於',
        click: () => this.showAbout(),
      },
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * 取得托盤圖示路徑
   */
  private getTrayIconPath(): string {
    const fs = require('fs');

    // 根據平台選擇適當的圖示
    let iconName = 'tray-icon.png';

    if (process.platform === 'darwin') {
      iconName = 'tray-iconTemplate.png'; // macOS 使用 Template 圖示
    } else if (process.platform === 'win32') {
      iconName = 'tray-icon.ico'; // Windows 使用 ICO
    }

    const iconPath = path.join(__dirname, '../../resources/icons', iconName);

    // 檢查圖示檔案是否存在
    try {
      if (fs.existsSync(iconPath)) {
        return iconPath;
      }
    } catch (error) {
      // 忽略錯誤
    }

    // 如果找不到圖示檔案，建立一個簡單的預設圖示
    console.warn('Tray icon not found, using default placeholder');

    // 建立一個簡單的預設圖示（16x16 的透明圖示）
    const defaultIcon = nativeImage.createEmpty();
    return defaultIcon.toDataURL();
  }

  /**
   * 切換主視窗顯示/隱藏
   */
  private toggleMainWindow(): void {
    const mainWindow = this.windowManager.getMainWindow();

    if (!mainWindow) {
      this.showMainWindow();
      return;
    }

    if (mainWindow.isVisible()) {
      if (mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  }

  /**
   * 顯示主視窗
   */
  private showMainWindow(): void {
    const mainWindow = this.windowManager.getMainWindow();

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  }

  /**
   * 開啟聊天視窗
   */
  private async openChatWindow(serviceId: string): Promise<void> {
    try {
      // 檢查視窗是否已存在
      let chatWindow = this.windowManager.getChatWindow(serviceId);

      if (chatWindow && !chatWindow.isDestroyed()) {
        // 視窗已存在，顯示並聚焦
        if (chatWindow.isMinimized()) {
          chatWindow.restore();
        }
        chatWindow.show();
        chatWindow.focus();
      } else {
        // 建立新視窗
        chatWindow = this.windowManager.createChatWindow(serviceId);
        const service = this.aiServiceRepo.findById(serviceId);

        if (service) {
          // 載入 AI 服務網址
          await chatWindow.loadURL(service.webUrl);

          // 更新最後使用時間
          this.aiServiceRepo.updateLastUsed(serviceId);
        }

        chatWindow.show();
      }
    } catch (error) {
      console.error(`Failed to open chat window for ${serviceId}:`, error);
    }
  }

  /**
   * 開啟設定面板
   */
  private openSettings(): void {
    const mainWindow = this.windowManager.getMainWindow();

    if (mainWindow) {
      this.showMainWindow();
      // 透過主視窗路由導航到設定頁面
      mainWindow.webContents.send('navigate-to', '/settings');
    }
  }

  /**
   * 顯示關於對話框
   */
  private showAbout(): void {
    const mainWindow = this.windowManager.getMainWindow();

    if (mainWindow) {
      this.showMainWindow();
      // 可以顯示一個關於對話框或導航到關於頁面
      mainWindow.webContents.send('show-about');
    }
  }

  /**
   * 更新托盤圖示
   */
  updateIcon(iconPath: string): void {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath);
      this.tray.setImage(icon);
    }
  }

  /**
   * 顯示托盤通知（透過氣泡提示）
   */
  displayBalloon(title: string, content: string): void {
    if (this.tray && process.platform === 'win32') {
      this.tray.displayBalloon({
        title,
        content,
        icon: this.getTrayIconPath(),
      });
    }
  }

  /**
   * 銷毀托盤
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      console.log('System tray destroyed');
    }
  }

  /**
   * 取得托盤實例
   */
  getTray(): Tray | null {
    return this.tray;
  }
}
