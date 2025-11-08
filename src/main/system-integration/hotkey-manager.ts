import { globalShortcut, app } from 'electron';
import { WindowManager } from '../window-manager';
import { AIServiceRepository } from '../database/repositories';
import { ClipboardManager } from './clipboard-manager';

/**
 * 熱鍵配置介面
 */
export interface HotkeyConfig {
  id: string;
  accelerator: string;
  description: string;
  action: () => void;
  enabled: boolean;
}

/**
 * 預設熱鍵配置
 */
export interface DefaultHotkeys {
  showMainPanel: string;
  chatgpt: string;
  claude: string;
  gemini: string;
  perplexity: string;
  grok: string;
  copilot: string;
}

/**
 * 全域熱鍵管理器
 * 負責註冊和管理應用程式的全域快捷鍵
 */
export class HotkeyManager {
  private windowManager: WindowManager;
  private aiServiceRepo: AIServiceRepository;
  private clipboardManager: ClipboardManager | null;
  private registeredHotkeys: Map<string, HotkeyConfig> = new Map();
  private defaultHotkeys: DefaultHotkeys;

  constructor(windowManager: WindowManager, clipboardManager?: ClipboardManager) {
    this.windowManager = windowManager;
    this.aiServiceRepo = new AIServiceRepository();
    this.clipboardManager = clipboardManager || null;

    // 預設熱鍵配置
    this.defaultHotkeys = {
      showMainPanel: 'CommandOrControl+Shift+Space',
      chatgpt: 'CommandOrControl+Shift+1',
      claude: 'CommandOrControl+Shift+2',
      gemini: 'CommandOrControl+Shift+3',
      perplexity: 'CommandOrControl+Shift+4',
      grok: 'CommandOrControl+Shift+5',
      copilot: 'CommandOrControl+Shift+6',
    };
  }

  /**
   * 初始化並註冊所有熱鍵
   */
  initialize(customHotkeys?: Partial<DefaultHotkeys>): void {
    // 合併自訂熱鍵
    const hotkeys = { ...this.defaultHotkeys, ...customHotkeys };

    // 註冊主面板熱鍵
    this.registerHotkey({
      id: 'show-main-panel',
      accelerator: hotkeys.showMainPanel,
      description: '顯示主控制面板',
      action: () => this.showMainPanel(),
      enabled: true,
    });

    // 註冊各 AI 服務熱鍵
    const serviceHotkeyMap: Record<string, keyof DefaultHotkeys> = {
      chatgpt: 'chatgpt',
      claude: 'claude',
      gemini: 'gemini',
      perplexity: 'perplexity',
      grok: 'grok',
      copilot: 'copilot',
    };

    Object.entries(serviceHotkeyMap).forEach(([serviceId, hotkeyKey]) => {
      const accelerator = hotkeys[hotkeyKey];
      if (accelerator) {
        this.registerHotkey({
          id: `open-${serviceId}`,
          accelerator,
          description: `開啟 ${serviceId.toUpperCase()} 聊天視窗`,
          action: () => this.openChatWindow(serviceId),
          enabled: true,
        });
      }
    });

    console.log(`Registered ${this.registeredHotkeys.size} global hotkeys`);
  }

  /**
   * 註冊單一熱鍵
   */
  registerHotkey(config: HotkeyConfig): boolean {
    try {
      // 檢查熱鍵是否已被使用
      if (this.isHotkeyRegistered(config.accelerator)) {
        console.warn(`Hotkey ${config.accelerator} is already registered`);
        return false;
      }

      // 檢查衝突
      const conflict = this.checkConflict(config.accelerator);
      if (conflict) {
        console.warn(`Hotkey ${config.accelerator} conflicts with ${conflict.id}`);
        return false;
      }

      // 註冊全域快捷鍵
      const success = globalShortcut.register(config.accelerator, () => {
        if (config.enabled) {
          console.log(`Hotkey triggered: ${config.id} (${config.accelerator})`);
          config.action();
        }
      });

      if (success) {
        this.registeredHotkeys.set(config.id, config);
        console.log(`Hotkey registered: ${config.id} -> ${config.accelerator}`);
        return true;
      } else {
        console.error(`Failed to register hotkey: ${config.accelerator}`);
        return false;
      }
    } catch (error) {
      console.error(`Error registering hotkey ${config.id}:`, error);
      return false;
    }
  }

