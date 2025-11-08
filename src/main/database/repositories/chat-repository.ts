import { BaseRepository } from './base-repository';
import { ChatSession, ChatMessage } from '../../../shared/types/database';
import { TABLE_NAMES } from '../../../shared/constants/database';

/**
 * 聊天會話 Repository
 */
export class ChatSessionRepository extends BaseRepository<ChatSession> {
  constructor() {
    super(TABLE_NAMES.CHAT_SESSIONS);
  }

  protected rowToEntity(row: any): ChatSession {
    return {
      id: row.id,
      aiServiceId: row.ai_service_id,
      title: row.title,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: Boolean(row.is_active),
    };
  }

  protected entityToRow(entity: ChatSession): any {
    return {
      id: entity.id,
      ai_service_id: entity.aiServiceId,
      title: entity.title,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      is_active: entity.isActive ? 1 : 0,
    };
  }

  /**
   * 建立聊天會話
   */
  public create(aiServiceId: string, title: string = '新聊天'): ChatSession {
    const session: ChatSession = {
      id: this.generateId(),
      aiServiceId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    const row = this.entityToRow(session);
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName}
      (id, ai_service_id, title, created_at, updated_at, is_active)
      VALUES (@id, @ai_service_id, @title, @created_at, @updated_at, @is_active)
    `);

    stmt.run(row);
    return session;
  }

  /**
   * 更新會話標題
   */
  public updateTitle(id: string, title: string): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET title = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(title, id);
  }

  /**
   * 更新會話的最後更新時間
   */
  public touch(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * 根據AI服務ID查詢會話
   */
  public findByAIService(aiServiceId: string): ChatSession[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE ai_service_id = ?
      ORDER BY updated_at DESC
    `);

    const rows = stmt.all(aiServiceId);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 查詢活躍的會話
   */
  public findActiveSessions(): ChatSession[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE is_active = 1
      ORDER BY updated_at DESC
    `);

    const rows = stmt.all();
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 停用會話
   */
  public deactivate(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET is_active = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
  }
}

/**
 * 聊天訊息 Repository
 */
export class ChatMessageRepository extends BaseRepository<ChatMessage> {
  constructor() {
    super(TABLE_NAMES.CHAT_MESSAGES);
  }

  protected rowToEntity(row: any): ChatMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      content: row.content,
      timestamp: new Date(row.timestamp),
      isUser: Boolean(row.is_user),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  protected entityToRow(entity: ChatMessage): any {
    return {
      id: entity.id,
      session_id: entity.sessionId,
      content: entity.content,
      timestamp: entity.timestamp.toISOString(),
      is_user: entity.isUser ? 1 : 0,
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : null,
    };
  }

  /**
   * 建立聊天訊息
   */
  public create(
    sessionId: string,
    content: string,
    isUser: boolean,
    metadata?: Record<string, any>
  ): ChatMessage {
    const message: ChatMessage = {
      id: this.generateId(),
      sessionId,
      content,
      timestamp: new Date(),
      isUser,
      metadata,
    };

    const row = this.entityToRow(message);
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName}
      (id, session_id, content, timestamp, is_user, metadata)
      VALUES (@id, @session_id, @content, @timestamp, @is_user, @metadata)
    `);

    stmt.run(row);
    return message;
  }

  /**
   * 根據會話ID查詢訊息
   */
  public findBySession(sessionId: string, limit?: number): ChatMessage[] {
    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `;

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(sessionId);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 搜尋訊息
   */
  public search(query: string, sessionId?: string): ChatMessage[] {
    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE content LIKE ?
    `;

    const params: any[] = [`%${query}%`];

    if (sessionId) {
      sql += ` AND session_id = ?`;
      params.push(sessionId);
    }

    sql += ` ORDER BY timestamp DESC LIMIT 100`;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 刪除會話的所有訊息
   */
  public deleteBySession(sessionId: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE session_id = ?
    `);

    const result = stmt.run(sessionId);
    return result.changes;
  }

  /**
   * 取得會話的訊息數量
   */
  public countBySession(sessionId: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      WHERE session_id = ?
    `);

    const result = stmt.get(sessionId) as { count: number };
    return result.count;
  }
}
