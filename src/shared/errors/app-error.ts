import { ErrorCode, ErrorSeverity, ErrorCategory } from '../constants/error-codes';

/**
 * 應用程式基礎錯誤類別
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    originalError?: Error,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;
    this.originalError = originalError;

    // 維持正確的堆疊追蹤
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * 轉換為 JSON 格式
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }

  /**
   * 轉換為使用者友好的訊息
   */
  toUserMessage(): string {
    // 根據錯誤類別提供更友好的訊息
    const categoryMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.DATABASE]: '資料庫操作發生錯誤',
      [ErrorCategory.NETWORK]: '網路連線發生問題',
      [ErrorCategory.FILESYSTEM]: '檔案操作發生錯誤',
      [ErrorCategory.VALIDATION]: '資料驗證失敗',
      [ErrorCategory.IPC]: '應用程式內部通訊錯誤',
      [ErrorCategory.WINDOW]: '視窗管理發生錯誤',
      [ErrorCategory.AI_SERVICE]: 'AI 服務發生錯誤',
      [ErrorCategory.SYSTEM]: '系統整合發生錯誤',
      [ErrorCategory.UNKNOWN]: '發生未知錯誤',
    };

    const categoryMsg = categoryMessages[this.category] || '發生錯誤';
    return `${categoryMsg}: ${this.message}`;
  }
}

/**
 * 資料庫錯誤
 */
export class DatabaseError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, originalError?: Error) {
    super(message, code, ErrorCategory.DATABASE, ErrorSeverity.HIGH, context, originalError);
    this.name = 'DatabaseError';
  }
}

/**
 * 網路錯誤
 */
export class NetworkError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, originalError?: Error) {
    super(message, code, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, context, originalError);
    this.name = 'NetworkError';
  }
}

/**
 * 檔案系統錯誤
 */
export class FileSystemError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, originalError?: Error) {
    super(message, code, ErrorCategory.FILESYSTEM, ErrorSeverity.MEDIUM, context, originalError);
    this.name = 'FileSystemError';
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>) {
    super(message, code, ErrorCategory.VALIDATION, ErrorSeverity.LOW, context);
    this.name = 'ValidationError';
  }
}

/**
 * IPC 錯誤
 */
export class IPCError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, originalError?: Error) {
    super(message, code, ErrorCategory.IPC, ErrorSeverity.MEDIUM, context, originalError);
    this.name = 'IPCError';
  }
}

/**
 * 視窗錯誤
 */
export class WindowError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, originalError?: Error) {
    super(message, code, ErrorCategory.WINDOW, ErrorSeverity.MEDIUM, context, originalError);
    this.name = 'WindowError';
  }
}

/**
 * AI 服務錯誤
 */
export class AIServiceError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    originalError?: Error,
  ) {
    super(message, code, ErrorCategory.AI_SERVICE, severity, context, originalError);
    this.name = 'AIServiceError';
  }
}

/**
 * 系統整合錯誤
 */
export class SystemError extends AppError {
  constructor(message: string, code: ErrorCode, context?: Record<string, any>, originalError?: Error) {
    super(message, code, ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM, context, originalError);
    this.name = 'SystemError';
  }
}
