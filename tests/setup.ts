import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@vue/test-utils';

// 自動清理 Vue 組件
afterEach(() => {
  cleanup();
});

// 模擬 Electron API
global.window = global.window || {};
global.window.electronAPI = {
  // AI Services
  getAIServices: vi.fn(),
  openAIWindow: vi.fn(),
  closeAIWindow: vi.fn(),
  updateAIService: vi.fn(),

  // Window State
  getWindowState: vi.fn(),
  saveWindowState: vi.fn(),

  // Chat
  createChatSession: vi.fn(),
  getChatSessions: vi.fn(),
  getChatMessages: vi.fn(),
  saveChatMessage: vi.fn(),

  // Prompts
  getPrompts: vi.fn(),
  createPrompt: vi.fn(),
  updatePrompt: vi.fn(),
  deletePrompt: vi.fn(),

  // Settings
  getSettings: vi.fn(),
  updateSetting: vi.fn(),

  // System Integration
  registerHotkey: vi.fn(),
  unregisterHotkey: vi.fn(),
  getClipboardText: vi.fn(),

  // Quota
  getQuotaStatus: vi.fn(),
  updateQuotaStatus: vi.fn(),

  // Logging
  log: vi.fn(),
  logError: vi.fn(),

  // Comparison
  createComparison: vi.fn(),
  getComparisons: vi.fn(),

  // Content Capture
  startContentCapture: vi.fn(),
  stopContentCapture: vi.fn(),
};

// 擴展 expect 斷言
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () => `expected ${received} to be a valid Date`,
    };
  },
});
