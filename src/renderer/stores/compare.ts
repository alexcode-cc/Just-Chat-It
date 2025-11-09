import { defineStore } from 'pinia';
import type { ComparisonSession, ComparisonResult } from '../../shared/types/database';

interface CompareStoreState {
  sessions: ComparisonSession[];
  currentSession: ComparisonSession | null;
  results: Map<string, ComparisonResult[]>; // sessionId -> results
  loading: boolean;
  error: string | null;
  selectedAIServices: string[]; // 選中要比較的 AI 服務 ID
}

export const useCompareStore = defineStore('compare', {
  state: (): CompareStoreState => ({
    sessions: [],
    currentSession: null,
    results: new Map(),
    loading: false,
    error: null,
    selectedAIServices: [],
  }),

  getters: {
    /**
     * 取得當前會話的結果
     */
    currentResults(state): ComparisonResult[] {
      if (!state.currentSession) return [];
      return state.results.get(state.currentSession.id) || [];
    },

    /**
     * 檢查是否有選中的 AI 服務
     */
    hasSelectedServices(state): boolean {
      return state.selectedAIServices.length > 0;
    },

    /**
     * 取得成功的結果數量
     */
    successCount(): number {
      return this.currentResults.filter((r) => r.status === 'success').length;
    },

    /**
     * 取得錯誤的結果數量
     */
    errorCount(): number {
      return this.currentResults.filter((r) => r.status === 'error').length;
    },

    /**
     * 檢查是否所有結果都已完成（成功或失敗）
     */
    allResultsComplete(): boolean {
      const results = this.currentResults;
      if (results.length === 0) return false;
      return results.every((r) => r.status === 'success' || r.status === 'error');
    },

    /**
     * 取得指定 AI 服務的結果
     */
    getResultByServiceId(state) {
      return (serviceId: string): ComparisonResult | undefined => {
        return this.currentResults.find((r) => r.aiServiceId === serviceId);
      };
    },
  },

  actions: {
    /**
     * 載入所有比較會話
     */
    async loadSessions() {
      this.loading = true;
      this.error = null;

      try {
        const sessions = (await window.electronAPI.loadData(
          'comparison_sessions'
        )) as ComparisonSession[];
        this.sessions = sessions;
      } catch (error) {
        this.error = `載入比較會話失敗: ${error}`;
        console.error('Failed to load comparison sessions:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 建立新的比較會話
     */
    async createSession(title: string, promptContent: string, aiServiceIds: string[]) {
      this.loading = true;
      this.error = null;

      try {
        const session: ComparisonSession = {
          id: `comparison-${Date.now()}`,
          title,
          promptContent,
          aiServiceIds,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await window.electronAPI.saveData('comparison_sessions', session);

        // 為每個 AI 服務建立初始結果
        const results: ComparisonResult[] = aiServiceIds.map((serviceId) => ({
          id: `result-${Date.now()}-${serviceId}`,
          comparisonSessionId: session.id,
          aiServiceId: serviceId,
          response: '',
          status: 'pending' as const,
          timestamp: new Date(),
        }));

        // 儲存所有結果
        for (const result of results) {
          await window.electronAPI.saveData('comparison_results', result);
        }

        // 更新本地狀態
        this.sessions.unshift(session);
        this.currentSession = session;
        this.results.set(session.id, results);

        return session;
      } catch (error) {
        this.error = `建立比較會話失敗: ${error}`;
        console.error('Failed to create comparison session:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 載入會話的所有結果
     */
    async loadSessionResults(sessionId: string) {
      this.loading = true;
      this.error = null;

      try {
        const results = (await window.electronAPI.loadData('comparison_results', {
          comparisonSessionId: sessionId,
        })) as ComparisonResult[];

        this.results.set(sessionId, results);
      } catch (error) {
        this.error = `載入比較結果失敗: ${error}`;
        console.error('Failed to load comparison results:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新比較結果
     */
    async updateResult(
      resultId: string,
      updates: Partial<ComparisonResult>
    ): Promise<void> {
      try {
        // 更新資料庫
        await window.electronAPI.saveData('comparison_results', {
          id: resultId,
          ...updates,
        });

        // 更新本地狀態
        if (this.currentSession) {
          const sessionResults = this.results.get(this.currentSession.id);
          if (sessionResults) {
            const index = sessionResults.findIndex((r) => r.id === resultId);
            if (index !== -1) {
              sessionResults[index] = { ...sessionResults[index], ...updates };
              this.results.set(this.currentSession.id, [...sessionResults]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to update comparison result:', error);
        throw error;
      }
    },

    /**
     * 設定當前會話
     */
    async setCurrentSession(sessionId: string) {
      const session = this.sessions.find((s) => s.id === sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      this.currentSession = session;

      // 載入會話結果
      if (!this.results.has(sessionId)) {
        await this.loadSessionResults(sessionId);
      }
    },

    /**
     * 刪除比較會話
     */
    async deleteSession(sessionId: string) {
      try {
        // 刪除所有結果
        const results = this.results.get(sessionId);
        if (results) {
          for (const result of results) {
            await window.electronAPI.saveData('comparison_results', {
              id: result.id,
              _delete: true,
            });
          }
        }

        // 刪除會話
        await window.electronAPI.saveData('comparison_sessions', {
          id: sessionId,
          _delete: true,
        });

        // 更新本地狀態
        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
        this.results.delete(sessionId);

        if (this.currentSession?.id === sessionId) {
          this.currentSession = null;
        }
      } catch (error) {
        this.error = `刪除比較會話失敗: ${error}`;
        console.error('Failed to delete comparison session:', error);
        throw error;
      }
    },

    /**
     * 選擇/取消選擇 AI 服務
     */
    toggleAIService(serviceId: string) {
      const index = this.selectedAIServices.indexOf(serviceId);
      if (index === -1) {
        this.selectedAIServices.push(serviceId);
      } else {
        this.selectedAIServices.splice(index, 1);
      }
    },

    /**
     * 設定選中的 AI 服務
     */
    setSelectedAIServices(serviceIds: string[]) {
      this.selectedAIServices = [...serviceIds];
    },

    /**
     * 清空選擇
     */
    clearSelectedAIServices() {
      this.selectedAIServices = [];
    },

    /**
     * 匯出比較結果為 JSON
     */
    exportResultsAsJSON(sessionId?: string): string {
      const targetSessionId = sessionId || this.currentSession?.id;
      if (!targetSessionId) {
        throw new Error('No session to export');
      }

      const session = this.sessions.find((s) => s.id === targetSessionId);
      const results = this.results.get(targetSessionId);

      if (!session || !results) {
        throw new Error('Session or results not found');
      }

      const exportData = {
        session: {
          title: session.title,
          promptContent: session.promptContent,
          createdAt: session.createdAt,
        },
        results: results
          .filter((r) => r.status === 'success')
          .map((r) => ({
            aiServiceId: r.aiServiceId,
            response: r.response,
            responseTime: r.responseTime,
            timestamp: r.timestamp,
          })),
      };

      return JSON.stringify(exportData, null, 2);
    },

    /**
     * 匯出比較結果為 Markdown
     */
    exportResultsAsMarkdown(sessionId?: string): string {
      const targetSessionId = sessionId || this.currentSession?.id;
      if (!targetSessionId) {
        throw new Error('No session to export');
      }

      const session = this.sessions.find((s) => s.id === targetSessionId);
      const results = this.results.get(targetSessionId);

      if (!session || !results) {
        throw new Error('Session or results not found');
      }

      let markdown = `# ${session.title}\n\n`;
      markdown += `**提示詞**: ${session.promptContent}\n\n`;
      markdown += `**建立時間**: ${new Date(session.createdAt).toLocaleString()}\n\n`;
      markdown += `---\n\n`;

      results
        .filter((r) => r.status === 'success')
        .forEach((r) => {
          markdown += `## ${r.aiServiceId}\n\n`;
          markdown += `${r.response}\n\n`;
          if (r.responseTime) {
            markdown += `*回應時間: ${r.responseTime}ms*\n\n`;
          }
          markdown += `---\n\n`;
        });

      return markdown;
    },
  },
});