  /**
   * 取消註冊熱鍵
   */
  unregisterHotkey(id: string): boolean {
    const config = this.registeredHotkeys.get(id);

    if (!config) {
      console.warn(`Hotkey ${id} not found`);
      return false;
    }

    try {
      globalShortcut.unregister(config.accelerator);
      this.registeredHotkeys.delete(id);
      console.log(`Hotkey unregistered: ${id} (${config.accelerator})`);
      return true;
    } catch (error) {
      console.error(`Error unregistering hotkey ${id}:`, error);
      return false;
    }
  }

  /**
   * 更新熱鍵
   */
  updateHotkey(id: string, newAccelerator: string): boolean {
    const config = this.registeredHotkeys.get(id);

    if (!config) {
      console.warn(`Hotkey ${id} not found`);
      return false;
    }

    // 先取消註冊舊的
    this.unregisterHotkey(id);

    // 註冊新的
    const newConfig = { ...config, accelerator: newAccelerator };
    return this.registerHotkey(newConfig);
  }

  /**
   * 啟用/停用熱鍵
   */
  toggleHotkey(id: string, enabled: boolean): boolean {
    const config = this.registeredHotkeys.get(id);

    if (!config) {
      console.warn(`Hotkey ${id} not found`);
      return false;
    }

    config.enabled = enabled;
    console.log(`Hotkey ${id} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * 檢查熱鍵是否已註冊
   */
  private isHotkeyRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * 檢查熱鍵衝突
   */
  checkConflict(accelerator: string): HotkeyConfig | null {
    for (const [id, config] of this.registeredHotkeys) {
      if (config.accelerator === accelerator) {
        return config;
      }
    }
    return null;
  }

  /**
   * 驗證熱鍵格式
   */
  validateAccelerator(accelerator: string): boolean {
    try {
      // Electron 會驗證熱鍵格式
      // 這裡只做基本檢查
      const parts = accelerator.split('+');
      return parts.length >= 1 && parts.length <= 4;
    } catch (error) {
      return false;
    }
  }

  /**
   * 取得所有已註冊的熱鍵
   */
  getAllHotkeys(): HotkeyConfig[] {
    return Array.from(this.registeredHotkeys.values());
  }

  /**
   * 取得特定熱鍵配置
   */
  getHotkey(id: string): HotkeyConfig | undefined {
    return this.registeredHotkeys.get(id);
  }

  /**
   * 顯示主面板
   */
  private showMainPanel(): void {
    const mainWindow = this.windowManager.getMainWindow();

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();

      // 檢查剪貼簿內容（如果啟用）
      if (this.clipboardManager) {
        this.clipboardManager.checkAndFillToWindow(mainWindow);
      }
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

      // 檢查剪貼簿內容（如果啟用）
      if (this.clipboardManager) {
        this.clipboardManager.checkAndFillToWindow(chatWindow);
      }
    } catch (error) {
      console.error(`Failed to open chat window for ${serviceId}:`, error);
    }
  }

  /**
   * 取消註冊所有熱鍵
   */
  unregisterAll(): void {
    try {
      globalShortcut.unregisterAll();
      this.registeredHotkeys.clear();
      console.log('All hotkeys unregistered');
    } catch (error) {
      console.error('Error unregistering all hotkeys:', error);
    }
  }

  /**
   * 清理資源
   */
  cleanup(): void {
    this.unregisterAll();
  }
}
