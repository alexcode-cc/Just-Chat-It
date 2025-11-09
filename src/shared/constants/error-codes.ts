/**
 * 錯誤代碼定義
 * 格式: [類別][子類別][編號]
 * 例如: DB_001 = Database 類別，編號 001
 */

export const ERROR_CODES = {
  // 資料庫錯誤 (DB)
  DB_CONNECTION_FAILED: 'DB_001',
  DB_QUERY_FAILED: 'DB_002',
  DB_TRANSACTION_FAILED: 'DB_003',
  DB_NOT_INITIALIZED: 'DB_004',
  DB_MIGRATION_FAILED: 'DB_005',
  DB_BACKUP_FAILED: 'DB_006',

  // 網路錯誤 (NET)
  NET_CONNECTION_FAILED: 'NET_001',
  NET_TIMEOUT: 'NET_002',
  NET_UNAVAILABLE: 'NET_003',
  NET_DNS_FAILED: 'NET_004',

  // 檔案系統錯誤 (FS)
  FS_READ_FAILED: 'FS_001',
  FS_WRITE_FAILED: 'FS_002',
  FS_DELETE_FAILED: 'FS_003',
  FS_NOT_FOUND: 'FS_004',
  FS_PERMISSION_DENIED: 'FS_005',
  FS_DISK_FULL: 'FS_006',

  // 驗證錯誤 (VAL)
  VAL_REQUIRED_FIELD: 'VAL_001',
  VAL_INVALID_FORMAT: 'VAL_002',
  VAL_OUT_OF_RANGE: 'VAL_003',
  VAL_DUPLICATE_ENTRY: 'VAL_004',

  // IPC 通訊錯誤 (IPC)
  IPC_CHANNEL_NOT_FOUND: 'IPC_001',
  IPC_TIMEOUT: 'IPC_002',
  IPC_INVALID_PARAMS: 'IPC_003',
  IPC_HANDLER_ERROR: 'IPC_004',

  // 視窗管理錯誤 (WIN)
  WIN_CREATE_FAILED: 'WIN_001',
  WIN_NOT_FOUND: 'WIN_002',
  WIN_ALREADY_EXISTS: 'WIN_003',
  WIN_STATE_SAVE_FAILED: 'WIN_004',

  // AI 服務錯誤 (AI)
  AI_SERVICE_UNAVAILABLE: 'AI_001',
  AI_QUOTA_EXCEEDED: 'AI_002',
  AI_INVALID_RESPONSE: 'AI_003',
  AI_WEBVIEW_ERROR: 'AI_004',

  // 系統整合錯誤 (SYS)
  SYS_HOTKEY_REGISTER_FAILED: 'SYS_001',
  SYS_TRAY_CREATE_FAILED: 'SYS_002',
  SYS_CLIPBOARD_ERROR: 'SYS_003',
  SYS_NOTIFICATION_FAILED: 'SYS_004',

  // 未知錯誤
  UNKNOWN_ERROR: 'UNK_001',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 錯誤嚴重程度
 */
export enum ErrorSeverity {
  LOW = 'low', // 輕微錯誤，不影響主要功能
  MEDIUM = 'medium', // 中等錯誤，影響部分功能
  HIGH = 'high', // 嚴重錯誤，影響核心功能
  CRITICAL = 'critical', // 致命錯誤，應用程式無法繼續運行
}

/**
 * 錯誤類別
 */
export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  FILESYSTEM = 'filesystem',
  VALIDATION = 'validation',
  IPC = 'ipc',
  WINDOW = 'window',
  AI_SERVICE = 'ai_service',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}
