import { BaseRepository } from './base-repository';
import { HotkeySettings } from '../../../shared/types/database';

/**
 * 熱鍵設定 Repository
 * 負責管理熱鍵設定的資料庫操作
 */
export class HotkeySettingsRepository extends BaseRepository<HotkeySettings> {
  constructor() {
    super('hotkey_settings');
  }

  /**
   * 資料庫行轉換為實體物件
   */
  protected rowToEntity(row: any): HotkeySettings {
    return {
      id: row.id,
      name: row.name,
      accelerator: row.accelerator,
      description: row.description || '',
      category: row.category as 'system' | 'ai-service' | 'custom',
      enabled: Boolean(row.enabled),
      aiServiceId: row.ai_service_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * 實體物件轉換為資料庫行
   */
  protected entityToRow(entity: HotkeySettings): any {
    return {
      id: entity.id,
      name: entity.name,
      accelerator: entity.accelerator,
      description: entity.description,
      category: entity.category,
      enabled: entity.enabled ? 1 : 0,
      ai_service_id: entity.aiServiceId,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  /**
   * 建立或更新熱鍵設定
   */
  upsert(hotkeySettings: Partial<HotkeySettings> & { id: string }): HotkeySettings {
    const existing = this.findById(hotkeySettings.id);

    if (existing) {
      return this.update(hotkeySettings.id, hotkeySettings);
    } else {
      const now = new Date();
      const newSettings: HotkeySettings = {
        id: hotkeySettings.id,
        name: hotkeySettings.name || '',
        accelerator: hotkeySettings.accelerator || '',
        description: hotkeySettings.description || '',
        category: hotkeySettings.category || 'custom',
        enabled: hotkeySettings.enabled !== undefined ? hotkeySettings.enabled : true,
        aiServiceId: hotkeySettings.aiServiceId,
        createdAt: hotkeySettings.createdAt || now,
        updatedAt: now,
      };

      return this.create(newSettings);
    }
  }

  /**
   * 根據分類查詢熱鍵設定
   */
  findByCategory(category: string): HotkeySettings[] {
    const query = `SELECT * FROM ${this.tableName} WHERE category = ? ORDER BY name`;
    const rows = this.db.prepare(query).all(category);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 查詢所有啟用的熱鍵設定
   */
  findEnabled(): HotkeySettings[] {
    const query = `SELECT * FROM ${this.tableName} WHERE enabled = 1 ORDER BY category, name`;
    const rows = this.db.prepare(query).all();
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 根據 AI 服務 ID 查詢熱鍵設定
   */
  findByAIServiceId(aiServiceId: string): HotkeySettings | null {
    const query = `SELECT * FROM ${this.tableName} WHERE ai_service_id = ?`;
    const row = this.db.prepare(query).get(aiServiceId);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * 根據熱鍵組合查詢
   */
  findByAccelerator(accelerator: string): HotkeySettings | null {
    const query = `SELECT * FROM ${this.tableName} WHERE accelerator = ?`;
    const row = this.db.prepare(query).get(accelerator);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * 切換熱鍵啟用狀態
   */
  toggleEnabled(id: string): boolean {
    const setting = this.findById(id);

    if (!setting) {
      return false;
    }

    const newEnabled = !setting.enabled;
    const query = `UPDATE ${this.tableName} SET enabled = ?, updated_at = ? WHERE id = ?`;

    this.db.prepare(query).run(newEnabled ? 1 : 0, new Date().toISOString(), id);

    return true;
  }

  /**
   * 更新熱鍵組合
   */
  updateAccelerator(id: string, accelerator: string): boolean {
    // 檢查新的熱鍵組合是否已被使用
    const existing = this.findByAccelerator(accelerator);

    if (existing && existing.id !== id) {
      console.warn(`Accelerator ${accelerator} is already used by ${existing.id}`);
      return false;
    }

    const query = `UPDATE ${this.tableName} SET accelerator = ?, updated_at = ? WHERE id = ?`;

    this.db.prepare(query).run(accelerator, new Date().toISOString(), id);

    return true;
  }

  /**
   * 檢查熱鍵組合是否已存在
   */
  isAcceleratorUsed(accelerator: string, excludeId?: string): boolean {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE accelerator = ?`;
    const params: any[] = [accelerator];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = this.db.prepare(query).get(...params) as { count: number };
    return result.count > 0;
  }

  /**
   * 取得所有熱鍵組合（用於衝突檢測）
   */
  getAllAccelerators(): Map<string, string> {
    const query = `SELECT id, accelerator FROM ${this.tableName} WHERE enabled = 1`;
    const rows = this.db.prepare(query).all();

    const acceleratorMap = new Map<string, string>();
    rows.forEach((row: any) => {
      acceleratorMap.set(row.accelerator, row.id);
    });

    return acceleratorMap;
  }

  /**
   * 批次更新熱鍵設定
   */
  batchUpdate(settings: Array<Partial<HotkeySettings> & { id: string }>): void {
    const updateStmt = this.db.prepare(
      `UPDATE ${this.tableName}
       SET accelerator = ?, enabled = ?, updated_at = ?
       WHERE id = ?`
    );

    const now = new Date().toISOString();

    this.db.transaction(() => {
      settings.forEach((setting) => {
        updateStmt.run(setting.accelerator, setting.enabled ? 1 : 0, now, setting.id);
      });
    })();
  }

  /**
   * 重置為預設熱鍵設定
   */
  resetToDefaults(defaultSettings: HotkeySettings[]): void {
    this.db.transaction(() => {
      // 清空現有設定
      this.db.prepare(`DELETE FROM ${this.tableName}`).run();

      // 插入預設設定
      defaultSettings.forEach((setting) => {
        this.create(setting);
      });
    })();
  }

  /**
   * 取得分類統計
   */
  getCategoryStats(): Record<string, number> {
    const query = `
      SELECT category, COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY category
    `;

    const rows = this.db.prepare(query).all();

    const stats: Record<string, number> = {};
    rows.forEach((row: any) => {
      stats[row.category] = row.count;
    });

    return stats;
  }
}
