/**
 * 資料庫表格建立腳本
 */

export const CREATE_TABLES_SQL = {
  // AI服務表
  aiServices: `
    CREATE TABLE IF NOT EXISTS ai_services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      web_url TEXT NOT NULL,
      icon_path TEXT,
      hotkey TEXT,
      is_available INTEGER DEFAULT 1,
      quota_reset_time TEXT,
      last_used TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 聊天會話表
  chatSessions: `
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      ai_service_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
    )
  `,

  // 聊天訊息表
  chatMessages: `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      is_user INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    )
  `,

  // 提示詞表
  prompts: `
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      usage_count INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0
    )
  `,

  // 應用程式設定表
  appSettings: `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `,
};

// 建立索引的SQL
export const CREATE_INDEXES_SQL = {
  chatSessionsByAI: `
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_ai_service_id
    ON chat_sessions(ai_service_id)
  `,

  chatMessagesBySession: `
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
    ON chat_messages(session_id)
  `,

  chatMessagesByTimestamp: `
    CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp
    ON chat_messages(timestamp)
  `,

  promptsByCategory: `
    CREATE INDEX IF NOT EXISTS idx_prompts_category
    ON prompts(category)
  `,

  promptsByFavorite: `
    CREATE INDEX IF NOT EXISTS idx_prompts_favorite
    ON prompts(is_favorite)
  `,
};
