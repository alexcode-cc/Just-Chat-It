import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { pathToFileURL } from 'url';
import { app } from 'electron';
import { CREATE_TABLES_SQL, CREATE_INDEXES_SQL } from './schema';
import { DB_NAME } from '../../shared/constants/database';
import type { Server } from 'net';

/**
 * PGlite 資料庫管理類別
 *
 * 重構說明：
 * - 移除 NodeFS 包裝器，直接傳遞路徑字串給 PGlite
 * - 這樣可以讓 PGlite 自動處理文件系統，提高跨平台兼容性（特別是 Windows）
 * - 參考 ZyPlayer 專案的成功實作
 * - 新增 pglite-server 支援，允許使用標準 PostgreSQL 工具連接（僅開發模式）
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private client: PGlite | null = null;
  private dbPath: string;
  private isInitialized = false;
  private pgServer: Server | null = null;

  private constructor() {
    // 取得使用者資料目錄
    const userDataPath = app.getPath('userData');
    // PGlite 使用目錄而非單一檔案
    // 使用絕對路徑並標準化（Windows 兼容性）
    const absolutePath = path.resolve(userDataPath, 'database');
    // 在 Windows 上將反斜杠轉換為正斜杠，確保跨平台兼容性
    this.dbPath = process.platform === 'win32'
      ? absolutePath.replace(/\\/g, '/')
      : absolutePath;

    console.log(`[DatabaseManager] DB path: ${this.dbPath}`);
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
      console.log(`[DatabaseManager] Initializing database...`);
      console.log(`[DatabaseManager] Platform: ${process.platform}`);
      console.log(`[DatabaseManager] Node.js version: ${process.version}`);
      console.log(`[DatabaseManager] Database path: ${this.dbPath}`);

      // 創建 PGlite 實例，直接傳遞路徑字串
      // PGlite 會自動處理文件系統，在 Node.js 環境中自動使用 NodeFS
      // Windows 路徑已標準化為正斜杠格式
      this.client = new PGlite(this.dbPath);

      console.log(`[DatabaseManager] PGlite instance created, waiting for ready...`);

      // 等待客戶端就緒
      await this.client.waitReady;

      console.log(`[DatabaseManager] PGlite client ready`);

      // 建立所有表格
      await this.createTables();

      // 建立索引
      await this.createIndexes();

      this.isInitialized = true;
      console.log(`[DatabaseManager] Database initialized successfully at: ${this.dbPath}`);
    } catch (error) {
      console.error('[DatabaseManager] Failed to initialize database:', error);
      console.error('[DatabaseManager] Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
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
   * 啟動 PostgreSQL Wire Protocol 伺服器（僅開發模式）
   * 允許使用標準 PostgreSQL 客戶端連接到 PGlite 實例
   * 例如: psql -h localhost -U postgres -d postgres
   */
  public async startServer(port: number = 5432): Promise<void> {
    // 僅在開發模式下啟動
    if (process.env.NODE_ENV !== 'development') {
      console.log('PGlite server is only available in development mode');
      return;
    }

    if (this.pgServer) {
      console.log('PGlite server is already running');
      return;
    }

    try {
      // 動態導入 pglite-server
      // @ts-ignore - pglite-server 可能沒有類型定義
      const { createServer } = await import('pglite-server');

      // 確保客戶端已準備好
      if (!this.client) {
        throw new Error('Database client not initialized');
      }
      await this.client.waitReady;

      // 創建並啟動伺服器
      this.pgServer = createServer(this.client);

      this.pgServer.listen(port, () => {
        console.log(`
┌─────────────────────────────────────────────────────────────┐
│ PGlite PostgreSQL Server Started                           │
├─────────────────────────────────────────────────────────────┤
│ Port: ${port}                                                │
│ Database: ${this.dbPath}                                    │
│                                                             │
│ Connect with:                                               │
│   psql -h localhost -p ${port} -U postgres -d postgres     │
│                                                             │
│ Or use any PostgreSQL client tool                          │
└─────────────────────────────────────────────────────────────┘
        `);
      });

      // 錯誤處理
      this.pgServer.on('error', (error) => {
        console.error('PGlite server error:', error);
      });

    } catch (error) {
      console.error('Failed to start PGlite server:', error);
      throw error;
    }
  }

  /**
   * 停止 PostgreSQL 伺服器
   */
  public async stopServer(): Promise<void> {
    if (this.pgServer) {
      return new Promise((resolve) => {
        this.pgServer!.close(() => {
          console.log('PGlite server stopped');
          this.pgServer = null;
          resolve();
        });
      });
    }
  }

  /**
   * 關閉資料庫連接
   */
  public async close(): Promise<void> {
    // 先停止伺服器（如果正在運行）
    await this.stopServer();

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
