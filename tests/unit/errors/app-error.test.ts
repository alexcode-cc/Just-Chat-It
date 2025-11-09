import { describe, it, expect, beforeEach } from 'vitest';
import {
  AppError,
  DatabaseError,
  NetworkError,
  FileSystemError,
  ValidationError,
  IPCError,
  WindowError,
  AIServiceError,
  SystemError,
} from '../../../src/shared/errors/app-error';
import { ERROR_CODES, ErrorSeverity, ErrorCategory } from '../../../src/shared/constants/error-codes';

describe('AppError', () => {
  describe('基礎 AppError 類別', () => {
    it('應該正確建立錯誤實例', () => {
      const error = new AppError(
        'Test error',
        ERROR_CODES.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('AppError');
    });

    it('應該可以包含上下文資訊', () => {
      const context = { userId: '123', action: 'test' };
      const error = new AppError(
        'Test error',
        ERROR_CODES.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.LOW,
        context
      );

      expect(error.context).toEqual(context);
    });

    it('應該可以包含原始錯誤', () => {
      const originalError = new Error('Original error');
      const error = new AppError(
        'Test error',
        ERROR_CODES.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.LOW,
        undefined,
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });

    it('應該使用預設的中等嚴重程度', () => {
      const error = new AppError(
        'Test error',
        ERROR_CODES.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN
      );

      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('toJSON 應該返回正確的 JSON 格式', () => {
      const error = new AppError(
        'Test error',
        ERROR_CODES.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        { key: 'value' }
      );

      const json = error.toJSON();

      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      expect(json.category).toBe(ErrorCategory.UNKNOWN);
      expect(json.severity).toBe(ErrorSeverity.HIGH);
      expect(json.timestamp).toBeDefined();
      expect(json.context).toEqual({ key: 'value' });
      expect(json.stack).toBeDefined();
    });

    it('toJSON 應該包含原始錯誤資訊', () => {
      const originalError = new Error('Original error');
      const error = new AppError(
        'Test error',
        ERROR_CODES.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.LOW,
        undefined,
        originalError
      );

      const json = error.toJSON();

      expect(json.originalError).toBeDefined();
      expect(json.originalError?.message).toBe('Original error');
      expect(json.originalError?.name).toBe('Error');
    });

    it('toUserMessage 應該返回使用者友好的訊息', () => {
      const error = new AppError(
        'Connection failed',
        ERROR_CODES.NET_CONNECTION_FAILED,
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM
      );

      const userMessage = error.toUserMessage();

      expect(userMessage).toBe('網路連線發生問題: Connection failed');
    });
  });

  describe('DatabaseError', () => {
    it('應該建立資料庫錯誤', () => {
      const error = new DatabaseError(
        'Database connection failed',
        ERROR_CODES.DB_CONNECTION_FAILED
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('DatabaseError');
      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('應該包含上下文和原始錯誤', () => {
      const originalError = new Error('SQLite error');
      const context = { query: 'SELECT * FROM users' };
      const error = new DatabaseError(
        'Query failed',
        ERROR_CODES.DB_QUERY_FAILED,
        context,
        originalError
      );

      expect(error.context).toEqual(context);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('NetworkError', () => {
    it('應該建立網路錯誤', () => {
      const error = new NetworkError(
        'Connection timeout',
        ERROR_CODES.NET_TIMEOUT
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('NetworkError');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('FileSystemError', () => {
    it('應該建立檔案系統錯誤', () => {
      const error = new FileSystemError(
        'File not found',
        ERROR_CODES.FS_NOT_FOUND
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('FileSystemError');
      expect(error.category).toBe(ErrorCategory.FILESYSTEM);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('ValidationError', () => {
    it('應該建立驗證錯誤', () => {
      const error = new ValidationError(
        'Required field missing',
        ERROR_CODES.VAL_REQUIRED_FIELD
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ValidationError');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
    });

    it('應該包含上下文資訊', () => {
      const context = { field: 'email', value: '' };
      const error = new ValidationError(
        'Invalid format',
        ERROR_CODES.VAL_INVALID_FORMAT,
        context
      );

      expect(error.context).toEqual(context);
    });
  });

  describe('IPCError', () => {
    it('應該建立 IPC 錯誤', () => {
      const error = new IPCError(
        'Channel not found',
        ERROR_CODES.IPC_CHANNEL_NOT_FOUND
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('IPCError');
      expect(error.category).toBe(ErrorCategory.IPC);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('WindowError', () => {
    it('應該建立視窗錯誤', () => {
      const error = new WindowError(
        'Window creation failed',
        ERROR_CODES.WIN_CREATE_FAILED
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('WindowError');
      expect(error.category).toBe(ErrorCategory.WINDOW);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('AIServiceError', () => {
    it('應該建立 AI 服務錯誤', () => {
      const error = new AIServiceError(
        'Service unavailable',
        ERROR_CODES.AI_SERVICE_UNAVAILABLE
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AIServiceError');
      expect(error.category).toBe(ErrorCategory.AI_SERVICE);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('應該允許自訂嚴重程度', () => {
      const error = new AIServiceError(
        'Quota exceeded',
        ERROR_CODES.AI_QUOTA_EXCEEDED,
        ErrorSeverity.HIGH
      );

      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('SystemError', () => {
    it('應該建立系統錯誤', () => {
      const error = new SystemError(
        'Hotkey registration failed',
        ERROR_CODES.SYS_HOTKEY_REGISTER_FAILED
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('SystemError');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('錯誤類別間的繼承關係', () => {
    it('所有特定錯誤類別都應該繼承自 AppError', () => {
      const errors = [
        new DatabaseError('test', ERROR_CODES.DB_CONNECTION_FAILED),
        new NetworkError('test', ERROR_CODES.NET_CONNECTION_FAILED),
        new FileSystemError('test', ERROR_CODES.FS_NOT_FOUND),
        new ValidationError('test', ERROR_CODES.VAL_REQUIRED_FIELD),
        new IPCError('test', ERROR_CODES.IPC_CHANNEL_NOT_FOUND),
        new WindowError('test', ERROR_CODES.WIN_CREATE_FAILED),
        new AIServiceError('test', ERROR_CODES.AI_SERVICE_UNAVAILABLE),
        new SystemError('test', ERROR_CODES.SYS_HOTKEY_REGISTER_FAILED),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
});
