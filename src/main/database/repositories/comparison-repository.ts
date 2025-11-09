import { BaseRepository } from './base-repository';
import type { ComparisonSession, ComparisonResult } from '../../../shared/types/database';

/**
 * 比較會話 Repository
 */
export class ComparisonSessionRepository extends BaseRepository<ComparisonSession> {
  constructor() {
    super('comparison_sessions');
  }

  protected rowToEntity(row: any): ComparisonSession {
    return {
      id: row.id,
      title: row.title,
      promptContent: row.prompt_content,
      aiServiceIds: JSON.parse(row.ai_service_ids),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected entityToRow(entity: ComparisonSession): any {
    return {
      id: entity.id || this.generateId(),
      title: entity.title,
      prompt_content: entity.promptContent,
      ai_service_ids: JSON.stringify(entity.aiServiceIds),
      created_at: entity.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: entity.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * 根據建立時間排序取得會話列表
   */
  public async findAllOrdered(limit?: number): Promise<ComparisonSession[]> {
    let sql = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 搜尋會話（根據標題或提示詞內容）
   */
  public async search(keyword: string): Promise<ComparisonSession[]> {
    const sql = `SELECT * FROM ${this.tableName}
       WHERE title LIKE $1 OR prompt_content LIKE $2
       ORDER BY created_at DESC`;
    const searchTerm = `%${keyword}%`;
    const result = await this.client.query(sql, [searchTerm, searchTerm]);
    return result.rows.map((row) => this.rowToEntity(row));
  }
}

/**
 * 比較結果 Repository
 */
export class ComparisonResultRepository extends BaseRepository<ComparisonResult> {
  constructor() {
    super('comparison_results');
  }

  protected rowToEntity(row: any): ComparisonResult {
    return {
      id: row.id,
      comparisonSessionId: row.comparison_session_id,
      aiServiceId: row.ai_service_id,
      response: row.response,
      responseTime: row.response_time,
      status: row.status as 'pending' | 'loading' | 'success' | 'error',
      errorMessage: row.error_message,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  protected entityToRow(entity: ComparisonResult): any {
    return {
      id: entity.id || this.generateId(),
      comparison_session_id: entity.comparisonSessionId,
      ai_service_id: entity.aiServiceId,
      response: entity.response,
      response_time: entity.responseTime,
      status: entity.status,
      error_message: entity.errorMessage,
      timestamp: entity.timestamp?.toISOString() || new Date().toISOString(),
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : null,
    };
  }

  /**
   * 根據會話ID取得所有結果
   */
  public async findBySessionId(sessionId: string): Promise<ComparisonResult[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE comparison_session_id = $1 ORDER BY timestamp ASC`;
    const result = await this.client.query(sql, [sessionId]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 根據會話ID和AI服務ID取得結果
   */
  public async findBySessionAndService(sessionId: string, serviceId: string): Promise<ComparisonResult | null> {
    const sql = `SELECT * FROM ${this.tableName}
       WHERE comparison_session_id = $1 AND ai_service_id = $2
       ORDER BY timestamp DESC LIMIT 1`;
    const result = await this.client.query(sql, [sessionId, serviceId]);
    return result.rows[0] ? this.rowToEntity(result.rows[0]) : null;
  }

  /**
   * 更新結果狀態
   */
  public async updateStatus(
    id: string,
    status: 'pending' | 'loading' | 'success' | 'error',
    errorMessage?: string
  ): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET status = $1, error_message = $2 WHERE id = $3`;
    await this.client.query(sql, [status, errorMessage || null, id]);
  }

  /**
   * 刪除會話的所有結果
   */
  public async deleteBySessionId(sessionId: string): Promise<number> {
    const sql = `DELETE FROM ${this.tableName} WHERE comparison_session_id = $1`;
    const result = await this.client.query(sql, [sessionId]);
    return result.affectedRows || 0;
  }

  /**
   * 取得成功的結果數量
   */
  public async countSuccessfulBySession(sessionId: string): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE comparison_session_id = $1 AND status = 'success'`;
    const result = await this.client.query(sql, [sessionId]);
    return result.rows[0]?.count || 0;
  }
}
