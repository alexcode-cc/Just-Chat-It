/**
 * 桌面通知管理器
 */

import { Notification, BrowserWindow } from 'electron';
import { QuotaRepository } from '../database/repositories';
import { QuotaTracking } from '../../shared/types/database';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  timeoutType?: 'default' | 'never';
}

export class NotificationManager {
  private quotaRepository: QuotaRepository;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 60000; // 每分鐘檢查一次
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.quotaRepository = new QuotaRepository();
  }

  /**
   * 設置主視窗引用（用於點擊通知時顯示）
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 發送桌面通知
   */
  send(options: NotificationOptions): Notification {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      silent: options.silent || false,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeoutType || 'default',
    });

    // 點擊通知時顯示主視窗
    notification.on('click', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.focus();
      }
    });

    notification.show();
    return notification;
  }

  /**
   * 發送額度重置提醒通知
   */
  sendQuotaResetNotification(
    aiServiceName: string,
    resetTime: Date,
    aiServiceId: string,
  ): Notification {
    const timeUntilReset = this.formatTimeUntilReset(resetTime);

    return this.send({
      title: `${aiServiceName} 額度即將重置`,
      body: `您的 ${aiServiceName} 額度將在 ${timeUntilReset} 後重置`,
      urgency: 'normal',
    });
  }

  /**
   * 發送額度已重置通知
   */
  sendQuotaAvailableNotification(aiServiceName: string): Notification {
    return this.send({
      title: `${aiServiceName} 額度已重置`,
      body: `您的 ${aiServiceName} 額度現在可用了`,
      urgency: 'low',
    });
  }

  /**
   * 啟動額度監控
   */
  startQuotaMonitoring() {
    // 立即執行一次檢查
    this.checkQuotaNotifications();

    // 設置定期檢查
    this.checkInterval = setInterval(() => {
      this.checkQuotaNotifications();
    }, this.CHECK_INTERVAL_MS);

    console.log('[NotificationManager] 額度監控已啟動');
  }

  /**
   * 停止額度監控
   */
  stopQuotaMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[NotificationManager] 額度監控已停止');
    }
  }

  /**
   * 檢查需要發送的額度通知
   */
  private checkQuotaNotifications() {
    try {
      const now = new Date();

      // 1. 檢查需要提前通知的額度（即將重置）
      const quotasNeedingNotification = this.quotaRepository.getQuotasNeedingNotification(now);

      for (const quota of quotasNeedingNotification) {
        if (quota.quotaResetTime) {
          // 發送通知
          this.sendQuotaResetNotification(
            this.getAIServiceName(quota.aiServiceId),
            quota.quotaResetTime,
            quota.aiServiceId,
          );

          // 標記為已通知
          this.quotaRepository.markAsNotified(quota.aiServiceId);
        }
      }

      // 2. 檢查已過期的額度（已重置）
      const expiredQuotas = this.quotaRepository.checkAndUpdateExpiredQuotas(now);

      for (const quota of expiredQuotas) {
        if (quota.notifyEnabled) {
          // 發送額度可用通知
          this.sendQuotaAvailableNotification(this.getAIServiceName(quota.aiServiceId));
        }
      }

      if (quotasNeedingNotification.length > 0 || expiredQuotas.length > 0) {
        console.log(
          `[NotificationManager] 已發送 ${quotasNeedingNotification.length} 個即將重置通知，${expiredQuotas.length} 個已重置通知`,
        );
      }
    } catch (error) {
      console.error('[NotificationManager] 檢查額度通知時發生錯誤:', error);
    }
  }

  /**
   * 格式化剩餘時間
   */
  private formatTimeUntilReset(resetTime: Date): string {
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();

    if (diff <= 0) {
      return '即刻';
    }

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days} 天 ${remainingHours} 小時`;
    } else if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours} 小時 ${remainingMinutes} 分鐘`;
    } else {
      return `${minutes} 分鐘`;
    }
  }

  /**
   * 獲取AI服務顯示名稱
   */
  private getAIServiceName(aiServiceId: string): string {
    const serviceNames: Record<string, string> = {
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      gemini: 'Gemini',
      perplexity: 'Perplexity',
      grok: 'Grok',
      copilot: 'Copilot',
    };

    return serviceNames[aiServiceId] || aiServiceId;
  }

  /**
   * 手動觸發額度檢查（用於測試或立即更新）
   */
  triggerQuotaCheck() {
    this.checkQuotaNotifications();
  }
}
