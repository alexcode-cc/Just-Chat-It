/**
 * 資料庫表格建立腳本 (PostgreSQL)
 */

export const CREATE_TABLES_SQL = {
  // AI服務表
  aiServices: `
    CREATE TABLE IF NOT EXISTS ai_services (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      web_url TEXT NOT NULL,
      icon_path TEXT,
      hotkey VARCHAR(100),
      is_available BOOLEAN DEFAULT true,
      quota_reset_time TIMESTAMP,
      last_used TIMESTAMP,
      created_at TIMESTAMP DEFAULT now()
    )
  `,

  // 聊天會話表
  chatSessions: `
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id VARCHAR(255) PRIMARY KEY,
      ai_service_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      is_active BOOLEAN DEFAULT true,
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
    )
  `,

  // 聊天訊息表
  chatMessages: `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT now(),
      is_user BOOLEAN NOT NULL,
      metadata TEXT,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    )
  `,

  // 提示詞表
  prompts: `
    CREATE TABLE IF NOT EXISTS prompts (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'general',
      tags TEXT,
      created_at TIMESTAMP DEFAULT now(),
      usage_count INTEGER DEFAULT 0,
      is_favorite BOOLEAN DEFAULT false
    )
  `,

  // 應用程式設定表
  appSettings: `
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT now()
    )
  `,

  // 視窗狀態表
  windowStates: `
    CREATE TABLE IF NOT EXISTS window_states (
      id VARCHAR(255) PRIMARY KEY,
      window_type VARCHAR(100) NOT NULL,
      ai_service_id VARCHAR(255),
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      is_maximized BOOLEAN DEFAULT false,
      is_minimized BOOLEAN DEFAULT false,
      is_fullscreen BOOLEAN DEFAULT false,
      session_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    )
  `,

  // 熱鍵設定表
  hotkeySettings: `
    CREATE TABLE IF NOT EXISTS hotkey_settings (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      accelerator VARCHAR(100) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      enabled BOOLEAN DEFAULT true,
      ai_service_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
    )
  `,

  // 比較會話表
  comparisonSessions: `
    CREATE TABLE IF NOT EXISTS comparison_sessions (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      prompt_content TEXT NOT NULL,
      ai_service_ids TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    )
  `,

  // 比較結果表
  comparisonResults: `
    CREATE TABLE IF NOT EXISTS comparison_results (
      id VARCHAR(255) PRIMARY KEY,
      comparison_session_id VARCHAR(255) NOT NULL,
      ai_service_id VARCHAR(255) NOT NULL,
      response TEXT NOT NULL,
      response_time INTEGER,
      status VARCHAR(50) DEFAULT 'pending',
      error_message TEXT,
      timestamp TIMESTAMP DEFAULT now(),
      metadata TEXT,
      FOREIGN KEY (comparison_session_id) REFERENCES comparison_sessions(id),
      FOREIGN KEY (ai_service_id) REFERENCES ai_services(id)
    )
  `,

  // 額度追蹤表
  quotaTracking: `
    CREATE TABLE IF NOT EXISTS quota_tracking (
      id VARCHAR(255) PRIMARY KEY,
      ai_service_id VARCHAR(255) NOT NULL,
      quota_status VARCHAR(50) DEFAULT 'unknown',
      quota_reset_time TIMESTAMP,
      notify_before_minutes INTEGER DEFAULT 60,
      notify_enabled BOOLEAN DEFAULT true,
      last_notified_at TIMESTAMP,
      marked_depleted_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
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
