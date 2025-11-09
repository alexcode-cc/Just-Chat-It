/**
 * 渲染程序日誌工具
 * 透過 IPC 將日誌發送到主程序
 */

import type { LogLevel } from '../../main/logging/logger';
import type { AppError } from '../../shared/errors/app-error';

/**
 * 渲染程序 Logger
 */
class RendererLogger {
  /**
   * 是否啟用 console 輸出
   */
  private enableConsole: boolean;

  constructor(enableConsole = true) {
    this.enableConsole = enableConsole;
  }

  /**
   * 發送日誌到主程序
   */
  private async sendToMain(level: LogLevel, message: string, context?: any, error?: any) {
    try {
      // 透過 IPC 發送到主程序
      if (window.electronAPI?.log) {
        await window.electronAPI.log(level, message, context, error);
      }
    } catch (err) {
      // 如果 IPC 失敗，至少在 console 輸出
      console.error('Failed to send log to main process:', err);
    }

    // Console 輸出
    if (this.enableConsole) {
      this.logToConsole(level, message, context, error);
    }
  }

  /**
   * 輸出到 console
   */
  private logToConsole(level: LogLevel, message: string, context?: any, error?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    const args = [context, error].filter(Boolean);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(`${prefix} ${message}`, ...args);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, ...args);
        break;
      case 'error':
      case 'fatal':
        console.error(`${prefix} ${message}`, ...args);
        break;
    }
  }

  /**
   * Debug 日誌
   */
  debug(message: string, context?: Record<string, any>) {
    this.sendToMain('debug', message, context);
  }

  /**
   * Info 日誌
   */
  info(message: string, context?: Record<string, any>) {
    this.sendToMain('info', message, context);
  }

  /**
   * Warning 日誌
   */
  warn(message: string, context?: Record<string, any>, error?: Error) {
    const errorData = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined;
    this.sendToMain('warn', message, context, errorData);
  }

  /**
   * Error 日誌
   */
  error(message: string, error?: Error | AppError, context?: Record<string, any>) {
    const errorData = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error instanceof Object && 'code' in error ? { code: error.code } : {}),
        }
      : undefined;
    this.sendToMain('error', message, context, errorData);
  }

  /**
   * Fatal 日誌
   */
  fatal(message: string, error?: Error | AppError, context?: Record<string, any>) {
    const errorData = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error instanceof Object && 'code' in error ? { code: error.code } : {}),
        }
      : undefined;
    this.sendToMain('fatal', message, context, errorData);
  }
}

// 匯出單例
export const logger = new RendererLogger();
