/**
 * 額度追蹤Repository
 */

import { randomUUID } from 'crypto';
import { BaseRepository } from './base-repository';
import { QuotaTracking } from '../../../shared/types/database';

export class QuotaRepository extends BaseRepository<QuotaTracking> {
  constructor() {
    super('quota_tracking');
  }

  /**
   * 資料庫行轉換為實體
   */
  protected rowToEntity(row: any): QuotaTracking {
    return {
      id: row.id,
      aiServiceId: row.ai_service_id,
      quotaStatus: row.quota_status,
      quotaResetTime: row.quota_reset_time ? new Date(row.quota_reset_time) : undefined,
      notifyBeforeMinutes: row.notify_before_minutes,
      notifyEnabled: Boolean(row.notify_enabled),
      lastNotifiedAt: row.last_notified_at ? new Date(row.last_notified_at) : undefined,
      markedDepletedAt: row.marked_depleted_at ? new Date(row.marked_depleted_at) : undefined,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * 實體轉換為資料庫行
   */
  protected entityToRow(entity: QuotaTracking): any {
    return {
      id: entity.id,
      ai_service_id: entity.aiServiceId,
      quota_status: entity.quotaStatus,
      quota_reset_time: entity.quotaResetTime?.toISOString(),
      notify_before_minutes: entity.notifyBeforeMinutes,
      notify_enabled: entity.notifyEnabled,
      last_notified_at: entity.lastNotifiedAt?.toISOString(),
      marked_depleted_at: entity.markedDepletedAt?.toISOString(),
      notes: entity.notes,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  /**
   * 根據AI服務ID獲取額度追蹤
   */
  async getByAIServiceId(aiServiceId: string): Promise<QuotaTracking | undefined> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE ai_service_id = $1
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
    `;

    const result = await this.client.query(sql, [aiServiceId]);
    return result.rows[0] ? this.rowToEntity(result.rows[0]) : undefined;
  }

  /**
   * 更新或創建額度追蹤（Upsert）
   */
  async upsert(quota: Partial<QuotaTracking> & { aiServiceId: string }): Promise<QuotaTracking> {
    const existing = await this.getByAIServiceId(quota.aiServiceId);

    if (existing) {
      // 更新現有記錄
      const updated: QuotaTracking = {
        ...existing,
        ...quota,
        id: existing.id,
        updatedAt: new Date(),
      };
      await this.update(updated);
      return updated;
    } else {
      // 創建新記錄
      const newQuota: QuotaTracking = {
        id: randomUUID(),
        aiServiceId: quota.aiServiceId,
        quotaStatus: quota.quotaStatus || 'unknown',
        quotaResetTime: quota.quotaResetTime,
        notifyBeforeMinutes: quota.notifyBeforeMinutes || 60,
        notifyEnabled: quota.notifyEnabled !== undefined ? quota.notifyEnabled : true,
        lastNotifiedAt: quota.lastNotifiedAt,
        markedDepletedAt: quota.markedDepletedAt,
        notes: quota.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.create(newQuota);
      return newQuota;
    }
  }

  /**
   * 標記額度為已用盡
   */
  async markAsDepleted(aiServiceId: string, resetTime?: Date, notes?: string): Promise<QuotaTracking> {
    return await this.upsert({
      aiServiceId,
      quotaStatus: 'depleted',
      quotaResetTime: resetTime,
      markedDepletedAt: new Date(),
      notes,
    });
  }

  /**
   * 標記額度為可用
   */
  async markAsAvailable(aiServiceId: string, resetTime?: Date): Promise<QuotaTracking> {
    return await this.upsert({
      aiServiceId,
      quotaStatus: 'available',
      quotaResetTime: resetTime,
      markedDepletedAt: undefined,
    });
  }

  /**
   * 更新額度重置時間
   */
  async updateResetTime(aiServiceId: string, resetTime: Date): Promise<QuotaTracking | undefined> {
    const existing = await this.getByAIServiceId(aiServiceId);
    if (!existing) {
      return undefined;
    }

    return await this.upsert({
      aiServiceId,
      quotaResetTime: resetTime,
    });
  }

  /**
   * 更新通知設定
   */
  async updateNotifySettings(
    aiServiceId: string,
    notifyEnabled: boolean,
    notifyBeforeMinutes?: number,
  ): Promise<QuotaTracking> {
    return await this.upsert({
      aiServiceId,
      notifyEnabled,
      notifyBeforeMinutes,
    });
  }

  /**
   * 記錄已發送通知
   */
  async markAsNotified(aiServiceId: string): Promise<QuotaTracking | undefined> {
    const existing = await this.getByAIServiceId(aiServiceId);
    if (!existing) {
      return undefined;
    }

    return await this.upsert({
      aiServiceId,
      lastNotifiedAt: new Date(),
    });
  }

  /**
   * 獲取需要通知的額度追蹤
   * （額度重置時間在指定分鐘內且尚未通知）
   */
  async getQuotasNeedingNotification(now = new Date()): Promise<QuotaTracking[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE notify_enabled = true
        AND quota_reset_time IS NOT NULL
        AND quota_status = 'depleted'
        AND (
          last_notified_at IS NULL
          OR quota_reset_time != last_notified_at + (notify_before_minutes || ' minutes')::interval
        )
        AND quota_reset_time <= $1::timestamp + (notify_before_minutes || ' minutes')::interval
        AND quota_reset_time > $2::timestamp
      ORDER BY quota_reset_time ASC
    `;

    const result = await this.client.query(sql, [now.toISOString(), now.toISOString()]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 獲取所有已用盡且有重置時間的額度追蹤
   */
  async getDepletedQuotas(): Promise<QuotaTracking[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE quota_status = 'depleted'
        AND quota_reset_time IS NOT NULL
      ORDER BY quota_reset_time ASC
    `;

    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 檢查額度是否已重置（重置時間已過）
   * 如果已重置，自動更新狀態為可用
   */
  async checkAndUpdateExpiredQuotas(now = new Date()): Promise<QuotaTracking[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE quota_status = 'depleted'
        AND quota_reset_time IS NOT NULL
        AND quota_reset_time <= $1::timestamp
    `;

    const result = await this.client.query(sql, [now.toISOString()]);
    const expiredQuotas = result.rows.map((row) => this.rowToEntity(row));

    // 更新所有已過期的額度為可用狀態
    for (const quota of expiredQuotas) {
      await this.markAsAvailable(quota.aiServiceId);
    }

    return expiredQuotas;
  }

  /**
   * 初始化所有AI服務的額度追蹤（如果不存在）
   */
  async initializeForAIServices(aiServiceIds: string[]): Promise<void> {
    for (const serviceId of aiServiceIds) {
      const existing = await this.getByAIServiceId(serviceId);
      if (!existing) {
        await this.upsert({
          aiServiceId: serviceId,
          quotaStatus: 'unknown',
          notifyBeforeMinutes: 60,
          notifyEnabled: true,
        });
      }
    }
  }
}
