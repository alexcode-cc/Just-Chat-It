import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../../../src/renderer/stores/settings';

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // 重置 DOM
    document.documentElement.style.cssText = '';
    document.body.className = '';
  });

  describe('初始狀態', () => {
    it('應該有正確的初始設定', () => {
      const store = useSettingsStore();

      expect(store.settings.theme).toBe('liquidGlassLight');
      expect(store.settings.liquidGlass.enabled).toBe(true);
      expect(store.settings.liquidGlass.intensity).toBe(70);
      expect(store.settings.clipboard.enabled).toBe(true);
      expect(store.settings.showTrayIcon).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(null);
    });
  });

  describe('Getters', () => {
    it('currentTheme 應該返回當前主題', () => {
      const store = useSettingsStore();

      expect(store.currentTheme).toBe('liquidGlassLight');

      store.settings.theme = 'liquidGlassDark';
      expect(store.currentTheme).toBe('liquidGlassDark');
    });

    it('isDarkTheme 應該正確判斷是否為深色主題', () => {
      const store = useSettingsStore();

      expect(store.isDarkTheme).toBe(false);

      store.settings.theme = 'liquidGlassDark';
      expect(store.isDarkTheme).toBe(true);
    });

    it('liquidGlassSettings 應該返回 Liquid Glass 設定', () => {
      const store = useSettingsStore();

      expect(store.liquidGlassSettings).toEqual(store.settings.liquidGlass);
      expect(store.liquidGlassSettings.enabled).toBe(true);
    });

    it('cssVariables 應該計算正確的 CSS 變數', () => {
      const store = useSettingsStore();

      // 預設值測試
      const vars = store.cssVariables;
      expect(vars['--glass-blur']).toBe('24px'); // (80/100) * 30
      expect(vars['--glass-opacity']).toBe('0.10'); // 10/100
      expect(vars['--glass-saturation']).toBe('170%'); // 100 + 70

      // 更改設定後測試
      store.settings.liquidGlass.blurAmount = 50;
      store.settings.liquidGlass.opacity = 20;
      store.settings.liquidGlass.intensity = 30;

      const newVars = store.cssVariables;
      expect(newVars['--glass-blur']).toBe('15px'); // (50/100) * 30
      expect(newVars['--glass-opacity']).toBe('0.20'); // 20/100
      expect(newVars['--glass-saturation']).toBe('130%'); // 100 + 30
    });
  });

  describe('Actions', () => {
    describe('loadSettings', () => {
      it('應該成功載入儲存的設定', async () => {
        const store = useSettingsStore();

        const savedSettings = {
          theme: 'liquidGlassDark',
          liquidGlass: {
            enabled: false,
            intensity: 50,
            opacity: 20,
            blurAmount: 60,
            enableMouseTracking: false,
            enableRipple: false,
            enableScrollEffect: false,
          },
          clipboard: {
            enabled: false,
            autoFocus: false,
          },
        };

        window.electronAPI.loadData = vi.fn().mockResolvedValue([
          { settings: savedSettings },
        ]);

        await store.loadSettings();

        expect(store.settings.theme).toBe('liquidGlassDark');
        expect(store.settings.liquidGlass.enabled).toBe(false);
        expect(store.settings.clipboard.enabled).toBe(false);
        expect(store.loading).toBe(false);
        expect(store.error).toBe(null);
      });

      it('應該使用預設設定當沒有儲存的設定時', async () => {
        const store = useSettingsStore();

        window.electronAPI.loadData = vi.fn().mockResolvedValue([]);

        await store.loadSettings();

        expect(store.settings.theme).toBe('liquidGlassLight');
        expect(store.settings.liquidGlass.enabled).toBe(true);
      });

      it('應該處理載入錯誤', async () => {
        const store = useSettingsStore();

        window.electronAPI.loadData = vi.fn().mockRejectedValue(new Error('Database error'));

        await store.loadSettings();

        expect(store.error).toBe('Database error');
        expect(store.loading).toBe(false);
      });
    });

    describe('saveSettings', () => {
      it('應該成功儲存設定', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.saveSettings();

        expect(window.electronAPI.saveData).toHaveBeenCalledWith(
          'app_settings',
          expect.objectContaining({
            id: 'main',
            settings: store.settings,
          })
        );
        expect(store.loading).toBe(false);
        expect(store.error).toBe(null);
      });

      it('應該處理儲存錯誤', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockRejectedValue(new Error('Save error'));

        await expect(store.saveSettings()).rejects.toThrow();
        expect(store.error).toBe('Save error');
      });
    });

    describe('toggleTheme', () => {
      it('應該切換主題從淺色到深色', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        expect(store.settings.theme).toBe('liquidGlassLight');

        await store.toggleTheme();

        expect(store.settings.theme).toBe('liquidGlassDark');
        expect(document.body.classList.contains('dark-theme')).toBe(true);
      });

      it('應該切換主題從深色到淺色', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        store.settings.theme = 'liquidGlassDark';

        await store.toggleTheme();

        expect(store.settings.theme).toBe('liquidGlassLight');
        expect(document.body.classList.contains('dark-theme')).toBe(false);
      });
    });

    describe('setTheme', () => {
      it('應該設定特定主題', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.setTheme('liquidGlassDark');

        expect(store.settings.theme).toBe('liquidGlassDark');
        expect(document.body.classList.contains('dark-theme')).toBe(true);
      });
    });

    describe('updateLiquidGlassSettings', () => {
      it('應該更新 Liquid Glass 設定', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.updateLiquidGlassSettings({
          enabled: false,
          intensity: 50,
        });

        expect(store.settings.liquidGlass.enabled).toBe(false);
        expect(store.settings.liquidGlass.intensity).toBe(50);
        // 其他設定應該保持不變
        expect(store.settings.liquidGlass.opacity).toBe(10);
      });
    });

    describe('updateHotkeySettings', () => {
      it('應該更新熱鍵設定', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.updateHotkeySettings({
          chatgpt: 'Alt+1',
        });

        expect(store.settings.hotkeys.chatgpt).toBe('Alt+1');
        // 其他熱鍵應該保持不變
        expect(store.settings.hotkeys.claude).toBe('CommandOrControl+Shift+2');
      });
    });

    describe('updateClipboardSettings', () => {
      it('應該更新剪貼簿設定', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.updateClipboardSettings({
          enabled: false,
        });

        expect(store.settings.clipboard.enabled).toBe(false);
        // autoFocus 應該保持不變
        expect(store.settings.clipboard.autoFocus).toBe(true);
      });
    });

    describe('resetSettings', () => {
      it('應該重置設定為預設值', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        // 修改一些設定
        store.settings.theme = 'liquidGlassDark';
        store.settings.liquidGlass.enabled = false;
        store.settings.clipboard.enabled = false;

        await store.resetSettings();

        // 應該恢復為預設值
        expect(store.settings.theme).toBe('liquidGlassLight');
        expect(store.settings.liquidGlass.enabled).toBe(true);
        expect(store.settings.clipboard.enabled).toBe(true);
      });
    });

    describe('applyCSSVariables', () => {
      it('應該應用 CSS 變數到根元素', () => {
        const store = useSettingsStore();

        store.applyCSSVariables();

        const root = document.documentElement;
        expect(root.style.getPropertyValue('--glass-blur')).toBe('24px');
        expect(root.style.getPropertyValue('--glass-opacity')).toBe('0.10');
        expect(root.style.getPropertyValue('--glass-saturation')).toBe('170%');
      });

      it('應該根據主題應用對應的 body class', () => {
        const store = useSettingsStore();

        store.settings.theme = 'liquidGlassLight';
        store.applyCSSVariables();
        expect(document.body.classList.contains('dark-theme')).toBe(false);

        store.settings.theme = 'liquidGlassDark';
        store.applyCSSVariables();
        expect(document.body.classList.contains('dark-theme')).toBe(true);
      });
    });

    describe('exportSettings', () => {
      it('應該匯出設定為 JSON 字串', () => {
        const store = useSettingsStore();

        const exported = store.exportSettings();

        expect(typeof exported).toBe('string');

        const parsed = JSON.parse(exported);
        expect(parsed.theme).toBe(store.settings.theme);
        expect(parsed.liquidGlass).toEqual(store.settings.liquidGlass);
      });
    });

    describe('importSettings', () => {
      it('應該成功匯入有效的設定', async () => {
        const store = useSettingsStore();

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        const importSettings = {
          theme: 'liquidGlassDark',
          liquidGlass: {
            enabled: false,
            intensity: 30,
          },
        };

        await store.importSettings(JSON.stringify(importSettings));

        expect(store.settings.theme).toBe('liquidGlassDark');
        expect(store.settings.liquidGlass.enabled).toBe(false);
        expect(store.settings.liquidGlass.intensity).toBe(30);
      });

      it('應該拒絕無效的 JSON', async () => {
        const store = useSettingsStore();

        await expect(store.importSettings('invalid json')).rejects.toThrow();
        expect(store.error).toContain('匯入設定失敗');
      });

      it('應該拒絕非物件的設定', async () => {
        const store = useSettingsStore();

        await expect(store.importSettings('"string"')).rejects.toThrow('無效的設定格式');
      });
    });
  });
});
