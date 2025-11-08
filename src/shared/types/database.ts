/**
 * AI服務介面
 */
export interface AIService {
  id: string;
  name: string;
  displayName: string;
  webUrl: string;
  iconPath?: string;
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
