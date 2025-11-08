/**
 * 資料庫常數定義
 */

// 資料庫檔案名稱
export const DB_NAME = 'just-chat-it.db';

// 資料表名稱
export const TABLE_NAMES = {
  AI_SERVICES: 'ai_services',
  CHAT_SESSIONS: 'chat_sessions',
  CHAT_MESSAGES: 'chat_messages',
  PROMPTS: 'prompts',
  APP_SETTINGS: 'app_settings',
} as const;

// AI服務ID
export const AI_SERVICE_IDS = {
  CHATGPT: 'chatgpt',
  CLAUDE: 'claude',
  GEMINI: 'gemini',
  PERPLEXITY: 'perplexity',
  GROK: 'grok',
  COPILOT: 'copilot',
} as const;

// 預設AI服務配置
export const DEFAULT_AI_SERVICES = [
  {
    id: AI_SERVICE_IDS.CHATGPT,
    name: 'ChatGPT',
    displayName: 'ChatGPT',
    webUrl: 'https://chat.openai.com',
    iconPath: 'icons/chatgpt.png',
    hotkey: 'CommandOrControl+Shift+1',
    isAvailable: true,
  },
  {
    id: AI_SERVICE_IDS.CLAUDE,
    name: 'Claude',
    displayName: 'Claude',
    webUrl: 'https://claude.ai',
    iconPath: 'icons/claude.png',
    hotkey: 'CommandOrControl+Shift+2',
    isAvailable: true,
  },
  {
    id: AI_SERVICE_IDS.GEMINI,
    name: 'Gemini',
    displayName: 'Gemini',
    webUrl: 'https://gemini.google.com',
    iconPath: 'icons/gemini.png',
    hotkey: 'CommandOrControl+Shift+3',
    isAvailable: true,
  },
  {
    id: AI_SERVICE_IDS.PERPLEXITY,
    name: 'Perplexity',
    displayName: 'Perplexity',
    webUrl: 'https://www.perplexity.ai',
    iconPath: 'icons/perplexity.png',
    hotkey: 'CommandOrControl+Shift+4',
    isAvailable: true,
  },
  {
    id: AI_SERVICE_IDS.GROK,
    name: 'Grok',
    displayName: 'Grok',
    webUrl: 'https://grok.x.ai',
    iconPath: 'icons/grok.png',
    hotkey: 'CommandOrControl+Shift+5',
    isAvailable: true,
  },
  {
    id: AI_SERVICE_IDS.COPILOT,
    name: 'Copilot',
    displayName: 'Microsoft Copilot',
    webUrl: 'https://copilot.microsoft.com',
    iconPath: 'icons/copilot.png',
    hotkey: 'CommandOrControl+Shift+6',
    isAvailable: true,
  },
] as const;

// 提示詞分類
export const PROMPT_CATEGORIES = {
  GENERAL: 'general',
  CODING: 'coding',
  WRITING: 'writing',
  ANALYSIS: 'analysis',
  CREATIVE: 'creative',
  LEARNING: 'learning',
} as const;
