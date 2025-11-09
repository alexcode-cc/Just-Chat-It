import { BaseRepository } from './base-repository';
import { WindowState } from '../../../shared/types/database';
import { TABLE_NAMES } from '../../../shared/constants/database';

/**
 * 視窗狀態 Repository
 */
export class WindowStateRepository extends BaseRepository<WindowState> {
  constructor() {
    super(TABLE_NAMES.WINDOW_STATES);
  }

  protected rowToEntity(row: any): WindowState {
    return {
      id: row.id,
      windowType: row.window_type,
      aiServiceId: row.ai_service_id,
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      isMaximized: Boolean(row.is_maximized),
      isMinimized: Boolean(row.is_minimized),
      isFullscreen: Boolean(row.is_fullscreen),
      sessionId: row.session_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected entityToRow(entity: WindowState): any {
    return {
      id: entity.id,
      window_type: entity.windowType,
      ai_service_id: entity.aiServiceId,
      x: entity.x,
      y: entity.y,
      width: entity.width,
      height: entity.height,
      is_maximized: entity.isMaximized,
      is_minimized: entity.isMinimized,
      is_fullscreen: entity.isFullscreen,
      session_id: entity.sessionId,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  /**
   * 建立視窗狀態記錄
   */
  public async create(state: Omit<WindowState, 'createdAt' | 'updatedAt'>): Promise<WindowState> {
    const newState: WindowState = {
      ...state,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const row = this.entityToRow(newState);
    const sql = `
      INSERT INTO ${this.tableName}
      (id, window_type, ai_service_id, x, y, width, height, is_maximized, is_minimized, is_fullscreen, session_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    await this.client.query(sql, [
      row.id,
      row.window_type,
      row.ai_service_id,
      row.x,
      row.y,
      row.width,
      row.height,
      row.is_maximized,
      row.is_minimized,
      row.is_fullscreen,
      row.session_id,
      row.created_at,
      row.updated_at,
    ]);
    return newState;
  }

  /**
   * 更新視窗狀態
   */
  public async update(id: string, updates: Partial<WindowState>): Promise<WindowState> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Window state with id ${id} not found`);
    }

    const updated: WindowState = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    const row = this.entityToRow(updated);

    const sql = `
      UPDATE ${this.tableName}
      SET window_type = $1,
          ai_service_id = $2,
          x = $3,
          y = $4,
          width = $5,
          height = $6,
          is_maximized = $7,
          is_minimized = $8,
          is_fullscreen = $9,
          session_id = $10,
          updated_at = $11
      WHERE id = $12
    `;

    await this.client.query(sql, [
      row.window_type,
      row.ai_service_id,
      row.x,
      row.y,
      row.width,
      row.height,
      row.is_maximized,
      row.is_minimized,
      row.is_fullscreen,
      row.session_id,
      row.updated_at,
      row.id,
    ]);
    return updated;
  }

  /**
   * 建立或更新視窗狀態 (upsert)
   */
  public async upsert(state: Partial<WindowState> & { id: string }): Promise<WindowState> {
    const existingState = await this.findById(state.id);

    if (existingState) {
      return await this.update(state.id, state);
    } else {
      return await this.create(state as Omit<WindowState, 'createdAt' | 'updatedAt'>);
    }
  }

  /**
   * 根據視窗類型查詢
   */
  public async findByWindowType(windowType: string): Promise<WindowState[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE window_type = $1
      ORDER BY updated_at DESC
    `;

    const result = await this.client.query(sql, [windowType]);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 根據AI服務ID查詢
   */
  public async findByAIServiceId(aiServiceId: string): Promise<WindowState | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE ai_service_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const result = await this.client.query(sql, [aiServiceId]);
    return result.rows[0] ? this.rowToEntity(result.rows[0]) : null;
  }

  /**
   * 更新視窗位置
   */
  public async updatePosition(id: string, x: number, y: number): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET x = $1,
          y = $2,
          updated_at = now()
      WHERE id = $3
    `;

    await this.client.query(sql, [x, y, id]);
  }

  /**
   * 更新視窗大小
   */
  public async updateSize(id: string, width: number, height: number): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET width = $1,
          height = $2,
          updated_at = now()
      WHERE id = $3
    `;

    await this.client.query(sql, [width, height, id]);
  }

  /**
   * 更新視窗位置和大小
   */
  public async updateBounds(id: string, x: number, y: number, width: number, height: number): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET x = $1,
          y = $2,
          width = $3,
          height = $4,
          updated_at = now()
      WHERE id = $5
    `;

    await this.client.query(sql, [x, y, width, height, id]);
  }

  /**
   * 更新視窗狀態標誌
   */
  public async updateStateFlags(
    id: string,
    isMaximized: boolean,
    isMinimized: boolean,
    isFullscreen: boolean
  ): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET is_maximized = $1,
          is_minimized = $2,
          is_fullscreen = $3,
          updated_at = now()
      WHERE id = $4
    `;

    await this.client.query(sql, [isMaximized, isMinimized, isFullscreen, id]);
  }

  /**
   * 取得主視窗狀態
   */
  public async getMainWindowState(): Promise<WindowState | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE window_type = 'main'
      LIMIT 1
    `;

    const result = await this.client.query(sql);
    return result.rows[0] ? this.rowToEntity(result.rows[0]) : null;
  }

  /**
   * 取得所有聊天視窗狀態
   */
  public async getAllChatWindowStates(): Promise<WindowState[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE window_type = 'chat'
      ORDER BY updated_at DESC
    `;

    const result = await this.client.query(sql);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 刪除特定視窗類型的所有狀態
   */
  public async deleteByWindowType(windowType: string): Promise<number> {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE window_type = $1
    `;

    const result = await this.client.query(sql, [windowType]);
    return result.affectedRows || 0;
  }

  /**
   * 清理舊的視窗狀態記錄（保留最近的N個）
   */
  public async cleanupOldStates(windowType: string, keepCount: number = 10): Promise<number> {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE window_type = $1
      AND id NOT IN (
        SELECT id FROM ${this.tableName}
        WHERE window_type = $2
        ORDER BY updated_at DESC
        LIMIT $3
      )
    `;

    const result = await this.client.query(sql, [windowType, windowType, keepCount]);
    return result.affectedRows || 0;
  }
}
