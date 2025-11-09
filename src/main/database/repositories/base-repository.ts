import { PGlite } from '@electric-sql/pglite';
import { DatabaseManager } from '../database-manager';

/**
 * Repository 基礎類別（PGlite 異步版本）
 */
export abstract class BaseRepository<T> {
  protected client: PGlite;
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.client = DatabaseManager.getInstance().getClient();
  }

  /**
   * 產生UUID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 將資料庫row轉換為領域物件
   */
  protected abstract rowToEntity(row: any): T;

  /**
   * 將領域物件轉換為資料庫row
   */
  protected abstract entityToRow(entity: T): any;

  /**
   * 將 ? 參數轉換為 PostgreSQL $1, $2, ... 格式
   */
  protected convertPlaceholders(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  /**
   * 查詢所有記錄
   */
  public async findAll(): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName}`;
    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 根據ID查詢
   */
  public async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.client.query(sql, [id]);
    return result.rows.length > 0 ? this.rowToEntity(result.rows[0]) : null;
  }

  /**
   * 建立新記錄
   */
  public async create(entity: T): Promise<T> {
    const row = this.entityToRow(entity);
    const columns = Object.keys(row);
    const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    await this.client.query(sql, Object.values(row));
    return entity;
  }

  /**
   * 更新記錄
   */
  public async update(id: string, updates: Partial<T>): Promise<T> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Record with id ${id} not found in ${this.tableName}`);
    }

    const updated = { ...existing, ...updates };
    const row = this.entityToRow(updated);
    const columns = Object.keys(row).filter((col) => col !== 'id');
    const setClause = columns.map((col, idx) => `${col} = $${idx + 1}`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${columns.length + 1}`;

    const values = [...columns.map((col) => row[col]), id];
    await this.client.query(sql, values);
    return updated;
  }

  /**
   * 刪除記錄
   */
  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.client.query(sql, [id]);
    return (result.affectedRows ?? 0) > 0;
  }

  /**
   * 計算記錄數量
   */
  public async count(): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = await this.client.query<{ count: string }>(sql);
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * 執行自定義查詢
   */
  protected async query<R = any>(sql: string, params: any[] = []): Promise<R[]> {
    const convertedSql = this.convertPlaceholders(sql);
    const result = await this.client.query<R>(convertedSql, params);
    return result.rows;
  }

  /**
   * 執行單行查詢
   */
  protected async queryOne<R = any>(sql: string, params: any[] = []): Promise<R | null> {
    const rows = await this.query<R>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
}
