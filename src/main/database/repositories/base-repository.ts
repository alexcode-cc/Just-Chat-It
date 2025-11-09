import Database from 'better-sqlite3';
import { DatabaseManager } from '../database-manager';

/**
 * Repository 基礎類別
 */
export abstract class BaseRepository<T> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = DatabaseManager.getInstance().getDatabase();
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
   * 查詢所有記錄
   */
  public findAll(): T[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`);
    const rows = stmt.all();
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 根據ID查詢
   */
  public findById(id: string): T | null {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const row = stmt.get(id);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * 建立新記錄
   */
  public create(entity: T): T {
    const row = this.entityToRow(entity);
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const stmt = this.db.prepare(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    );
    stmt.run(...Object.values(row));
    return entity;
  }

  /**
   * 更新記錄
   */
  public update(id: string, updates: Partial<T>): T {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Record with id ${id} not found in ${this.tableName}`);
    }

    const updated = { ...existing, ...updates };
    const row = this.entityToRow(updated);
    const columns = Object.keys(row).filter((col) => col !== 'id');
    const setClause = columns.map((col) => `${col} = ?`).join(', ');
    const stmt = this.db.prepare(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`);
    stmt.run(...columns.map((col) => row[col]), id);
    return updated;
  }

  /**
   * 刪除記錄
   */
  public delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 計算記錄數量
   */
  public count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const result = stmt.get() as { count: number };
    return result.count;
  }
}
