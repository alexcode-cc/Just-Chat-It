import { app, dialog } from 'electron';
import { Logger } from './logger';
import { AppError, ErrorSeverity } from '../../shared/errors/app-error';
import { ERROR_CODES } from '../../shared/constants/error-codes';

/**
 * 錯誤處理選項
 */
export interface ErrorHandlerOptions {
  showDialog?: boolean; // 是否顯示錯誤對話框
  exitOnFatal?: boolean; // 致命錯誤是否退出應用
  logError?: boolean; // 是否記錄到日誌
  reportError?: boolean; // 是否回報錯誤（未來可實作錯誤追蹤服務）
}

/**
 * 錯誤統計
 */
interface ErrorStats {
  total: number;
  byLevel: Record<ErrorSeverity, number>;
  byCategory: Record<string, number>;
  recent: AppError[];
}

/**
 * 全域錯誤處理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;
  private stats: ErrorStats;
  private maxRecentErrors = 100;

  private constructor() {
    this.logger = Logger.getInstance();
    this.stats = {
      total: 0,
      byLevel: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      byCategory: {},
      recent: [],
    };

    this.setupGlobalHandlers();
  }

  /**
   * 取得 ErrorHandler 單例
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 設定全域錯誤處理
   */
  private setupGlobalHandlers(): void {
    // 處理未捕獲的異常
    process.on('uncaughtException', (error: Error) => {
      this.logger.fatal('Uncaught exception', error);
      this.handleError(error, {
        showDialog: true,
        exitOnFatal: true,
        logError: true,
      });
    });

    // 處理未處理的 Promise rejection
    process.on('unhandledRejection', (reason: any) => {
      const error =
        reason instanceof Error ? reason : new Error(`Unhandled rejection: ${String(reason)}`);
      this.logger.error('Unhandled promise rejection', error);
      this.handleError(error, {
        showDialog: false,
        logError: true,
      });
    });

    // 應用程式錯誤事件
    app.on('render-process-gone', (event, webContents, details) => {
      this.logger.error('Render process gone', undefined, { details });
      this.handleError(
        new Error(`Render process ${details.reason}`),
        {
          showDialog: true,
          logError: true,
        },
      );
    });
  }

  /**
   * 處理錯誤
   */
  public handleError(error: Error | AppError, options: ErrorHandlerOptions = {}): void {
    const {
      showDialog = false,
      exitOnFatal = false,
      logError = true,
      reportError = false,
    } = options;

    // 轉換為 AppError
    const appError = this.normalizeError(error);

    // 更新統計
    this.updateStats(appError);

    // 記錄日誌
    if (logError) {
      this.logError(appError);
    }

    // 顯示對話框
    if (showDialog) {
      this.showErrorDialog(appError);
    }

    // 錯誤回報（未來實作）
    if (reportError) {
      this.reportError(appError);
    }

    // 致命錯誤處理
    if (exitOnFatal && appError.severity === ErrorSeverity.CRITICAL) {
      this.logger.fatal('Application will exit due to critical error', appError);
      setTimeout(() => {
        app.exit(1);
      }, 1000);
    }
  }

  /**
   * 將一般錯誤轉換為 AppError
   */
  private normalizeError(error: Error | AppError): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // 嘗試從錯誤訊息判斷錯誤類型
    const message = error.message.toLowerCase();

    if (message.includes('database') || message.includes('sql')) {
      return new AppError(
        error.message,
        ERROR_CODES.DB_QUERY_FAILED,
        'database' as any,
        ErrorSeverity.HIGH,
        undefined,
        error,
      );
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return new AppError(
        error.message,
        ERROR_CODES.NET_CONNECTION_FAILED,
        'network' as any,
        ErrorSeverity.MEDIUM,
        undefined,
        error,
      );
    }

    if (message.includes('file') || message.includes('ENOENT') || message.includes('EACCES')) {
      return new AppError(
        error.message,
        ERROR_CODES.FS_READ_FAILED,
        'filesystem' as any,
        ErrorSeverity.MEDIUM,
        undefined,
        error,
      );
    }

    // 預設為未知錯誤
    return new AppError(
      error.message,
      ERROR_CODES.UNKNOWN_ERROR,
      'unknown' as any,
      ErrorSeverity.MEDIUM,
      undefined,
      error,
    );
  }

  /**
   * 記錄錯誤
   */
  private logError(error: AppError): void {
    const context = {
      code: error.code,
      category: error.category,
      severity: error.severity,
      ...error.context,
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        this.logger.info(`Error: ${error.message}`, context);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(error.message, context, error);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(error.message, error, context);
        break;
      case ErrorSeverity.CRITICAL:
        this.logger.fatal(error.message, error, context);
        break;
    }
  }

  /**
   * 顯示錯誤對話框
   */
  private showErrorDialog(error: AppError): void {
    const severity = error.severity;
    const title =
      severity === ErrorSeverity.CRITICAL
        ? '致命錯誤'
        : severity === ErrorSeverity.HIGH
          ? '嚴重錯誤'
          : '錯誤';

    const type = severity === ErrorSeverity.CRITICAL ? 'error' : 'warning';

    dialog.showErrorBox(title, error.toUserMessage());
  }

  /**
   * 回報錯誤（未來實作）
   */
  private reportError(error: AppError): void {
    // 可以整合錯誤追蹤服務，例如 Sentry
    // 這裡暫時只記錄日誌
    this.logger.info('Error reported', { error: error.toJSON() });
  }

  /**
   * 更新錯誤統計
   */
  private updateStats(error: AppError): void {
    this.stats.total++;
    this.stats.byLevel[error.severity]++;

    if (!this.stats.byCategory[error.category]) {
      this.stats.byCategory[error.category] = 0;
    }
    this.stats.byCategory[error.category]++;

    // 保留最近的錯誤
    this.stats.recent.unshift(error);
    if (this.stats.recent.length > this.maxRecentErrors) {
      this.stats.recent.pop();
    }
  }

  /**
   * 取得錯誤統計
   */
  public getStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * 清除統計
   */
  public clearStats(): void {
    this.stats = {
      total: 0,
      byLevel: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      byCategory: {},
      recent: [],
    };
  }

  /**
   * 安全執行函數（捕獲錯誤）
   */
  public async safeExecute<T>(
    fn: () => Promise<T> | T,
    options: ErrorHandlerOptions = {},
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error as Error, options);
      return null;
    }
  }

  /**
   * 包裝 IPC Handler（自動錯誤處理）
   */
  public wrapIPCHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R> | R,
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await handler(...args);
      } catch (error) {
        this.handleError(error as Error, {
          logError: true,
          showDialog: false,
        });
        throw error; // 重新拋出，讓 IPC 可以回傳錯誤給渲染程序
      }
    };
  }
}
