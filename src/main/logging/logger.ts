import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppError } from '../../shared/errors/app-error';

/**
 * 日誌等級
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * 日誌等級優先級
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * 日誌條目介面
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Logger 配置
 */
export interface LoggerConfig {
  logLevel: LogLevel;
  logDir: string;
  maxFileSize: number; // MB
  maxFiles: number;
  enableConsole: boolean;
  enableFile: boolean;
}

/**
 * 日誌管理器
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private currentLogFile: string = '';
  private logStream: fs.WriteStream | null = null;

  private constructor(config?: Partial<LoggerConfig>) {
    // 預設配置
    const defaultConfig: LoggerConfig = {
      logLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      logDir: path.join(app.getPath('userData'), 'logs'),
      maxFileSize: 10, // 10MB
      maxFiles: 7, // 保留 7 天的日誌
      enableConsole: true,
      enableFile: true,
    };

    this.config = { ...defaultConfig, ...config };

    // 確保日誌目錄存在
    if (this.config.enableFile) {
      this.ensureLogDirectory();
      this.initializeLogFile();
    }
  }

  /**
   * 取得 Logger 單例
   */
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * 確保日誌目錄存在
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  /**
   * 初始化日誌檔案
   */
  private initializeLogFile(): void {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.currentLogFile = path.join(this.config.logDir, `app-${date}.log`);

    // 建立寫入流（追加模式）
    this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });

    // 清理舊日誌檔案
    this.cleanOldLogs();
  }

  /**
   * 清理舊日誌檔案
   */
  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.config.logDir);
      const logFiles = files
        .filter((f) => f.startsWith('app-') && f.endsWith('.log'))
        .map((f) => ({
          name: f,
          path: path.join(this.config.logDir, f),
          stat: fs.statSync(path.join(this.config.logDir, f)),
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      // 刪除超過保留數量的檔案
      if (logFiles.length > this.config.maxFiles) {
        logFiles.slice(this.config.maxFiles).forEach((file) => {
          fs.unlinkSync(file.path);
        });
      }

      // 檢查檔案大小，刪除過大的檔案
      logFiles.slice(0, this.config.maxFiles).forEach((file) => {
        const sizeInMB = file.stat.size / (1024 * 1024);
        if (sizeInMB > this.config.maxFileSize && file.path !== this.currentLogFile) {
          fs.unlinkSync(file.path);
        }
      });
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  /**
   * 檢查是否應該記錄此等級的日誌
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.logLevel];
  }

  /**
   * 格式化日誌條目
   */
  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  /**
   * 寫入日誌
   */
  private writeLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error | AppError): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // 處理錯誤物件
    if (error) {
      if (error instanceof AppError) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
        };
        // 合併 AppError 的 context
        if (error.context) {
          entry.context = { ...entry.context, ...error.context };
        }
      } else {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      }
    }

    // 輸出到 console
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // 寫入檔案
    if (this.config.enableFile && this.logStream) {
      this.logStream.write(this.formatLogEntry(entry));
    }
  }

  /**
   * 輸出到 console
   */
  private logToConsole(entry: LogEntry): void {
    const colorMap: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colorMap[entry.level];
    const prefix = `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}]${reset}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(`${prefix} ${entry.message}`, entry.context || '', entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.context || '', entry.error || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${prefix} ${entry.message}`, entry.context || '', entry.error || '');
        break;
    }
  }

  /**
   * Debug 日誌
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  /**
   * Info 日誌
   */
  public info(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  /**
   * Warning 日誌
   */
  public warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.writeLog(LogLevel.WARN, message, context, error);
  }

  /**
   * Error 日誌
   */
  public error(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    this.writeLog(LogLevel.ERROR, message, context, error);
  }

  /**
   * Fatal 日誌
   */
  public fatal(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    this.writeLog(LogLevel.FATAL, message, context, error);
  }

  /**
   * 取得日誌目錄路徑
   */
  public getLogDirectory(): string {
    return this.config.logDir;
  }

  /**
   * 取得所有日誌檔案
   */
  public getLogFiles(): string[] {
    try {
      const files = fs.readdirSync(this.config.logDir);
      return files
        .filter((f) => f.startsWith('app-') && f.endsWith('.log'))
        .map((f) => path.join(this.config.logDir, f))
        .sort()
        .reverse(); // 最新的在前
    } catch (error) {
      console.error('Failed to get log files:', error);
      return [];
    }
  }

  /**
   * 讀取日誌檔案內容
   */
  public readLogFile(filePath: string, maxLines: number = 1000): LogEntry[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      // 只取最後 N 行
      const recentLines = lines.slice(-maxLines);

      return recentLines
        .map((line) => {
          try {
            return JSON.parse(line) as LogEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is LogEntry => entry !== null);
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }

  /**
   * 關閉日誌流
   */
  public close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  /**
   * 設定日誌等級
   */
  public setLogLevel(level: LogLevel): void {
    this.config.logLevel = level;
  }

  /**
   * 匯出日誌（壓縮並回傳路徑）
   */
  public async exportLogs(): Promise<string> {
    const exportDir = path.join(this.config.logDir, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const exportPath = path.join(exportDir, `logs-export-${timestamp}.json`);

    try {
      const logFiles = this.getLogFiles();
      const allLogs: LogEntry[] = [];

      for (const file of logFiles) {
        const entries = this.readLogFile(file);
        allLogs.push(...entries);
      }

      fs.writeFileSync(exportPath, JSON.stringify(allLogs, null, 2));
      return exportPath;
    } catch (error) {
      throw new Error(`Failed to export logs: ${error}`);
    }
  }
}
