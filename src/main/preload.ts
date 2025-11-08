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

  // 系統整合
  readClipboard: () => ipcRenderer.invoke('system:read-clipboard'),

  // 資料庫
  saveData: (table: string, data: any) => ipcRenderer.invoke('db:save', table, data),
  loadData: (table: string, query?: any) => ipcRenderer.invoke('db:load', table, query),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
