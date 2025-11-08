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
      is_maximized: entity.isMaximized ? 1 : 0,
      is_minimized: entity.isMinimized ? 1 : 0,
      is_fullscreen: entity.isFullscreen ? 1 : 0,
      session_id: entity.sessionId,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  /**
   * 建立視窗狀態記錄
   */
  public create(state: Omit<WindowState, 'createdAt' | 'updatedAt'>): WindowState {
    const newState: WindowState = {
      ...state,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const row = this.entityToRow(newState);
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName}
      (id, window_type, ai_service_id, x, y, width, height, is_maximized, is_minimized, is_fullscreen, session_id, created_at, updated_at)
      VALUES (@id, @window_type, @ai_service_id, @x, @y, @width, @height, @is_maximized, @is_minimized, @is_fullscreen, @session_id, @created_at, @updated_at)
    `);

    stmt.run(row);
    return newState;
  }

  /**
   * 更新視窗狀態
   */
  public update(id: string, updates: Partial<WindowState>): WindowState {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Window state with id ${id} not found`);
    }

    const updated: WindowState = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    const row = this.entityToRow(updated);

    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET window_type = @window_type,
          ai_service_id = @ai_service_id,
          x = @x,
          y = @y,
          width = @width,
          height = @height,
          is_maximized = @is_maximized,
          is_minimized = @is_minimized,
          is_fullscreen = @is_fullscreen,
          session_id = @session_id,
          updated_at = @updated_at
      WHERE id = @id
    `);

    stmt.run(row);
    return updated;
  }

  /**
   * 建立或更新視窗狀態 (upsert)
   */
  public upsert(state: Partial<WindowState> & { id: string }): WindowState {
    const existingState = this.findById(state.id);

    if (existingState) {
      return this.update(state.id, state);
    } else {
      return this.create(state as Omit<WindowState, 'createdAt' | 'updatedAt'>);
    }
  }

  /**
   * 根據視窗類型查詢
   */
  public findByWindowType(windowType: string): WindowState[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE window_type = ?
      ORDER BY updated_at DESC
    `);

    const rows = stmt.all(windowType);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 根據AI服務ID查詢
   */
  public findByAIServiceId(aiServiceId: string): WindowState | null {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE ai_service_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    const row = stmt.get(aiServiceId);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * 更新視窗位置
   */
  public updatePosition(id: string, x: number, y: number): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET x = ?,
          y = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(x, y, id);
  }

  /**
   * 更新視窗大小
   */
  public updateSize(id: string, width: number, height: number): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET width = ?,
          height = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(width, height, id);
  }

  /**
   * 更新視窗位置和大小
   */
  public updateBounds(id: string, x: number, y: number, width: number, height: number): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET x = ?,
          y = ?,
          width = ?,
          height = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(x, y, width, height, id);
  }

  /**
   * 更新視窗狀態標誌
   */
  public updateStateFlags(
    id: string,
    isMaximized: boolean,
    isMinimized: boolean,
    isFullscreen: boolean
  ): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET is_maximized = ?,
          is_minimized = ?,
          is_fullscreen = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(isMaximized ? 1 : 0, isMinimized ? 1 : 0, isFullscreen ? 1 : 0, id);
  }

  /**
   * 取得主視窗狀態
   */
  public getMainWindowState(): WindowState | null {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE window_type = 'main'
      LIMIT 1
    `);

    const row = stmt.get();
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * 取得所有聊天視窗狀態
   */
  public getAllChatWindowStates(): WindowState[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE window_type = 'chat'
      ORDER BY updated_at DESC
    `);

    const rows = stmt.all();
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * 刪除特定視窗類型的所有狀態
   */
  public deleteByWindowType(windowType: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE window_type = ?
    `);

    const result = stmt.run(windowType);
    return result.changes;
  }

  /**
   * 清理舊的視窗狀態記錄（保留最近的N個）
   */
  public cleanupOldStates(windowType: string, keepCount: number = 10): number {
    const stmt = this.db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE window_type = ?
      AND id NOT IN (
        SELECT id FROM ${this.tableName}
        WHERE window_type = ?
        ORDER BY updated_at DESC
        LIMIT ?
      )
    `);

    const result = stmt.run(windowType, windowType, keepCount);
    return result.changes;
  }
}
