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
      is_active: entity.isActive,
    };
  }

  /**
   * 建立聊天會話
   */
  public async createSession(aiServiceId: string, title: string = '新聊天'): Promise<ChatSession> {
    const session: ChatSession = {
      id: this.generateId(),
      aiServiceId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    return await super.create(session);
  }

  /**
   * 更新會話標題
   */
  public async updateTitle(id: string, title: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET title = $1,
          updated_at = now()
      WHERE id = $2
    `;

    await this.client.query(sql, [title, id]);
  }

  /**
   * 更新會話的最後更新時間
   */
  public async touch(id: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET updated_at = now()
      WHERE id = $1
    `;

    await this.client.query(sql, [id]);
  }

  /**
   * 根據AI服務ID查詢會話
   */
  public async findByAIService(aiServiceId: string): Promise<ChatSession[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE ai_service_id = $1
      ORDER BY updated_at DESC
    `;

    const result = await this.client.query(sql, [aiServiceId]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 查詢活躍的會話
   */
  public async findActiveSessions(): Promise<ChatSession[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE is_active = true
      ORDER BY updated_at DESC
    `;

    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 停用會話
   */
  public async deactivate(id: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET is_active = false,
          updated_at = now()
      WHERE id = $1
    `;

    await this.client.query(sql, [id]);
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
      is_user: entity.isUser,
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : null,
    };
  }

  /**
   * 建立聊天訊息
   */
  public async createMessage(
    sessionId: string,
    content: string,
    isUser: boolean,
    metadata?: Record<string, any>
  ): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: this.generateId(),
      sessionId,
      content,
      timestamp: new Date(),
      isUser,
      metadata,
    };

    return await super.create(message);
  }

  /**
   * 根據會話ID查詢訊息
   */
  public async findBySession(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE session_id = $1
      ORDER BY timestamp ASC
    `;

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const result = await this.client.query(sql, [sessionId]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 搜尋訊息
   */
  public async search(query: string, sessionId?: string): Promise<ChatMessage[]> {
    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE content LIKE $1
    `;

    const params: any[] = [`%${query}%`];

    if (sessionId) {
      sql += ` AND session_id = $2`;
      params.push(sessionId);
    }

    sql += ` ORDER BY timestamp DESC LIMIT 100`;

    const result = await this.client.query(sql, params);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 刪除會話的所有訊息
   */
  public async deleteBySession(sessionId: string): Promise<number> {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE session_id = $1
    `;

    const result = await this.client.query(sql, [sessionId]);
    return result.affectedRows || 0;
  }

  /**
   * 取得會話的訊息數量
   */
  public async countBySession(sessionId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      WHERE session_id = $1
    `;

    const result = await this.client.query(sql, [sessionId]);
    return result.rows[0]?.count || 0;
  }
}
