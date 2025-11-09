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

  // 視窗狀態表
  windowStates: `
    CREATE TABLE IF NOT EXISTS window_states (
      id TEXT PRIMARY KEY,
      window_type TEXT NOT NULL,
      ai_service_id TEXT,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      is_maximized INTEGER DEFAULT 0,
      is_minimized INTEGER DEFAULT 0,
      is_fullscreen INTEGER DEFAULT 0,
      session_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    )
  `,

  // 熱鍵設定表
  hotkeySettings: `
    CREATE TABLE IF NOT EXISTS hotkey_settings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      accelerator TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      ai_service_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
    )
  `,

  // 比較會話表
  comparisonSessions: `
    CREATE TABLE IF NOT EXISTS comparison_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      prompt_content TEXT NOT NULL,
      ai_service_ids TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 比較結果表
  comparisonResults: `
    CREATE TABLE IF NOT EXISTS comparison_results (
      id TEXT PRIMARY KEY,
      comparison_session_id TEXT NOT NULL,
      ai_service_id TEXT NOT NULL,
      response TEXT NOT NULL,
      response_time INTEGER,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      FOREIGN KEY (comparison_session_id) REFERENCES comparison_sessions(id),
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
    )
  `,

  // 額度追蹤表
  quotaTracking: `
    CREATE TABLE IF NOT EXISTS quota_tracking (
      id TEXT PRIMARY KEY,
      ai_service_id TEXT NOT NULL,
      quota_status TEXT DEFAULT 'unknown',
      quota_reset_time TEXT,
      notify_before_minutes INTEGER DEFAULT 60,
      notify_enabled INTEGER DEFAULT 1,
      last_notified_at TEXT,
      marked_depleted_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
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

  windowStatesByType: `
    CREATE INDEX IF NOT EXISTS idx_window_states_window_type
    ON window_states(window_type)
  `,

  windowStatesByAI: `
    CREATE INDEX IF NOT EXISTS idx_window_states_ai_service_id
    ON window_states(ai_service_id)
  `,

  hotkeySettingsByCategory: `
    CREATE INDEX IF NOT EXISTS idx_hotkey_settings_category
    ON hotkey_settings(category)
  `,

  hotkeySettingsByEnabled: `
    CREATE INDEX IF NOT EXISTS idx_hotkey_settings_enabled
    ON hotkey_settings(enabled)
  `,

  hotkeySettingsByAI: `
    CREATE INDEX IF NOT EXISTS idx_hotkey_settings_ai_service_id
    ON hotkey_settings(ai_service_id)
  `,

  comparisonResultsBySession: `
    CREATE INDEX IF NOT EXISTS idx_comparison_results_session_id
    ON comparison_results(comparison_session_id)
  `,

  comparisonResultsByAI: `
    CREATE INDEX IF NOT EXISTS idx_comparison_results_ai_service_id
    ON comparison_results(ai_service_id)
  `,

  comparisonResultsByStatus: `
    CREATE INDEX IF NOT EXISTS idx_comparison_results_status
    ON comparison_results(status)
  `,

  quotaTrackingByAI: `
    CREATE INDEX IF NOT EXISTS idx_quota_tracking_ai_service_id
    ON quota_tracking(ai_service_id)
  `,

  quotaTrackingByStatus: `
    CREATE INDEX IF NOT EXISTS idx_quota_tracking_quota_status
    ON quota_tracking(quota_status)
  `,

  quotaTrackingByResetTime: `
    CREATE INDEX IF NOT EXISTS idx_quota_tracking_reset_time
    ON quota_tracking(quota_reset_time)
  `,
};
