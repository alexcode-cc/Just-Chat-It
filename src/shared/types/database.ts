/**
 * AI服務介面
 */
export interface AIService {
  id: string;
  name: string;
  displayName: string;
  webUrl: string;
  iconPath?: string;
  iconUrl?: string; // Alias for iconPath for backward compatibility
  description?: string;
  hotkey?: string;
  isAvailable: boolean;
  quotaResetTime?: Date;
  lastUsed?: Date;
  createdAt: Date;
}

/**
 * 聊天會話介面
 */
export interface ChatSession {
  id: string;
  aiServiceId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastMessageAt?: Date; // Timestamp of the last message in this session
}

/**
 * 聊天訊息介面
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  role?: 'user' | 'assistant' | 'system'; // Message role for AI conversations
  metadata?: Record<string, any>;
}

/**
 * 提示詞介面
 */
export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  usageCount: number;
  isFavorite: boolean;
}

/**
 * 應用程式設定介面
 */
export interface AppSetting {
  key: string;
  value: string;
  updatedAt: Date;
}

/**
 * 額度狀態介面
 */
export interface QuotaInfo {
  serviceId: string;
  isAvailable: boolean;
  resetTime?: Date;
  usageCount?: number;
}

/**
 * 視窗狀態介面
 */
export interface WindowState {
  id: string; // 視窗ID (main, chat-chatgpt, chat-claude, etc.)
  windowType: 'main' | 'chat' | 'compare' | 'settings';
  aiServiceId?: string; // 對於聊天視窗，關聯的AI服務ID
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  sessionId?: string; // 關聯的會話ID
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 熱鍵設定介面
 */
export interface HotkeySettings {
  id: string; // 熱鍵ID (show-main-panel, open-chatgpt, etc.)
  name: string; // 顯示名稱
  accelerator: string; // 熱鍵組合 (例如: CommandOrControl+Shift+Space)
  description: string; // 描述
  category: 'system' | 'ai-service' | 'custom'; // 分類
  enabled: boolean; // 是否啟用
  aiServiceId?: string; // 關聯的AI服務ID（如果是AI服務熱鍵）
  createdAt: Date;
  updatedAt: Date;
}
