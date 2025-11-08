/**
 * Settings Store
 * 管理應用程式設定，包括主題、Liquid Glass效果、熱鍵等
 */

import { defineStore } from 'pinia';

export interface LiquidGlassSettings {
  // 是否啟用 Liquid Glass 效果
  enabled: boolean;
  // 效果強度 (0-100)
  intensity: number;
  // 透明度 (0-100)
  opacity: number;
  // 模糊程度 (0-100)
  blurAmount: number;
  // 是否啟用滑鼠追蹤光影
  enableMouseTracking: boolean;
  // 是否啟用波紋效果
  enableRipple: boolean;
  // 是否啟用捲動光影
  enableScrollEffect: boolean;
}

export interface HotkeySettings {
  // 主面板熱鍵
  mainPanel: string;
  // AI 服務熱鍵
  chatgpt: string;
  claude: string;
  gemini: string;
  perplexity: string;
  grok: string;
  copilot: string;
}

export interface ClipboardSettings {
  // 是否啟用剪貼簿檢查
  enabled: boolean;
  // 是否自動聚焦輸入框
  autoFocus: boolean;
}

export interface AppSettings {
  // 主題
  theme: 'liquidGlassLight' | 'liquidGlassDark';
  // Liquid Glass 設定
  liquidGlass: LiquidGlassSettings;
  // 熱鍵設定
  hotkeys: HotkeySettings;
  // 剪貼簿設定
  clipboard: ClipboardSettings;
  // 視窗設定
  windowAlwaysOnTop: boolean;
  windowTransparent: boolean;
  // 語言
  language: 'zh-TW' | 'zh-CN' | 'en-US';
  // 是否顯示系統托盤
  showTrayIcon: boolean;
  // 關閉視窗時最小化到托盤
  minimizeToTray: boolean;
}

// 預設設定
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'liquidGlassLight',
  liquidGlass: {
    enabled: true,
    intensity: 70,
    opacity: 10,
    blurAmount: 80,
    enableMouseTracking: true,
    enableRipple: true,
    enableScrollEffect: true,
  },
  hotkeys: {
    mainPanel: 'CommandOrControl+Shift+Space',
    chatgpt: 'CommandOrControl+Shift+1',
    claude: 'CommandOrControl+Shift+2',
    gemini: 'CommandOrControl+Shift+3',
    perplexity: 'CommandOrControl+Shift+4',
    grok: 'CommandOrControl+Shift+5',
    copilot: 'CommandOrControl+Shift+6',
  },
  clipboard: {
    enabled: true,
    autoFocus: true,
  },
  windowAlwaysOnTop: false,
  windowTransparent: true,
  language: 'zh-TW',
  showTrayIcon: true,
  minimizeToTray: true,
};

