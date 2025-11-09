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
      is_favorite: entity.isFavorite ? 1 : 0,
    };
  }

  /**
   * 建立提示詞
   */
  public createPrompt(
    title: string,
    content: string,
    category: string = 'general',
    tags: string[] = []
  ): Prompt {
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

    return super.create(prompt);
  }

  /**
   * 更新提示詞
   */
  public updatePrompt(
    id: string,
    updates: Partial<Pick<Prompt, 'title' | 'content' | 'category' | 'tags'>>
  ): Prompt {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    const row = this.entityToRow(updated);

    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET title = @title,
          content = @content,
          category = @category,
          tags = @tags
      WHERE id = @id
    `);

    stmt.run(row);
    return updated;
  }

  /**
   * 增加使用次數
   */
  public incrementUsage(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET usage_count = usage_count + 1
      WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * 切換收藏狀態
   */
  public toggleFavorite(id: string): boolean {
    const prompt = this.findById(id);
    if (!prompt) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    const newFavoriteState = !prompt.isFavorite;

    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET is_favorite = ?
      WHERE id = ?
    `);

    stmt.run(newFavoriteState ? 1 : 0, id);
    return newFavoriteState;
  }

  /**
   * 根據分類查詢
   */
  public findByCategory(category: string): Prompt[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE category = ?
      ORDER BY usage_count DESC, created_at DESC
    `);

    const rows = stmt.all(category);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 查詢收藏的提示詞
   */
  public findFavorites(): Prompt[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE is_favorite = 1
      ORDER BY usage_count DESC, created_at DESC
    `);

    const rows = stmt.all();
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 搜尋提示詞
   */
  public search(query: string): Prompt[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY usage_count DESC, created_at DESC
      LIMIT 50
    `);

    const searchPattern = `%${query}%`;
    const rows = stmt.all(searchPattern, searchPattern);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 取得最近使用的提示詞
   */
  public findRecentlyUsed(limit: number = 10): Prompt[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE usage_count > 0
      ORDER BY usage_count DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 取得所有分類
   */
  public getAllCategories(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT category FROM ${this.tableName}
      ORDER BY category
    `);

    const rows = stmt.all() as Array<{ category: string }>;
    return rows.map((row) => row.category);
  }
}
