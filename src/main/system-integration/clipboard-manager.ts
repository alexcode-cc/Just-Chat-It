import { clipboard, BrowserWindow } from 'electron';
import { WindowManager } from '../window-manager';

/**
 * 剪貼簿設定介面
 */
export interface ClipboardSettings {
  // 是否啟用剪貼簿檢查
  enabled: boolean;
  // 是否自動聚焦輸入框
  autoFocus: boolean;
  // 監控間隔（毫秒）
  monitorInterval: number;
}

/**
 * 剪貼簿內容介面
 */
export interface ClipboardContent {
  text: string;
  timestamp: Date;
  hash: string;
}

/**
 * 剪貼簿管理器
 * 負責監控剪貼簿內容變化並提供智能填入功能
 */
export class ClipboardManager {
  private windowManager: WindowManager;
  private settings: ClipboardSettings;
  private monitorTimer: NodeJS.Timeout | null = null;
  private lastClipboardContent: ClipboardContent | null = null;
  private isMonitoring: boolean = false;

  constructor(windowManager: WindowManager, settings?: Partial<ClipboardSettings>) {
    this.windowManager = windowManager;

    // 預設設定
    this.settings = {
      enabled: true,
      autoFocus: true,
      monitorInterval: 500, // 500ms 檢查一次
      ...settings,
    };
  }

  /**
   * 開始監控剪貼簿
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Clipboard monitoring is already active');
      return;
    }

    if (!this.settings.enabled) {
      console.log('Clipboard monitoring is disabled');
      return;
    }

    console.log('Starting clipboard monitoring...');
    this.isMonitoring = true;

    // 讀取初始剪貼簿內容
    this.updateLastClipboardContent();

    // 設定定時檢查
    this.monitorTimer = setInterval(() => {
      this.checkClipboardChange();
    }, this.settings.monitorInterval);
  }

  /**
   * 停止監控剪貼簿
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }

    this.isMonitoring = false;
    console.log('Clipboard monitoring stopped');
  }

  /**
   * 檢查剪貼簿內容是否變化
   */
  private checkClipboardChange(): void {
    try {
      const currentText = clipboard.readText();

      // 如果內容為空或無變化，不處理
      if (!currentText || currentText.trim().length === 0) {
        return;
      }

      // 計算內容的簡單 hash
      const currentHash = this.hashString(currentText);

      // 檢查是否有變化
      if (!this.lastClipboardContent || this.lastClipboardContent.hash !== currentHash) {
        console.log('Clipboard content changed');

        // 更新最後的剪貼簿內容
        this.lastClipboardContent = {
          text: currentText,
          timestamp: new Date(),
          hash: currentHash,
        };

        // 通知所有視窗剪貼簿內容已變化
        this.notifyClipboardChange(currentText);
      }
    } catch (error) {
      console.error('Error checking clipboard:', error);
    }
  }

  /**
   * 更新最後的剪貼簿內容
   */
  private updateLastClipboardContent(): void {
    try {
      const text = clipboard.readText();

      if (text && text.trim().length > 0) {
        this.lastClipboardContent = {
          text,
          timestamp: new Date(),
          hash: this.hashString(text),
        };
      }
    } catch (error) {
      console.error('Error updating last clipboard content:', error);
    }
  }

  /**
   * 通知剪貼簿內容變化
   */
  private notifyClipboardChange(text: string): void {
    // 可以在這裡添加通知邏輯
    // 例如：顯示系統通知、更新托盤圖示等
    console.log('Clipboard changed:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  }

  /**
   * 讀取當前剪貼簿內容
   */
  readClipboard(): string {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error('Error reading clipboard:', error);
      return '';
    }
  }

  /**
   * 寫入剪貼簿
   */
  writeClipboard(text: string): void {
    try {
      clipboard.writeText(text);

      // 更新最後的剪貼簿內容
      this.lastClipboardContent = {
        text,
        timestamp: new Date(),
        hash: this.hashString(text),
      };
    } catch (error) {
      console.error('Error writing to clipboard:', error);
    }
  }

  /**
   * 清空剪貼簿
   */
  clearClipboard(): void {
    try {
      clipboard.clear();
      this.lastClipboardContent = null;
    } catch (error) {
      console.error('Error clearing clipboard:', error);
    }
  }

  /**
   * 取得最後的剪貼簿內容
   */
  getLastClipboardContent(): ClipboardContent | null {
    return this.lastClipboardContent;
  }

  /**
   * 檢查並填入剪貼簿內容到視窗
   * 用於熱鍵觸發時自動填入剪貼簿內容
   */
  checkAndFillToWindow(targetWindow?: BrowserWindow): void {
    if (!this.settings.enabled) {
      return;
    }

    try {
      const clipboardText = clipboard.readText();

      if (clipboardText && clipboardText.trim().length > 0) {
        console.log('Filling clipboard content to window:', clipboardText.substring(0, 50) + '...');

        // 如果有目標視窗，發送剪貼簿內容
        if (targetWindow && !targetWindow.isDestroyed()) {
          targetWindow.webContents.send('clipboard-content', {
            text: clipboardText,
            autoFocus: this.settings.autoFocus,
          });
        } else {
          // 否則發送到主視窗
          const mainWindow = this.windowManager.getMainWindow();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('clipboard-content', {
              text: clipboardText,
              autoFocus: this.settings.autoFocus,
            });
          }
        }

        // 更新最後的剪貼簿內容
        this.updateLastClipboardContent();
      }
    } catch (error) {
      console.error('Error filling clipboard content:', error);
    }
  }

  /**
   * 更新剪貼簿設定
   */
  updateSettings(newSettings: Partial<ClipboardSettings>): void {
    const oldEnabled = this.settings.enabled;

    this.settings = {
      ...this.settings,
      ...newSettings,
    };

    console.log('Clipboard settings updated:', this.settings);

    // 如果啟用狀態改變，重新啟動或停止監控
    if (oldEnabled !== this.settings.enabled) {
      if (this.settings.enabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }
  }

  /**
   * 取得當前設定
   */
  getSettings(): ClipboardSettings {
    return { ...this.settings };
  }

  /**
   * 檢查是否正在監控
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * 計算字串的簡單 hash
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * 格式化剪貼簿內容
   * 處理常見的格式問題
   */
  formatClipboardText(text: string): string {
    // 移除多餘的空白行
    let formatted = text.replace(/\n{3,}/g, '\n\n');

    // 移除首尾空白
    formatted = formatted.trim();

    return formatted;
  }

  /**
   * 檢測剪貼簿內容類型
   */
  detectContentType(text: string): 'url' | 'code' | 'text' {
    // 檢測 URL
    const urlPattern = /^(https?:\/\/|www\.)/i;
    if (urlPattern.test(text.trim())) {
      return 'url';
    }

    // 檢測程式碼（簡單檢測：包含常見的程式碼符號）
    const codePatterns = [
      /function\s+\w+/,
      /class\s+\w+/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /import\s+.*from/,
      /export\s+(default|const|class|function)/,
      /<\w+.*>/,
      /\{\s*\n.*\n\s*\}/s,
    ];

    for (const pattern of codePatterns) {
      if (pattern.test(text)) {
        return 'code';
      }
    }

    return 'text';
  }

  /**
   * 清理資源
   */
  cleanup(): void {
    this.stopMonitoring();
    this.lastClipboardContent = null;
    console.log('Clipboard manager cleaned up');
  }
}