export const useSettingsStore = defineStore('settings', {
  state: (): { settings: AppSettings; loading: boolean; error: string | null } => ({
    settings: { ...DEFAULT_SETTINGS },
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * 獲取當前主題
     */
    currentTheme: (state): 'liquidGlassLight' | 'liquidGlassDark' => state.settings.theme,

    /**
     * 是否為深色主題
     */
    isDarkTheme: (state): boolean => state.settings.theme === 'liquidGlassDark',

    /**
     * 獲取 Liquid Glass 設定
     */
    liquidGlassSettings: (state): LiquidGlassSettings => state.settings.liquidGlass,

    /**
     * 獲取熱鍵設定
     */
    hotkeySettings: (state): HotkeySettings => state.settings.hotkeys,

    /**
     * 獲取剪貼簿設定
     */
    clipboardSettings: (state): ClipboardSettings => state.settings.clipboard,

    /**
     * 計算 CSS 變數值
     */
    cssVariables: (state) => {
      const { liquidGlass } = state.settings;
      return {
        '--glass-blur': `${(liquidGlass.blurAmount / 100) * 30}px`,
        '--glass-opacity': (liquidGlass.opacity / 100).toFixed(2),
        '--glass-saturation': `${100 + liquidGlass.intensity}%`,
      };
    },
  },

  actions: {
    /**
     * 載入設定
     */
    async loadSettings(): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        // 從資料庫載入設定
        const savedSettings = await window.electronAPI.loadData('app_settings');

        if (savedSettings && savedSettings.length > 0) {
          // 合併儲存的設定與預設設定（確保新增的設定項目有預設值）
          this.settings = {
            ...DEFAULT_SETTINGS,
            ...savedSettings[0].settings,
          };
        } else {
          // 使用預設設定
          this.settings = { ...DEFAULT_SETTINGS };
        }

        // 應用 CSS 變數
        this.applyCSSVariables();
      } catch (error) {
        this.error = error instanceof Error ? error.message : '載入設定失敗';
        console.error('Failed to load settings:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 儲存設定
     */
    async saveSettings(): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        await window.electronAPI.saveData('app_settings', {
          id: 'main',
          settings: this.settings,
          updatedAt: new Date(),
        });

        // 應用 CSS 變數
        this.applyCSSVariables();
      } catch (error) {
        this.error = error instanceof Error ? error.message : '儲存設定失敗';
        console.error('Failed to save settings:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 切換主題
     */
    async toggleTheme(): Promise<void> {
      this.settings.theme =
        this.settings.theme === 'liquidGlassLight' ? 'liquidGlassDark' : 'liquidGlassLight';

      // 更新 body class
      document.body.classList.toggle('dark-theme', this.isDarkTheme);

      await this.saveSettings();
    },

    /**
     * 設定主題
     */
    async setTheme(theme: 'liquidGlassLight' | 'liquidGlassDark'): Promise<void> {
      this.settings.theme = theme;

      // 更新 body class
      document.body.classList.toggle('dark-theme', this.isDarkTheme);

      await this.saveSettings();
    },

    /**
     * 更新 Liquid Glass 設定
     */
    async updateLiquidGlassSettings(settings: Partial<LiquidGlassSettings>): Promise<void> {
      this.settings.liquidGlass = {
        ...this.settings.liquidGlass,
        ...settings,
      };

      await this.saveSettings();
    },

    /**
     * 更新熱鍵設定
     */
    async updateHotkeySettings(settings: Partial<HotkeySettings>): Promise<void> {
      this.settings.hotkeys = {
        ...this.settings.hotkeys,
        ...settings,
      };

      await this.saveSettings();
    },

    /**
     * 更新剪貼簿設定
     */
    async updateClipboardSettings(settings: Partial<ClipboardSettings>): Promise<void> {
      this.settings.clipboard = {
        ...this.settings.clipboard,
        ...settings,
      };

      await this.saveSettings();
    },

    /**
     * 重置設定為預設值
     */
    async resetSettings(): Promise<void> {
      this.settings = { ...DEFAULT_SETTINGS };
      await this.saveSettings();
    },

    /**
     * 應用 CSS 變數到根元素
     */
    applyCSSVariables(): void {
      const root = document.documentElement;
      const vars = this.cssVariables;

      Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value.toString());
      });

      // 應用主題 class
      document.body.classList.toggle('dark-theme', this.isDarkTheme);
    },

    /**
     * 匯出設定
     */
    exportSettings(): string {
      return JSON.stringify(this.settings, null, 2);
    },

    /**
     * 匯入設定
     */
    async importSettings(jsonString: string): Promise<void> {
      try {
        const importedSettings = JSON.parse(jsonString);

        // 驗證設定格式
        if (typeof importedSettings !== 'object') {
          throw new Error('無效的設定格式');
        }

        this.settings = {
          ...DEFAULT_SETTINGS,
          ...importedSettings,
        };

        await this.saveSettings();
      } catch (error) {
        this.error = error instanceof Error ? error.message : '匯入設定失敗';
        throw error;
      }
    },
  },
});
