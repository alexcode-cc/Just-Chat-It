import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 剪貼簿內容介面
 */
export interface ClipboardContentData {
  text: string;
  autoFocus: boolean;
}

/**
 * 剪貼簿設定介面
 */
export interface ClipboardSettings {
  enabled: boolean;
  autoFocus: boolean;
}

/**
 * 剪貼簿 Composable
 * 處理剪貼簿相關的功能，包括接收剪貼簿內容、自動填入等
 */
export function useClipboard() {
  const clipboardContent = ref<string>('');
  const settings = ref<ClipboardSettings>({
    enabled: true,
    autoFocus: true,
  });
  const isMonitoring = ref(false);

  /**
   * 讀取剪貼簿內容
   */
  const readClipboard = async (): Promise<string> => {
    try {
      const text = await window.electronAPI.readClipboard();
      clipboardContent.value = text;
      return text;
    } catch (error) {
      console.error('Error reading clipboard:', error);
      return '';
    }
  };

  /**
   * 寫入剪貼簿
   */
  const writeClipboard = async (text: string): Promise<void> => {
    try {
      await window.electronAPI.writeClipboard(text);
      clipboardContent.value = text;
    } catch (error) {
      console.error('Error writing to clipboard:', error);
    }
  };

  /**
   * 清空剪貼簿
   */
  const clearClipboard = async (): Promise<void> => {
    try {
      await window.electronAPI.clearClipboard();
      clipboardContent.value = '';
    } catch (error) {
      console.error('Error clearing clipboard:', error);
    }
  };

  /**
   * 取得最後的剪貼簿內容
   */
  const getLastContent = async () => {
    try {
      return await window.electronAPI.getLastClipboardContent();
    } catch (error) {
      console.error('Error getting last clipboard content:', error);
      return null;
    }
  };

  /**
   * 載入剪貼簿設定
   */
  const loadSettings = async (): Promise<void> => {
    try {
      const savedSettings = await window.electronAPI.getClipboardSettings();
      if (savedSettings) {
        settings.value = savedSettings;
      }
    } catch (error) {
      console.error('Error loading clipboard settings:', error);
    }
  };

  /**
   * 更新剪貼簿設定
   */
  const updateSettings = async (newSettings: Partial<ClipboardSettings>): Promise<void> => {
    try {
      settings.value = {
        ...settings.value,
        ...newSettings,
      };
      await window.electronAPI.updateClipboardSettings(settings.value);
    } catch (error) {
      console.error('Error updating clipboard settings:', error);
    }
  };

  /**
   * 檢查是否正在監控剪貼簿
   */
  const checkMonitoringStatus = async (): Promise<void> => {
    try {
      isMonitoring.value = await window.electronAPI.isClipboardMonitoring();
    } catch (error) {
      console.error('Error checking monitoring status:', error);
    }
  };

  /**
   * 設定剪貼簿內容監聽器
   * 當主程序發送剪貼簿內容時觸發
   */
  const setupClipboardListener = (callback: (data: ClipboardContentData) => void) => {
    window.electronAPI.onClipboardContent((content) => {
      // 檢查 content 的類型
      if (typeof content === 'string') {
        // 舊格式：只有文字
        callback({
          text: content,
          autoFocus: settings.value.autoFocus,
        });
      } else if (content && typeof content === 'object') {
        // 新格式：包含 text 和 autoFocus
        callback(content as ClipboardContentData);
      }
    });
  };

  // 初始化
  onMounted(async () => {
    await loadSettings();
    await checkMonitoringStatus();
  });

  return {
    clipboardContent,
    settings,
    isMonitoring,
    readClipboard,
    writeClipboard,
    clearClipboard,
    getLastContent,
    loadSettings,
    updateSettings,
    checkMonitoringStatus,
    setupClipboardListener,
  };
}
