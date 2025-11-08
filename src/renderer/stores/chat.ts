import { defineStore } from 'pinia';
import type { ChatSession, ChatMessage } from '../../shared/types/database';

interface ChatStoreState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatStoreState => ({
    sessions: [],
    currentSession: null,
    messages: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * 根據AI服務ID取得會話列表
     */
    getSessionsByService(state) {
      return (aiServiceId: string): ChatSession[] => {
        return state.sessions.filter((session) => session.aiServiceId === aiServiceId);
      };
    },

    /**
     * 取得活躍的會話
     */
    activeSessions(state): ChatSession[] {
      return state.sessions.filter((session) => session.isActive);
    },

    /**
     * 取得當前會話的訊息數量
     */
    currentMessageCount(state): number {
      return state.messages.length;
    },
  },

  actions: {
    /**
     * 建立新會話
     */
    async createSession(aiServiceId: string, title: string = '新聊天'): Promise<ChatSession> {
      this.loading = true;
      this.error = null;

      try {
        const session = (await window.electronAPI.saveData('chat_sessions', {
          aiServiceId,
          title,
        })) as ChatSession;

        this.sessions.unshift(session);
        this.currentSession = session;

        return session;
      } catch (error) {
        this.error = `建立會話失敗: ${error}`;
        console.error('Failed to create session:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 載入會話列表
     */
    async loadSessions(aiServiceId?: string) {
      this.loading = true;
      this.error = null;

      try {
        const query = aiServiceId ? { aiServiceId } : undefined;
        const sessions = (await window.electronAPI.loadData(
          'chat_sessions',
          query
        )) as ChatSession[];

        this.sessions = sessions;
      } catch (error) {
        this.error = `載入會話失敗: ${error}`;
        console.error('Failed to load sessions:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 載入會話的訊息記錄
     */
    async loadSessionHistory(sessionId: string): Promise<ChatMessage[]> {
      this.loading = true;
      this.error = null;

      try {
        const messages = (await window.electronAPI.loadData('chat_messages', {
          sessionId,
        })) as ChatMessage[];

        this.messages = messages;

        // 設定當前會話
        const session = this.sessions.find((s) => s.id === sessionId);
        if (session) {
          this.currentSession = session;
        }

        return messages;
      } catch (error) {
        this.error = `載入訊息記錄失敗: ${error}`;
        console.error('Failed to load session history:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 儲存訊息
     */
    async saveMessage(
      sessionId: string,
      content: string,
      isUser: boolean,
      metadata?: Record<string, any>
    ): Promise<ChatMessage> {
      try {
        const message = (await window.electronAPI.saveData('chat_messages', {
          sessionId,
          content,
          isUser,
          metadata,
        })) as ChatMessage;

        // 如果是當前會話的訊息，加入到訊息列表
        if (this.currentSession?.id === sessionId) {
          this.messages.push(message);
        }

        // 更新會話的最後更新時間
        const session = this.sessions.find((s) => s.id === sessionId);
        if (session) {
          session.updatedAt = new Date();
        }

        return message;
      } catch (error) {
        this.error = `儲存訊息失敗: ${error}`;
        console.error('Failed to save message:', error);
        throw error;
      }
    },

    /**
     * 搜尋訊息
     */
    async searchMessages(query: string, sessionId?: string): Promise<ChatMessage[]> {
      this.loading = true;
      this.error = null;

      try {
        const searchParams = sessionId ? { query, sessionId } : { query };
        const messages = (await window.electronAPI.loadData(
          'chat_messages',
          searchParams
        )) as ChatMessage[];

        return messages;
      } catch (error) {
        this.error = `搜尋訊息失敗: ${error}`;
        console.error('Failed to search messages:', error);
        return [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新會話標題
     */
    async updateSessionTitle(sessionId: string, title: string) {
      try {
        await window.electronAPI.saveData('chat_sessions', {
          id: sessionId,
          title,
        });

        // 更新本地狀態
        const session = this.sessions.find((s) => s.id === sessionId);
        if (session) {
          session.title = title;
        }
      } catch (error) {
        this.error = `更新會話標題失敗: ${error}`;
        console.error('Failed to update session title:', error);
      }
    },

    /**
     * 刪除會話
     */
    async deleteSession(sessionId: string) {
      try {
        await window.electronAPI.saveData('chat_sessions', {
          id: sessionId,
          _delete: true,
        });

        // 從列表中移除
        const index = this.sessions.findIndex((s) => s.id === sessionId);
        if (index > -1) {
          this.sessions.splice(index, 1);
        }

        // 如果是當前會話，清空
        if (this.currentSession?.id === sessionId) {
          this.currentSession = null;
          this.messages = [];
        }
      } catch (error) {
        this.error = `刪除會話失敗: ${error}`;
        console.error('Failed to delete session:', error);
      }
    },

    /**
     * 清空當前會話
     */
    clearCurrentSession() {
      this.currentSession = null;
      this.messages = [];
    },
  },
});
