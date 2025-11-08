import { ipcMain, BrowserWindow, clipboard, Notification } from 'electron';
import {
  AIServiceRepository,
  ChatSessionRepository,
  ChatMessageRepository,
  PromptRepository,
  WindowStateRepository,
  HotkeySettingsRepository,
} from './database/repositories';
import { WindowManager } from './window-manager';
import { ClipboardManager } from './system-integration';

// 初始化 Repository 實例
let aiServiceRepo: AIServiceRepository;
let chatSessionRepo: ChatSessionRepository;
let chatMessageRepo: ChatMessageRepository;
let promptRepo: PromptRepository;
let windowStateRepo: WindowStateRepository;
let hotkeySettingsRepo: HotkeySettingsRepository;
let windowManager: WindowManager;
let clipboardManager: ClipboardManager | null = null;

export function setupIpcHandlers(manager?: WindowManager, clipboard?: ClipboardManager) {
  // 初始化 Repository
  aiServiceRepo = new AIServiceRepository();
  chatSessionRepo = new ChatSessionRepository();
  chatMessageRepo = new ChatMessageRepository();
  promptRepo = new PromptRepository();
  windowStateRepo = new WindowStateRepository();
  hotkeySettingsRepo = new HotkeySettingsRepository();

  if (manager) {
    windowManager = manager;
  }

  if (clipboard) {
    clipboardManager = clipboard;
  }

  // 視窗控制
  ipcMain.handle('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.handle('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  ipcMain.handle('window:toggle-fullscreen', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      window.setFullScreen(!window.isFullScreen());
    }
  });

  ipcMain.handle('window:is-maximized', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window?.isMaximized() || false;
  });

  ipcMain.handle('window:is-fullscreen', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window?.isFullScreen() || false;
  });

  ipcMain.handle('window:get-bounds', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window?.getBounds();
  });

  ipcMain.handle(
    'window:set-bounds',
    (event, bounds: { x?: number; y?: number; width?: number; height?: number }) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.setBounds(bounds);
      }
    }
  );

  // 系統整合
  ipcMain.handle('system:read-clipboard', () => {
    return clipboard.readText();
  });

  // 資料庫操作 - saveData
  ipcMain.handle('db:save', async (event, table: string, data: any) => {
    try {
      switch (table) {
        case 'ai_services':
          if (data._delete) {
            return aiServiceRepo.delete(data.id);
          }
          return aiServiceRepo.upsert(data);

        case 'chat_sessions':
          if (data._delete) {
            chatMessageRepo.deleteBySession(data.id);
            return chatSessionRepo.delete(data.id);
          }
          if (data.id) {
            if (data.title) {
              chatSessionRepo.updateTitle(data.id, data.title);
            }
            return chatSessionRepo.findById(data.id);
          }
          return chatSessionRepo.create(data.aiServiceId, data.title);

        case 'chat_messages':
          return chatMessageRepo.create(data.sessionId, data.content, data.isUser, data.metadata);

        case 'prompts':
          if (data._delete) {
            return promptRepo.delete(data.id);
          }
          if (data.id) {
            if (data.isFavorite !== undefined) {
              promptRepo.toggleFavorite(data.id);
            }
            if (data.usageCount !== undefined) {
              promptRepo.incrementUsage(data.id);
            }
            return promptRepo.update(data.id, data);
          }
          return promptRepo.create(data.title, data.content, data.category, data.tags);

        default:
          throw new Error(`Unknown table: ${table}`);
      }
    } catch (error) {
      console.error(`Error saving data to ${table}:`, error);
      throw error;
    }
  });

  // 資料庫操作 - loadData
  ipcMain.handle('db:load', async (event, table: string, query?: any) => {
    try {
      switch (table) {
        case 'ai_services':
          if (query?.id) {
            return aiServiceRepo.findById(query.id);
          }
          if (query?.availableOnly) {
            return aiServiceRepo.findAvailableServices();
          }
          return aiServiceRepo.findAll();

        case 'chat_sessions':
          if (query?.id) {
            return chatSessionRepo.findById(query.id);
          }
          if (query?.aiServiceId) {
            return chatSessionRepo.findByAIService(query.aiServiceId);
          }
          if (query?.activeOnly) {
            return chatSessionRepo.findActiveSessions();
          }
          return chatSessionRepo.findAll();

        case 'chat_messages':
          if (query?.sessionId) {
            return chatMessageRepo.findBySession(query.sessionId, query?.limit);
          }
          if (query?.query) {
            return chatMessageRepo.search(query.query, query?.sessionId);
          }
          return [];

        case 'prompts':
          if (query?.id) {
            return promptRepo.findById(query.id);
          }
          if (query?.category) {
            return promptRepo.findByCategory(query.category);
          }
          if (query?.favoritesOnly) {
            return promptRepo.findFavorites();
          }
          if (query?.query) {
            return promptRepo.search(query.query);
          }
          if (query?.recentOnly) {
            return promptRepo.findRecentlyUsed(query.limit || 10);
          }
          return promptRepo.findAll();

        default:
          throw new Error(`Unknown table: ${table}`);
      }
    } catch (error) {
      console.error(`Error loading data from ${table}:`, error);
      throw error;
    }
  });

  // AI 服務 - 建立聊天視窗
  ipcMain.handle('ai:create-chat-window', async (event, serviceId: string) => {
    try {
      if (!windowManager) {
        throw new Error('WindowManager not initialized');
      }

      // 檢查視窗是否已存在
      const existingWindow = windowManager.getChatWindow(serviceId);
      if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.focus();
        return { success: true, existed: true };
      }

      // 建立新的聊天視窗
      const chatWindow = windowManager.createChatWindow(serviceId);

      // 載入 AI 服務網址
      const service = aiServiceRepo.findById(serviceId);
      if (service) {
        await chatWindow.loadURL(service.webUrl);
        aiServiceRepo.updateLastUsed(serviceId);
      }

      return { success: true, existed: false };
    } catch (error) {
      console.error(`Error creating chat window for service ${serviceId}:`, error);
      throw error;
    }
  });

  // 視窗狀態管理
  ipcMain.handle('window-state:get', async (event, windowId: string) => {
    try {
      return windowStateRepo.findById(windowId);
    } catch (error) {
      console.error(`Error getting window state for ${windowId}:`, error);
      return null;
    }
  });

  ipcMain.handle('window-state:save', async (event, windowId: string, state: any) => {
    try {
      windowStateRepo.upsert({ id: windowId, ...state });
      return { success: true };
    } catch (error) {
      console.error(`Error saving window state for ${windowId}:`, error);
      throw error;
    }
  });

  ipcMain.handle('window-state:get-main', async () => {
    try {
      return windowStateRepo.getMainWindowState();
    } catch (error) {
      console.error('Error getting main window state:', error);
      return null;
    }
  });

  ipcMain.handle('window-state:get-all-chat', async () => {
    try {
      return windowStateRepo.getAllChatWindowStates();
    } catch (error) {
      console.error('Error getting chat window states:', error);
      return [];
    }
  });

  // 熱鍵設定管理
  ipcMain.handle('hotkey:get-all', async () => {
    try {
      return hotkeySettingsRepo.findAll();
    } catch (error) {
      console.error('Error getting all hotkeys:', error);
      return [];
    }
  });

  ipcMain.handle('hotkey:get-enabled', async () => {
    try {
      return hotkeySettingsRepo.findEnabled();
    } catch (error) {
      console.error('Error getting enabled hotkeys:', error);
      return [];
    }
  });

  ipcMain.handle('hotkey:get-by-category', async (event, category: string) => {
    try {
      return hotkeySettingsRepo.findByCategory(category);
    } catch (error) {
      console.error(`Error getting hotkeys for category ${category}:`, error);
      return [];
    }
  });

  ipcMain.handle('hotkey:get-by-id', async (event, id: string) => {
    try {
      return hotkeySettingsRepo.findById(id);
    } catch (error) {
      console.error(`Error getting hotkey ${id}:`, error);
      return null;
    }
  });

  ipcMain.handle('hotkey:update', async (event, id: string, data: any) => {
    try {
      return hotkeySettingsRepo.update(id, data);
    } catch (error) {
      console.error(`Error updating hotkey ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('hotkey:update-accelerator', async (event, id: string, accelerator: string) => {
    try {
      return hotkeySettingsRepo.updateAccelerator(id, accelerator);
    } catch (error) {
      console.error(`Error updating accelerator for hotkey ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('hotkey:toggle-enabled', async (event, id: string) => {
    try {
      return hotkeySettingsRepo.toggleEnabled(id);
    } catch (error) {
      console.error(`Error toggling hotkey ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle(
    'hotkey:check-conflict',
    async (event, accelerator: string, excludeId?: string) => {
      try {
        return hotkeySettingsRepo.isAcceleratorUsed(accelerator, excludeId);
      } catch (error) {
        console.error('Error checking hotkey conflict:', error);
        return false;
      }
    }
  );

  ipcMain.handle('hotkey:batch-update', async (event, settings: any[]) => {
    try {
      hotkeySettingsRepo.batchUpdate(settings);
      return { success: true };
    } catch (error) {
      console.error('Error batch updating hotkeys:', error);
      throw error;
    }
  });

  ipcMain.handle('hotkey:reset-defaults', async () => {
    try {
      // 這裡需要從 init-data.ts 重新載入預設設定
      // 暫時返回成功，後續可以改進
      return { success: true };
    } catch (error) {
      console.error('Error resetting hotkeys to defaults:', error);
      throw error;
    }
  });

  // 系統通知
  ipcMain.handle(
    'notification:show',
    async (event, options: { title: string; body: string; icon?: string }) => {
      try {
        const notification = new Notification({
          title: options.title,
          body: options.body,
          icon: options.icon,
        });

        notification.show();

        return { success: true };
      } catch (error) {
        console.error('Error showing notification:', error);
        throw error;
      }
    }
  );

  // 剪貼簿管理
  ipcMain.handle('clipboard:get-settings', async () => {
    try {
      if (!clipboardManager) {
        return { enabled: true, autoFocus: true };
      }
      return clipboardManager.getSettings();
    } catch (error) {
      console.error('Error getting clipboard settings:', error);
      throw error;
    }
  });

  ipcMain.handle('clipboard:update-settings', async (event, settings: any) => {
    try {
      if (!clipboardManager) {
        throw new Error('ClipboardManager not initialized');
      }
      clipboardManager.updateSettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Error updating clipboard settings:', error);
      throw error;
    }
  });

  ipcMain.handle('clipboard:read', async () => {
    try {
      if (!clipboardManager) {
        return clipboard.readText();
      }
      return clipboardManager.readClipboard();
    } catch (error) {
      console.error('Error reading clipboard:', error);
      throw error;
    }
  });

  ipcMain.handle('clipboard:write', async (event, text: string) => {
    try {
      if (!clipboardManager) {
        clipboard.writeText(text);
        return { success: true };
      }
      clipboardManager.writeClipboard(text);
      return { success: true };
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      throw error;
    }
  });

  ipcMain.handle('clipboard:clear', async () => {
    try {
      if (!clipboardManager) {
        clipboard.clear();
        return { success: true };
      }
      clipboardManager.clearClipboard();
      return { success: true };
    } catch (error) {
      console.error('Error clearing clipboard:', error);
      throw error;
    }
  });

  ipcMain.handle('clipboard:get-last-content', async () => {
    try {
      if (!clipboardManager) {
        return null;
      }
      return clipboardManager.getLastClipboardContent();
    } catch (error) {
      console.error('Error getting last clipboard content:', error);
      return null;
    }
  });

  ipcMain.handle('clipboard:is-monitoring', async () => {
    try {
      if (!clipboardManager) {
        return false;
      }
      return clipboardManager.isActive();
    } catch (error) {
      console.error('Error checking clipboard monitoring status:', error);
      return false;
    }
  });

  console.log('IPC handlers setup completed');
}
