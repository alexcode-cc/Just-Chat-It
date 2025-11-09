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

  // 日誌和錯誤處理
  log: (level: string, message: string, context?: any, error?: any) =>
    ipcRenderer.invoke('log:write', level, message, context, error),
  getLogFiles: () => ipcRenderer.invoke('log:get-files'),
  readLogFile: (filePath: string, maxLines?: number) =>
    ipcRenderer.invoke('log:read-file', filePath, maxLines),
  exportLogs: () => ipcRenderer.invoke('log:export'),
  openLogDirectory: () => ipcRenderer.invoke('log:open-directory'),
  getErrorStats: () => ipcRenderer.invoke('error:get-stats'),
  clearErrorStats: () => ipcRenderer.invoke('error:clear-stats'),
  setLogLevel: (level: string) => ipcRenderer.invoke('log:set-level', level),

  // 效能監控
  startPerformanceMonitoring: () => ipcRenderer.invoke('performance:start-monitoring'),
  stopPerformanceMonitoring: () => ipcRenderer.invoke('performance:stop-monitoring'),
  getPerformanceReport: () => ipcRenderer.invoke('performance:get-report'),
  getPerformanceWarnings: () => ipcRenderer.invoke('performance:get-warnings'),
  clearPerformanceWarnings: () => ipcRenderer.invoke('performance:clear-warnings'),
  getPerformanceConfig: () => ipcRenderer.invoke('performance:get-config'),
  updatePerformanceConfig: (config: any) =>
    ipcRenderer.invoke('performance:update-config', config),
  optimizeMemory: () => ipcRenderer.invoke('performance:optimize-memory'),
  analyzePerformance: () => ipcRenderer.invoke('performance:analyze'),
  autoOptimizePerformance: () => ipcRenderer.invoke('performance:auto-optimize'),
  getPerformanceStats: () => ipcRenderer.invoke('performance:get-stats'),

  // 自動更新
  checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),
  quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
  getCurrentVersion: () => ipcRenderer.invoke('updater:get-current-version'),

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
  onPerformanceWarning: (callback: (warnings: any[]) => void) => {
    ipcRenderer.on('performance:warning', (event, warnings) => callback(warnings));
  },
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update:checking', () => callback());
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update:available', (event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update:not-available', (event, info) => callback(info));
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update:download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update:downloaded', (event, info) => callback(info));
  },
  onUpdateError: (callback: (error: any) => void) => {
    ipcRenderer.on('update:error', (event, error) => callback(error));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
