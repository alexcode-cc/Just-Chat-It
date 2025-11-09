import { defineStore } from 'pinia';
import type { AppError } from '../../shared/errors/app-error';
import { logger } from '../utils/logger';

/**
 * 錯誤通知介面
 */
export interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  details?: string;
  actionLabel?: string;
  actionCallback?: () => void;
}

interface ErrorStoreState {
  notifications: ErrorNotification[];
  maxNotifications: number;
  lastError: AppError | null;
}

export const useErrorStore = defineStore('error', {
  state: (): ErrorStoreState => ({
    notifications: [],
    maxNotifications: 5,
    lastError: null,
  }),

  actions: {
    /**
     * 顯示錯誤通知
     */
    showError(message: string, details?: string, duration: number = 5000) {
      const notification: ErrorNotification = {
        id: `error-${Date.now()}-${Math.random()}`,
        message,
        type: 'error',
        timestamp: new Date(),
        details,
      };

      this.addNotification(notification);
      logger.error(message, undefined, { details });

      // 自動移除
      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(notification.id);
        }, duration);
      }
    },

    /**
     * 顯示警告通知
     */
    showWarning(message: string, details?: string, duration: number = 4000) {
      const notification: ErrorNotification = {
        id: `warning-${Date.now()}-${Math.random()}`,
        message,
        type: 'warning',
        timestamp: new Date(),
        details,
      };

      this.addNotification(notification);
      logger.warn(message, { details });

      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(notification.id);
        }, duration);
      }
    },

    /**
     * 顯示資訊通知
     */
    showInfo(message: string, details?: string, duration: number = 3000) {
      const notification: ErrorNotification = {
        id: `info-${Date.now()}-${Math.random()}`,
        message,
        type: 'info',
        timestamp: new Date(),
        details,
      };

      this.addNotification(notification);
      logger.info(message, { details });

      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(notification.id);
        }, duration);
      }
    },

    /**
     * 處理 AppError
     */
    handleAppError(error: AppError) {
      this.lastError = error;

      // 根據嚴重程度決定通知類型
      switch (error.severity) {
        case 'low':
          this.showInfo(error.toUserMessage(), error.message);
          break;
        case 'medium':
          this.showWarning(error.toUserMessage(), error.message);
          break;
        case 'high':
        case 'critical':
          this.showError(error.toUserMessage(), error.message, 0); // 不自動關閉
          break;
      }

      logger.error('Application error occurred', error);
    },

    /**
     * 處理一般錯誤
     */
    handleError(error: Error, message?: string) {
      const displayMessage = message || error.message || '發生未知錯誤';
      this.showError(displayMessage, error.stack);
      logger.error(displayMessage, error);
    },

    /**
     * 新增通知
     */
    addNotification(notification: ErrorNotification) {
      this.notifications.unshift(notification);

      // 限制通知數量
      if (this.notifications.length > this.maxNotifications) {
        this.notifications = this.notifications.slice(0, this.maxNotifications);
      }
    },

    /**
     * 移除通知
     */
    removeNotification(id: string) {
      const index = this.notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },

    /**
     * 清除所有通知
     */
    clearAll() {
      this.notifications = [];
    },

    /**
     * 安全執行函數（自動錯誤處理）
     */
    async safeExecute<T>(
      fn: () => Promise<T>,
      errorMessage?: string,
    ): Promise<T | null> {
      try {
        return await fn();
      } catch (error) {
        this.handleError(error as Error, errorMessage);
        return null;
      }
    },
  },
});
