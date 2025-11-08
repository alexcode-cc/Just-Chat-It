import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { CREATE_TABLES_SQL, CREATE_INDEXES_SQL } from './schema';
import { DB_NAME } from '../../shared/constants/database';

/**
 * SQLite 資料庫管理類別
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;
  private dbPath: string;

  private constructor() {
    // 取得使用者資料目錄
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, DB_NAME);
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
   * 初始化資料庫連接
   */
  public initialize(): void {
    if (this.db) {
      return; // 已經初始化
    }

    try {
      this.db = new Database(this.dbPath);

      // 啟用外鍵約束
      this.db.pragma('foreign_keys = ON');

      // 設定 WAL 模式以提升效能
      this.db.pragma('journal_mode = WAL');

      // 建立所有表格
      this.createTables();

      // 建立索引
      this.createIndexes();

      console.log(`Database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * 建立所有資料表
   */
  private createTables(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tables = Object.values(CREATE_TABLES_SQL);
    tables.forEach((sql) => {
      this.db!.exec(sql);
    });

    console.log('All tables created successfully');
  }

  /**
   * 建立所有索引
   */
  private createIndexes(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const indexes = Object.values(CREATE_INDEXES_SQL);
    indexes.forEach((sql) => {
      this.db!.exec(sql);
    });

    console.log('All indexes created successfully');
  }

  /**
   * 取得資料庫連接
   */
  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * 關閉資料庫連接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }

  /**
   * 執行事務
   */
  public transaction<T>(fn: (db: Database.Database) => T): T {
    const db = this.getDatabase();
    const transaction = db.transaction(fn);
    return transaction(db);
  }

  /**
   * 備份資料庫
   */
  public async backup(backupPath: string): Promise<void> {
    const db = this.getDatabase();
    return new Promise((resolve, reject) => {
      db.backup(backupPath)
        .then(() => {
          console.log(`Database backed up to: ${backupPath}`);
          resolve();
        })
        .catch(reject);
    });
  }
}
