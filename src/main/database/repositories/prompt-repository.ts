import { BaseRepository } from './base-repository';
import { Prompt } from '../../../shared/types/database';
import { TABLE_NAMES } from '../../../shared/constants/database';

/**
 * 提示詞 Repository
 */
export class PromptRepository extends BaseRepository<Prompt> {
  constructor() {
    super(TABLE_NAMES.PROMPTS);
  }

  protected rowToEntity(row: any): Prompt {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: new Date(row.created_at),
      usageCount: row.usage_count,
      isFavorite: Boolean(row.is_favorite),
    };
  }

  protected entityToRow(entity: Prompt): any {
    return {
      id: entity.id,
      title: entity.title,
      content: entity.content,
      category: entity.category,
      tags: JSON.stringify(entity.tags),
      created_at: entity.createdAt.toISOString(),
      usage_count: entity.usageCount,
      is_favorite: entity.isFavorite,
    };
  }

  /**
   * 建立提示詞
   */
  public async createPrompt(
    title: string,
    content: string,
    category: string = 'general',
    tags: string[] = []
  ): Promise<Prompt> {
    const prompt: Prompt = {
      id: this.generateId(),
      title,
      content,
      category,
      tags,
      createdAt: new Date(),
      usageCount: 0,
      isFavorite: false,
    };

    return await super.create(prompt);
  }

  /**
   * 更新提示詞
   */
  public async updatePrompt(
    id: string,
    updates: Partial<Pick<Prompt, 'title' | 'content' | 'category' | 'tags'>>
  ): Promise<Prompt> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    const row = this.entityToRow(updated);

    const sql = `
      UPDATE ${this.tableName}
      SET title = $1,
          content = $2,
          category = $3,
          tags = $4
      WHERE id = $5
    `;

    await this.client.query(sql, [row.title, row.content, row.category, row.tags, row.id]);
    return updated;
  }

  /**
   * 增加使用次數
   */
  public async incrementUsage(id: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET usage_count = usage_count + 1
      WHERE id = $1
    `;

    await this.client.query(sql, [id]);
  }

  /**
   * 切換收藏狀態
   */
  public async toggleFavorite(id: string): Promise<boolean> {
    const prompt = await this.findById(id);
    if (!prompt) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    const newFavoriteState = !prompt.isFavorite;

    const sql = `
      UPDATE ${this.tableName}
      SET is_favorite = $1
      WHERE id = $2
    `;

    await this.client.query(sql, [newFavoriteState, id]);
    return newFavoriteState;
  }

  /**
   * 根據分類查詢
   */
  public async findByCategory(category: string): Promise<Prompt[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE category = $1
      ORDER BY usage_count DESC, created_at DESC
    `;

    const result = await this.client.query(sql, [category]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 查詢收藏的提示詞
   */
  public async findFavorites(): Promise<Prompt[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE is_favorite = true
      ORDER BY usage_count DESC, created_at DESC
    `;

    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 搜尋提示詞
   */
  public async search(query: string): Promise<Prompt[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE title LIKE $1 OR content LIKE $2
      ORDER BY usage_count DESC, created_at DESC
      LIMIT 50
    `;

    const searchPattern = `%${query}%`;
    const result = await this.client.query(sql, [searchPattern, searchPattern]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 取得最近使用的提示詞
   */
  public async findRecentlyUsed(limit: number = 10): Promise<Prompt[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE usage_count > 0
      ORDER BY usage_count DESC
      LIMIT $1
    `;

    const result = await this.client.query(sql, [limit]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 取得所有分類
   */
  public async getAllCategories(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT category FROM ${this.tableName}
      ORDER BY category
    `;

    const result = await this.client.query(sql);
    return result.rows.map((row: { category: string }) => row.category);
  }
}
