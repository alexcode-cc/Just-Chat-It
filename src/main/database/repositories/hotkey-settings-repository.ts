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
      enabled: entity.enabled,
      ai_service_id: entity.aiServiceId,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  /**
   * 建立或更新熱鍵設定
   */
  async upsert(hotkeySettings: Partial<HotkeySettings> & { id: string }): Promise<HotkeySettings> {
    const existing = await this.findById(hotkeySettings.id);

    if (existing) {
      return await this.update(hotkeySettings.id, hotkeySettings);
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

      return await this.create(newSettings);
    }
  }

  /**
   * 根據分類查詢熱鍵設定
   */
  async findByCategory(category: string): Promise<HotkeySettings[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE category = $1 ORDER BY name`;
    const result = await this.client.query(sql, [category]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 查詢所有啟用的熱鍵設定
   */
  async findEnabled(): Promise<HotkeySettings[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE enabled = true ORDER BY category, name`;
    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 根據 AI 服務 ID 查詢熱鍵設定
   */
  async findByAIServiceId(aiServiceId: string): Promise<HotkeySettings | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ai_service_id = $1`;
    const result = await this.client.query(sql, [aiServiceId]);
    return result.rows[0] ? this.rowToEntity(result.rows[0]) : null;
  }

  /**
   * 根據熱鍵組合查詢
   */
  async findByAccelerator(accelerator: string): Promise<HotkeySettings | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE accelerator = $1`;
    const result = await this.client.query(sql, [accelerator]);
    return result.rows[0] ? this.rowToEntity(result.rows[0]) : null;
  }

  /**
   * 切換熱鍵啟用狀態
   */
  async toggleEnabled(id: string): Promise<boolean> {
    const setting = await this.findById(id);

    if (!setting) {
      return false;
    }

    const newEnabled = !setting.enabled;
    const sql = `UPDATE ${this.tableName} SET enabled = $1, updated_at = $2 WHERE id = $3`;

    await this.client.query(sql, [newEnabled, new Date().toISOString(), id]);

    return true;
  }

  /**
   * 更新熱鍵組合
   */
  async updateAccelerator(id: string, accelerator: string): Promise<boolean> {
    // 檢查新的熱鍵組合是否已被使用
    const existing = await this.findByAccelerator(accelerator);

    if (existing && existing.id !== id) {
      console.warn(`Accelerator ${accelerator} is already used by ${existing.id}`);
      return false;
    }

    const sql = `UPDATE ${this.tableName} SET accelerator = $1, updated_at = $2 WHERE id = $3`;

    await this.client.query(sql, [accelerator, new Date().toISOString(), id]);

    return true;
  }

  /**
   * 檢查熱鍵組合是否已存在
   */
  async isAcceleratorUsed(accelerator: string, excludeId?: string): Promise<boolean> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE accelerator = $1`;
    const params: any[] = [accelerator];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await this.client.query(sql, params);
    return result.rows[0]?.count > 0;
  }

  /**
   * 取得所有熱鍵組合（用於衝突檢測）
   */
  async getAllAccelerators(): Promise<Map<string, string>> {
    const sql = `SELECT id, accelerator FROM ${this.tableName} WHERE enabled = true`;
    const result = await this.client.query(sql);

    const acceleratorMap = new Map<string, string>();
    result.rows.forEach((row: any) => {
      acceleratorMap.set(row.accelerator, row.id);
    });

    return acceleratorMap;
  }

  /**
   * 批次更新熱鍵設定
   */
  async batchUpdate(settings: Array<Partial<HotkeySettings> & { id: string }>): Promise<void> {
    const sql = `UPDATE ${this.tableName}
       SET accelerator = $1, enabled = $2, updated_at = $3
       WHERE id = $4`;

    const now = new Date().toISOString();

    for (const setting of settings) {
      await this.client.query(sql, [setting.accelerator, setting.enabled, now, setting.id]);
    }
  }

  /**
   * 重置為預設熱鍵設定
   */
  async resetToDefaults(defaultSettings: HotkeySettings[]): Promise<void> {
    // 清空現有設定
    await this.client.query(`DELETE FROM ${this.tableName}`);

    // 插入預設設定
    for (const setting of defaultSettings) {
      await this.create(setting);
    }
  }

  /**
   * 取得分類統計
   */
  async getCategoryStats(): Promise<Record<string, number>> {
    const sql = `
      SELECT category, COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY category
    `;

    const result = await this.client.query(sql);

    const stats: Record<string, number> = {};
    result.rows.forEach((row: any) => {
      stats[row.category] = row.count;
    });

    return stats;
  }
}
