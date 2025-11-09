/**
 * 測試資料工廠
 * 用於建立測試資料物件
 */

import type {
  AIService,
  ChatSession,
  ChatMessage,
  Prompt,
  QuotaTracking,
  WindowState,
  HotkeySettings,
  ComparisonSession,
  ComparisonResult,
} from '../../src/shared/types/database';

/**
 * 建立測試用 AI 服務
 */
export function createTestAIService(overrides?: Partial<AIService>): AIService {
  return {
    id: 'test-ai-service',
    name: 'Test AI',
    displayName: 'Test AI',
    webUrl: 'https://test-ai.example.com',
    iconPath: 'mdi-robot',
    isAvailable: true,
    description: 'Test AI Service',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用聊天會話
 */
export function createTestChatSession(overrides?: Partial<ChatSession>): ChatSession {
  return {
    id: 'test-session',
    aiServiceId: 'test-ai-service',
    title: 'Test Session',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用聊天訊息
 */
export function createTestChatMessage(overrides?: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'test-message',
    sessionId: 'test-session',
    content: 'Test message content',
    isUser: true,
    role: 'user',
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用提示詞
 */
export function createTestPrompt(overrides?: Partial<Prompt>): Prompt {
  return {
    id: 'test-prompt',
    title: 'Test Prompt',
    content: 'Test prompt content',
    category: '通用',
    tags: ['test'],
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用額度追蹤
 */
export function createTestQuotaTracking(overrides?: Partial<QuotaTracking>): QuotaTracking {
  return {
    id: 'test-quota',
    aiServiceId: 'test-ai-service',
    quotaStatus: 'available',
    notifyBeforeMinutes: 60,
    notifyEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用視窗狀態
 */
export function createTestWindowState(overrides?: Partial<WindowState>): WindowState {
  return {
    id: 'test-window',
    windowType: 'main',
    x: 100,
    y: 100,
    width: 1200,
    height: 800,
    isMaximized: false,
    isMinimized: false,
    isFullscreen: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用熱鍵設定
 */
export function createTestHotkeySettings(overrides?: Partial<HotkeySettings>): HotkeySettings {
  return {
    id: 'test-hotkey',
    name: 'Test Hotkey',
    accelerator: 'CommandOrControl+Shift+T',
    description: 'Test hotkey',
    category: 'custom',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用比較會話
 */
export function createTestComparisonSession(overrides?: Partial<ComparisonSession>): ComparisonSession {
  return {
    id: 'test-comparison',
    title: 'Test Comparison',
    promptContent: 'Test prompt',
    aiServiceIds: ['test-ai-1', 'test-ai-2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 建立測試用比較結果
 */
export function createTestComparisonResult(overrides?: Partial<ComparisonResult>): ComparisonResult {
  return {
    id: 'test-result',
    comparisonSessionId: 'test-comparison',
    aiServiceId: 'test-ai-service',
    response: 'Test response',
    status: 'success',
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * 建立多個測試 AI 服務
 */
export function createTestAIServices(count: number): AIService[] {
  return Array.from({ length: count }, (_, i) =>
    createTestAIService({
      id: `test-ai-${i}`,
      name: `Test AI ${i}`,
      order: i,
    })
  );
}

/**
 * 建立多個測試聊天訊息
 */
export function createTestChatMessages(count: number, sessionId: string): ChatMessage[] {
  return Array.from({ length: count }, (_, i) =>
    createTestChatMessage({
      id: `test-message-${i}`,
      sessionId,
      content: `Test message ${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
    })
  );
}

/**
 * 建立多個測試提示詞
 */
export function createTestPrompts(count: number): Prompt[] {
  return Array.from({ length: count }, (_, i) =>
    createTestPrompt({
      id: `test-prompt-${i}`,
      title: `Test Prompt ${i}`,
      usageCount: i,
    })
  );
}
