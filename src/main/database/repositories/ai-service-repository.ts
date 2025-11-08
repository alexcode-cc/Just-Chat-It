import { BaseRepository } from './base-repository';
import { AIService } from '../../../shared/types/database';
import { TABLE_NAMES } from '../../../shared/constants/database';

/**
 * AI服務 Repository
 */
export class AIServiceRepository extends BaseRepository<AIService> {
  constructor() {
    super(TABLE_NAMES.AI_SERVICES);
  }

  protected rowToEntity(row: any): AIService {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      webUrl: row.web_url,
      iconPath: row.icon_path,
      hotkey: row.hotkey,
      isAvailable: Boolean(row.is_available),
      quotaResetTime: row.quota_reset_time ? new Date(row.quota_reset_time) : undefined,
      lastUsed: row.last_used ? new Date(row.last_used) : undefined,
      createdAt: new Date(row.created_at),
    };
  }

  protected entityToRow(entity: AIService): any {
    return {
      id: entity.id,
      name: entity.name,
      display_name: entity.displayName,
      web_url: entity.webUrl,
      icon_path: entity.iconPath,
      hotkey: entity.hotkey,
      is_available: entity.isAvailable ? 1 : 0,
      quota_reset_time: entity.quotaResetTime?.toISOString(),
      last_used: entity.lastUsed?.toISOString(),
      created_at: entity.createdAt.toISOString(),
    };
  }

  /**
   * 建立或更新AI服務
   */
  public upsert(service: Partial<AIService> & { id: string }): AIService {
    const existingService = this.findById(service.id);

    if (existingService) {
      return this.update(service.id, service);
    } else {
      return this.create(service as Omit<AIService, 'createdAt'>);
    }
  }

  /**
   * 建立AI服務
   */
  public create(service: Omit<AIService, 'createdAt'>): AIService {
    const newService: AIService = {
      ...service,
      createdAt: new Date(),
    };

    const row = this.entityToRow(newService);
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName}
      (id, name, display_name, web_url, icon_path, hotkey, is_available, quota_reset_time, last_used, created_at)
      VALUES (@id, @name, @display_name, @web_url, @icon_path, @hotkey, @is_available, @quota_reset_time, @last_used, @created_at)
    `);

    stmt.run(row);
    return newService;
  }

  /**
   * 更新AI服務
   */
  public update(id: string, updates: Partial<AIService>): AIService {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`AI Service with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    const row = this.entityToRow(updated);

    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET name = @name,
          display_name = @display_name,
          web_url = @web_url,
          icon_path = @icon_path,
          hotkey = @hotkey,
          is_available = @is_available,
          quota_reset_time = @quota_reset_time,
          last_used = @last_used
      WHERE id = @id
    `);

    stmt.run(row);
    return updated;
  }

  /**
   * 更新服務可用狀態
   */
  public updateAvailability(id: string, isAvailable: boolean, quotaResetTime?: Date): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET is_available = ?,
          quota_reset_time = ?
      WHERE id = ?
    `);

    stmt.run(isAvailable ? 1 : 0, quotaResetTime?.toISOString(), id);
  }

  /**
   * 更新最後使用時間
   */
  public updateLastUsed(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET last_used = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * 取得可用的AI服務
   */
  public findAvailableServices(): AIService[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE is_available = 1
      ORDER BY last_used DESC
    `);

    const rows = stmt.all();
    return rows.map((row) => this.rowToEntity(row));
  }
}
