import { ipcMain, BrowserWindow, clipboard, Notification } from 'electron';
import {
  AIServiceRepository,
  ChatSessionRepository,
  ChatMessageRepository,
  PromptRepository,
  WindowStateRepository,
  HotkeySettingsRepository,
  QuotaRepository,
} from './database/repositories';
import { WindowManager } from './window-manager';
import { ClipboardManager, NotificationManager } from './system-integration';
import { contentCaptureManager } from './services/content-capture-manager';

// 初始化 Repository 實例
let aiServiceRepo: AIServiceRepository;
let chatSessionRepo: ChatSessionRepository;
let chatMessageRepo: ChatMessageRepository;
let promptRepo: PromptRepository;
let windowStateRepo: WindowStateRepository;
let hotkeySettingsRepo: HotkeySettingsRepository;
let quotaRepo: QuotaRepository;
let windowManager: WindowManager;
let clipboardManager: ClipboardManager | null = null;
let notificationManager: NotificationManager | null = null;

export function setupIpcHandlers(
  manager?: WindowManager,
  clipboardMgr?: ClipboardManager,
  notificationMgr?: NotificationManager,
) {
  // 初始化 Repository
  aiServiceRepo = new AIServiceRepository();
  chatSessionRepo = new ChatSessionRepository();
  chatMessageRepo = new ChatMessageRepository();
  promptRepo = new PromptRepository();
  windowStateRepo = new WindowStateRepository();
  hotkeySettingsRepo = new HotkeySettingsRepository();
  quotaRepo = new QuotaRepository();

  if (manager) {
    windowManager = manager;
  }

  if (clipboardMgr) {
    clipboardManager = clipboardMgr;
  }

  if (notificationMgr) {
    notificationManager = notificationMgr;
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
          return chatSessionRepo.createSession(data.aiServiceId, data.title);

        case 'chat_messages':
          return chatMessageRepo.createMessage(data.sessionId, data.content, data.isUser, data.metadata);

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
            return promptRepo.updatePrompt(data.id, data);
          }
          return promptRepo.createPrompt(data.title, data.content, data.category, data.tags);

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

  // 額度追蹤管理
  ipcMain.handle('quota:get-by-service', async (event, aiServiceId: string) => {
    try {
      return quotaRepo.getByAIServiceId(aiServiceId);
    } catch (error) {
      console.error('Error getting quota by service:', error);
      throw error;
    }
  });

  ipcMain.handle('quota:get-all', async () => {
    try {
      return quotaRepo.findAll();
    } catch (error) {
      console.error('Error getting all quotas:', error);
      throw error;
    }
  });

  ipcMain.handle('quota:mark-depleted', async (event, data: {
    aiServiceId: string;
    resetTime?: string;
    notes?: string;
  }) => {
    try {
      const resetDate = data.resetTime ? new Date(data.resetTime) : undefined;
      return quotaRepo.markAsDepleted(data.aiServiceId, resetDate, data.notes);
    } catch (error) {
      console.error('Error marking quota as depleted:', error);
      throw error;
    }
  });

  ipcMain.handle('quota:mark-available', async (event, data: {
    aiServiceId: string;
    resetTime?: string;
  }) => {
    try {
      const resetDate = data.resetTime ? new Date(data.resetTime) : undefined;
      return quotaRepo.markAsAvailable(data.aiServiceId, resetDate);
    } catch (error) {
      console.error('Error marking quota as available:', error);
      throw error;
    }
  });

  ipcMain.handle('quota:update-reset-time', async (event, data: {
    aiServiceId: string;
    resetTime: string;
  }) => {
    try {
      return quotaRepo.updateResetTime(data.aiServiceId, new Date(data.resetTime));
    } catch (error) {
      console.error('Error updating quota reset time:', error);
      throw error;
    }
  });

  ipcMain.handle('quota:update-notify-settings', async (event, data: {
    aiServiceId: string;
    notifyEnabled: boolean;
    notifyBeforeMinutes?: number;
  }) => {
    try {
      return quotaRepo.updateNotifySettings(
        data.aiServiceId,
        data.notifyEnabled,
        data.notifyBeforeMinutes,
      );
    } catch (error) {
      console.error('Error updating quota notify settings:', error);
      throw error;
    }
  });

  ipcMain.handle('quota:get-depleted', async () => {
    try {
      return quotaRepo.getDepletedQuotas();
    } catch (error) {
      console.error('Error getting depleted quotas:', error);
      throw error;
    }
  });

  ipcMain.handle('quota:trigger-check', async () => {
    try {
      if (notificationManager) {
        notificationManager.triggerQuotaCheck();
        return { success: true };
      }
      return { success: false, error: 'NotificationManager not initialized' };
    } catch (error) {
      console.error('Error triggering quota check:', error);
      throw error;
    }
  });

  // ===== 內容擷取相關 =====

  /**
   * 開始內容擷取
   */
  ipcMain.handle(
    'content:start-capture',
    async (
      event,
      data: {
        windowId: string;
        aiServiceId: string;
        sessionId: string;
        intervalMs?: number;
      }
    ) => {
      try {
        contentCaptureManager.startCapture(
          data.windowId,
          data.aiServiceId,
          data.sessionId,
          data.intervalMs
        );
        return { success: true };
      } catch (error) {
        console.error('Error starting content capture:', error);
        throw error;
      }
    }
  );

  /**
   * 停止內容擷取
   */
  ipcMain.handle('content:stop-capture', async (event, windowId: string) => {
    try {
      contentCaptureManager.stopCapture(windowId);
      return { success: true };
    } catch (error) {
      console.error('Error stopping content capture:', error);
      throw error;
    }
  });

  /**
   * 手動擷取快照
   */
  ipcMain.handle(
    'content:capture-snapshot',
    async (
      event,
      data: {
        windowId: string;
        aiServiceId: string;
        sessionId: string;
      }
    ) => {
      try {
        const messages = await contentCaptureManager.captureSingleSnapshot(
          data.windowId,
          data.aiServiceId,
          data.sessionId
        );
        return { success: true, messages };
      } catch (error) {
        console.error('Error capturing snapshot:', error);
        throw error;
      }
    }
  );

  /**
   * 匯出會話歷史（Markdown 格式）
   */
  ipcMain.handle('history:export-markdown', async (event, sessionId: string) => {
    try {
      const session = chatSessionRepo.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const messages = chatMessageRepo.findBySession(sessionId);
      const aiService = aiServiceRepo.findById(session.aiServiceId);

      // 建立 Markdown 內容
      let markdown = `# ${session.title}\n\n`;
      markdown += `**AI 服務**: ${aiService?.displayName || session.aiServiceId}\n`;
      markdown += `**建立時間**: ${session.createdAt.toLocaleString('zh-TW')}\n`;
      markdown += `**最後更新**: ${session.updatedAt.toLocaleString('zh-TW')}\n`;
      markdown += `**訊息數量**: ${messages.length}\n\n`;
      markdown += `---\n\n`;

      messages.forEach((msg) => {
        const role = msg.isUser ? '👤 使用者' : '🤖 助手';
        const time = new Date(msg.timestamp).toLocaleString('zh-TW');

        markdown += `## ${role} (${time})\n\n`;
        markdown += `${msg.content}\n\n`;
        markdown += `---\n\n`;
      });

      return { success: true, markdown, filename: `${session.title}-${Date.now()}.md` };
    } catch (error) {
      console.error('Error exporting to markdown:', error);
      throw error;
    }
  });

  /**
   * 匯出會話歷史（JSON 格式）
   */
  ipcMain.handle('history:export-json', async (event, sessionId: string) => {
    try {
      const session = chatSessionRepo.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const messages = chatMessageRepo.findBySession(sessionId);
      const aiService = aiServiceRepo.findById(session.aiServiceId);

      const exportData = {
        session: {
          id: session.id,
          title: session.title,
          aiService: aiService?.displayName || session.aiServiceId,
          aiServiceId: session.aiServiceId,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        messages: messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          isUser: msg.isUser,
          role: msg.isUser ? 'user' : 'assistant',
          metadata: msg.metadata,
        })),
        exportedAt: new Date(),
      };

      const json = JSON.stringify(exportData, null, 2);
      return { success: true, json, filename: `${session.title}-${Date.now()}.json` };
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw error;
    }
  });

  /**
   * 搜尋歷史訊息（進階搜尋）
   */
  ipcMain.handle(
    'history:search',
    async (
      event,
      query: {
        searchText?: string;
        aiServiceId?: string;
        sessionId?: string;
        dateFrom?: string;
        dateTo?: string;
        isUser?: boolean;
      }
    ) => {
      try {
        let messages = query.sessionId
          ? chatMessageRepo.findBySession(query.sessionId)
          : chatMessageRepo.findAll();

        // 應用篩選條件
        if (query.searchText) {
          const searchLower = query.searchText.toLowerCase();
          messages = messages.filter((msg) => msg.content.toLowerCase().includes(searchLower));
        }

        if (query.aiServiceId) {
          const sessions = chatSessionRepo.findByAIService(query.aiServiceId);
          const sessionIds = new Set(sessions.map((s) => s.id));
          messages = messages.filter((msg) => sessionIds.has(msg.sessionId));
        }

        if (query.dateFrom) {
          const fromDate = new Date(query.dateFrom);
          messages = messages.filter((msg) => new Date(msg.timestamp) >= fromDate);
        }

        if (query.dateTo) {
          const toDate = new Date(query.dateTo);
          messages = messages.filter((msg) => new Date(msg.timestamp) <= toDate);
        }

        if (query.isUser !== undefined) {
          messages = messages.filter((msg) => msg.isUser === query.isUser);
        }

        // 限制結果數量
        const limitedMessages = messages.slice(0, 200);

        return { success: true, messages: limitedMessages, total: messages.length };
      } catch (error) {
        console.error('Error searching history:', error);
        throw error;
      }
    }
  );

  /**
   * 取得會話統計
   */
  ipcMain.handle('history:get-stats', async (event, sessionId?: string) => {
    try {
      let sessions: any[];
      let totalMessages = 0;

      if (sessionId) {
        const session = chatSessionRepo.findById(sessionId);
        sessions = session ? [session] : [];
        totalMessages = chatMessageRepo.countBySession(sessionId);
      } else {
        sessions = chatSessionRepo.findAll();
        const allMessages = chatMessageRepo.findAll();
        totalMessages = allMessages.length;
      }

      const stats = {
        totalSessions: sessions.length,
        totalMessages,
        activeSessions: sessions.filter((s: any) => s.isActive).length,
        byAIService: {} as Record<string, { sessions: number; messages: number }>,
      };

      // 按 AI 服務統計
      for (const session of sessions) {
        const aiServiceId = (session as any).aiServiceId;
        if (!stats.byAIService[aiServiceId]) {
          stats.byAIService[aiServiceId] = { sessions: 0, messages: 0 };
        }
        stats.byAIService[aiServiceId].sessions++;
        stats.byAIService[aiServiceId].messages += chatMessageRepo.countBySession(
          (session as any).id
        );
      }

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting history stats:', error);
      throw error;
    }
  });

  console.log('IPC handlers setup completed');
}
