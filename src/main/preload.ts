import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // 視窗控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  getWindowBounds: () => ipcRenderer.invoke('window:get-bounds'),
  setWindowBounds: (bounds: { x?: number; y?: number; width?: number; height?: number }) =>
    ipcRenderer.invoke('window:set-bounds', bounds),

  // AI 服務
  createChatWindow: (serviceId: string) => ipcRenderer.invoke('ai:create-chat-window', serviceId),

  // 視窗狀態管理
  getWindowState: (windowId: string) => ipcRenderer.invoke('window-state:get', windowId),
  saveWindowState: (windowId: string, state: any) =>
    ipcRenderer.invoke('window-state:save', windowId, state),
  getMainWindowState: () => ipcRenderer.invoke('window-state:get-main'),
  getAllChatWindowStates: () => ipcRenderer.invoke('window-state:get-all-chat'),

  // 系統整合 - 剪貼簿
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),
  clearClipboard: () => ipcRenderer.invoke('clipboard:clear'),
  getLastClipboardContent: () => ipcRenderer.invoke('clipboard:get-last-content'),
  getClipboardSettings: () => ipcRenderer.invoke('clipboard:get-settings'),
  updateClipboardSettings: (settings: any) =>
    ipcRenderer.invoke('clipboard:update-settings', settings),
  isClipboardMonitoring: () => ipcRenderer.invoke('clipboard:is-monitoring'),

  // 資料庫
  saveData: (table: string, data: any) => ipcRenderer.invoke('db:save', table, data),
  loadData: (table: string, query?: any) => ipcRenderer.invoke('db:load', table, query),

  // 熱鍵設定管理
  getAllHotkeys: () => ipcRenderer.invoke('hotkey:get-all'),
  getEnabledHotkeys: () => ipcRenderer.invoke('hotkey:get-enabled'),
  getHotkeysByCategory: (category: string) =>
    ipcRenderer.invoke('hotkey:get-by-category', category),
  getHotkeyById: (id: string) => ipcRenderer.invoke('hotkey:get-by-id', id),
  updateHotkey: (id: string, data: any) => ipcRenderer.invoke('hotkey:update', id, data),
  updateHotkeyAccelerator: (id: string, accelerator: string) =>
    ipcRenderer.invoke('hotkey:update-accelerator', id, accelerator),
  toggleHotkeyEnabled: (id: string) => ipcRenderer.invoke('hotkey:toggle-enabled', id),
  checkHotkeyConflict: (accelerator: string, excludeId?: string) =>
    ipcRenderer.invoke('hotkey:check-conflict', accelerator, excludeId),
  batchUpdateHotkeys: (settings: any[]) => ipcRenderer.invoke('hotkey:batch-update', settings),
  resetHotkeysToDefaults: () => ipcRenderer.invoke('hotkey:reset-defaults'),

  // 系統通知
  showNotification: (options: { title: string; body: string; icon?: string }) =>
    ipcRenderer.invoke('notification:show', options),

  // 額度追蹤管理
  getQuotaByService: (aiServiceId: string) =>
    ipcRenderer.invoke('quota:get-by-service', aiServiceId),
  getAllQuotas: () => ipcRenderer.invoke('quota:get-all'),
  markQuotaDepleted: (data: { aiServiceId: string; resetTime?: string; notes?: string }) =>
    ipcRenderer.invoke('quota:mark-depleted', data),
  markQuotaAvailable: (data: { aiServiceId: string; resetTime?: string }) =>
    ipcRenderer.invoke('quota:mark-available', data),
  updateQuotaResetTime: (data: { aiServiceId: string; resetTime: string }) =>
    ipcRenderer.invoke('quota:update-reset-time', data),
  updateQuotaNotifySettings: (data: {
    aiServiceId: string;
    notifyEnabled: boolean;
    notifyBeforeMinutes?: number;
  }) => ipcRenderer.invoke('quota:update-notify-settings', data),
  getDepletedQuotas: () => ipcRenderer.invoke('quota:get-depleted'),
  triggerQuotaCheck: () => ipcRenderer.invoke('quota:trigger-check'),

  // 內容擷取管理
  startContentCapture: (data: {
    windowId: string;
    aiServiceId: string;
    sessionId: string;
    intervalMs?: number;
  }) => ipcRenderer.invoke('content:start-capture', data),
  stopContentCapture: (windowId: string) => ipcRenderer.invoke('content:stop-capture', windowId),
  captureSnapshot: (data: { windowId: string; aiServiceId: string; sessionId: string }) =>
    ipcRenderer.invoke('content:capture-snapshot', data),

  // 歷史記錄管理
  exportHistoryMarkdown: (sessionId: string) =>
    ipcRenderer.invoke('history:export-markdown', sessionId),
  exportHistoryJSON: (sessionId: string) => ipcRenderer.invoke('history:export-json', sessionId),
  searchHistory: (query: {
    searchText?: string;
    aiServiceId?: string;
    sessionId?: string;
    dateFrom?: string;
    dateTo?: string;
    isUser?: boolean;
  }) => ipcRenderer.invoke('history:search', query),
  getHistoryStats: (sessionId?: string) => ipcRenderer.invoke('history:get-stats', sessionId),

  // IPC 事件監聽
  onNavigateTo: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate-to', (event, route) => callback(route));
  },
  onShowAbout: (callback: () => void) => {
    ipcRenderer.on('show-about', () => callback());
  },
  onClipboardContent: (callback: (content: string) => void) => {
    ipcRenderer.on('clipboard-content', (event, content) => callback(content));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
