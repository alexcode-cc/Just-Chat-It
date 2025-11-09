import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { app } from 'electron';
import { CREATE_TABLES_SQL, CREATE_INDEXES_SQL } from './schema';
import { DB_NAME } from '../../shared/constants/database';

/**
 * PGlite 資料庫管理類別
 *
 * 重構說明：
 * - 移除 NodeFS 包裝器，直接傳遞路徑字串給 PGlite
 * - 這樣可以讓 PGlite 自動處理文件系統，提高跨平台兼容性（特別是 Windows）
 * - 參考 zym 專案的成功實作
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private client: PGlite | null = null;
  private dbPath: string;
  private isInitialized = false;

  private constructor() {
    // 取得使用者資料目錄
    const userDataPath = app.getPath('userData');
    // PGlite 使用目錄而非單一檔案
    // 直接使用檔案系統路徑，讓 PGlite 自動處理（跨平台兼容）
    this.dbPath = path.join(userDataPath, 'database');
  }

  /**
   * 取得 DatabaseManager 單例
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化資料庫連接（異步）
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized && this.client) {
      return; // 已經初始化
    }

    try {
      // 創建 PGlite 實例，直接傳遞路徑字串
      // PGlite 會自動處理文件系統，在 Node.js 環境中自動使用 NodeFS
      // 這種方式在 Windows 環境下更穩定
      this.client = new PGlite(this.dbPath);

      // 等待客戶端就緒
      await this.client.waitReady;

      // 建立所有表格
      await this.createTables();

      // 建立索引
      await this.createIndexes();

      this.isInitialized = true;
      console.log(`Database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * 建立所有資料表
   */
  private async createTables(): Promise<void> {
    if (!this.client) {
      throw new Error('Database client not initialized');
    }

    const tables = Object.values(CREATE_TABLES_SQL);
    for (const sql of tables) {
      try {
        await this.client.exec(sql);
      } catch (error) {
        console.error('Error creating table:', error);
        throw error;
      }
    }

    console.log('All tables created successfully');
  }

  /**
   * 建立所有索引
   */
  private async createIndexes(): Promise<void> {
    if (!this.client) {
      throw new Error('Database client not initialized');
    }

    const indexes = Object.values(CREATE_INDEXES_SQL);
    for (const sql of indexes) {
      try {
        await this.client.exec(sql);
      } catch (error) {
        console.error('Error creating index:', error);
        throw error;
      }
    }

    console.log('All indexes created successfully');
  }

  /**
   * 取得資料庫客戶端
   */
  public getClient(): PGlite {
    if (!this.client || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * 關閉資料庫連接
   */
  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  /**
   * 執行事務
   */
  public async transaction<T>(fn: (client: PGlite) => Promise<T>): Promise<T> {
    const client = this.getClient();

    try {
      await client.exec('BEGIN');
      const result = await fn(client);
      await client.exec('COMMIT');
      return result;
    } catch (error) {
      await client.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * 執行查詢
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const client = this.getClient();

    try {
      const result = await client.query<T>(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * 執行單行查詢
   */
  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 執行 SQL（無返回值）
   */
  public async exec(sql: string): Promise<void> {
    const client = this.getClient();
    await client.exec(sql);
  }
}
