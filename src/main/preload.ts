import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // 視窗控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // AI 服務
  createChatWindow: (serviceId: string) => ipcRenderer.invoke('ai:create-chat-window', serviceId),

  // 系統整合
  readClipboard: () => ipcRenderer.invoke('system:read-clipboard'),

  // 資料庫
  saveData: (table: string, data: any) => ipcRenderer.invoke('db:save', table, data),
  loadData: (table: string, query?: any) => ipcRenderer.invoke('db:load', table, query),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
