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
      is_available: entity.isAvailable,
      quota_reset_time: entity.quotaResetTime?.toISOString(),
      last_used: entity.lastUsed?.toISOString(),
      created_at: entity.createdAt.toISOString(),
    };
  }

  /**
   * 建立或更新AI服務
   */
  public async upsert(service: Partial<AIService> & { id: string }): Promise<AIService> {
    const existingService = await this.findById(service.id);

    if (existingService) {
      return await this.update(service.id, service);
    } else {
      return await this.create(service as AIService);
    }
  }

  /**
   * 建立AI服務
   */
  public async create(service: Omit<AIService, 'createdAt'>): Promise<AIService> {
    const newService: AIService = {
      ...service,
      createdAt: new Date(),
    };

    const row = this.entityToRow(newService);
    const sql = `
      INSERT INTO ${this.tableName}
      (id, name, display_name, web_url, icon_path, hotkey, is_available, quota_reset_time, last_used, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.client.query(sql, [
      row.id,
      row.name,
      row.display_name,
      row.web_url,
      row.icon_path,
      row.hotkey,
      row.is_available,
      row.quota_reset_time,
      row.last_used,
      row.created_at,
    ]);

    return newService;
  }

  /**
   * 更新AI服務
   */
  public async update(id: string, updates: Partial<AIService>): Promise<AIService> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`AI Service with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    const row = this.entityToRow(updated);

    const sql = `
      UPDATE ${this.tableName}
      SET name = $1,
          display_name = $2,
          web_url = $3,
          icon_path = $4,
          hotkey = $5,
          is_available = $6,
          quota_reset_time = $7,
          last_used = $8
      WHERE id = $9
    `;

    await this.client.query(sql, [
      row.name,
      row.display_name,
      row.web_url,
      row.icon_path,
      row.hotkey,
      row.is_available,
      row.quota_reset_time,
      row.last_used,
      id,
    ]);

    return updated;
  }

  /**
   * 更新服務可用狀態
   */
  public async updateAvailability(
    id: string,
    isAvailable: boolean,
    quotaResetTime?: Date
  ): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET is_available = $1,
          quota_reset_time = $2
      WHERE id = $3
    `;

    await this.client.query(sql, [isAvailable, quotaResetTime?.toISOString(), id]);
  }

  /**
   * 更新最後使用時間
   */
  public async updateLastUsed(id: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET last_used = now()
      WHERE id = $1
    `;

    await this.client.query(sql, [id]);
  }

  /**
   * 取得可用的AI服務
   */
  public async findAvailableServices(): Promise<AIService[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE is_available = true
      ORDER BY last_used DESC NULLS LAST
    `;

    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }
}
