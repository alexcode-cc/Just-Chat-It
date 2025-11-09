/**
 * 額度追蹤Repository
 */

import { randomUUID } from 'crypto';
import { BaseRepository } from './base-repository';
import { QuotaTracking } from '../../../shared/types/database';
import { Database } from 'better-sqlite3';

export class QuotaRepository extends BaseRepository<QuotaTracking> {
  constructor(db: Database) {
    super(db, 'quota_tracking');
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
      notify_enabled: entity.notifyEnabled ? 1 : 0,
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
  getByAIServiceId(aiServiceId: string): QuotaTracking | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE ai_service_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    const row = stmt.get(aiServiceId);
    return row ? this.rowToEntity(row) : undefined;
  }

  /**
   * 更新或創建額度追蹤（Upsert）
   */
  upsert(quota: Partial<QuotaTracking> & { aiServiceId: string }): QuotaTracking {
    const existing = this.getByAIServiceId(quota.aiServiceId);

    if (existing) {
      // 更新現有記錄
      const updated: QuotaTracking = {
        ...existing,
        ...quota,
        id: existing.id,
        updatedAt: new Date(),
      };
      this.update(updated);
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
      this.create(newQuota);
      return newQuota;
    }
  }

  /**
   * 標記額度為已用盡
   */
  markAsDepleted(aiServiceId: string, resetTime?: Date, notes?: string): QuotaTracking {
    return this.upsert({
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
  markAsAvailable(aiServiceId: string, resetTime?: Date): QuotaTracking {
    return this.upsert({
      aiServiceId,
      quotaStatus: 'available',
      quotaResetTime: resetTime,
      markedDepletedAt: undefined,
    });
  }

  /**
   * 更新額度重置時間
   */
  updateResetTime(aiServiceId: string, resetTime: Date): QuotaTracking | undefined {
    const existing = this.getByAIServiceId(aiServiceId);
    if (!existing) {
      return undefined;
    }

    return this.upsert({
      aiServiceId,
      quotaResetTime: resetTime,
    });
  }

  /**
   * 更新通知設定
   */
  updateNotifySettings(
    aiServiceId: string,
    notifyEnabled: boolean,
    notifyBeforeMinutes?: number,
  ): QuotaTracking {
    return this.upsert({
      aiServiceId,
      notifyEnabled,
      notifyBeforeMinutes,
    });
  }

  /**
   * 記錄已發送通知
   */
  markAsNotified(aiServiceId: string): QuotaTracking | undefined {
    const existing = this.getByAIServiceId(aiServiceId);
    if (!existing) {
      return undefined;
    }

    return this.upsert({
      aiServiceId,
      lastNotifiedAt: new Date(),
    });
  }

  /**
   * 獲取需要通知的額度追蹤
   * （額度重置時間在指定分鐘內且尚未通知）
   */
  getQuotasNeedingNotification(now = new Date()): QuotaTracking[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE notify_enabled = 1
        AND quota_reset_time IS NOT NULL
        AND quota_status = 'depleted'
        AND (
          last_notified_at IS NULL
          OR datetime(quota_reset_time) != datetime(last_notified_at, '+' || notify_before_minutes || ' minutes')
        )
        AND datetime(quota_reset_time) <= datetime(?, '+' || notify_before_minutes || ' minutes')
        AND datetime(quota_reset_time) > datetime(?)
      ORDER BY quota_reset_time ASC
    `);

    const rows = stmt.all(now.toISOString(), now.toISOString());
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 獲取所有已用盡且有重置時間的額度追蹤
   */
  getDepletedQuotas(): QuotaTracking[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE quota_status = 'depleted'
        AND quota_reset_time IS NOT NULL
      ORDER BY quota_reset_time ASC
    `);

    const rows = stmt.all();
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 檢查額度是否已重置（重置時間已過）
   * 如果已重置，自動更新狀態為可用
   */
  checkAndUpdateExpiredQuotas(now = new Date()): QuotaTracking[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE quota_status = 'depleted'
        AND quota_reset_time IS NOT NULL
        AND datetime(quota_reset_time) <= datetime(?)
    `);

    const rows = stmt.all(now.toISOString());
    const expiredQuotas = rows.map((row) => this.rowToEntity(row));

    // 更新所有已過期的額度為可用狀態
    for (const quota of expiredQuotas) {
      this.markAsAvailable(quota.aiServiceId);
    }

    return expiredQuotas;
  }

  /**
   * 初始化所有AI服務的額度追蹤（如果不存在）
   */
  initializeForAIServices(aiServiceIds: string[]): void {
    for (const serviceId of aiServiceIds) {
      const existing = this.getByAIServiceId(serviceId);
      if (!existing) {
        this.upsert({
          aiServiceId: serviceId,
          quotaStatus: 'unknown',
          notifyBeforeMinutes: 60,
          notifyEnabled: true,
        });
      }
    }
  }
}
