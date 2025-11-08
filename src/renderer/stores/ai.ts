import { defineStore } from 'pinia';
import type { AIService, QuotaInfo } from '../../shared/types/database';

interface AIStoreState {
  services: AIService[];
  quotaStatus: Map<string, QuotaInfo>;
  loading: boolean;
  error: string | null;
}

export const useAIStore = defineStore('ai', {
  state: (): AIStoreState => ({
    services: [],
    quotaStatus: new Map(),
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * 取得可用的AI服務
     */
    availableServices(state): AIService[] {
      return state.services.filter((service) => service.isAvailable);
    },

    /**
     * 根據ID取得服務
     */
    getServiceById(state) {
      return (id: string): AIService | undefined => {
        return state.services.find((service) => service.id === id);
      };
    },

    /**
     * 取得服務的額度狀態
     */
    getQuotaStatus(state) {
      return (serviceId: string): QuotaInfo | undefined => {
        return state.quotaStatus.get(serviceId);
      };
    },
  },

  actions: {
    /**
     * 載入所有AI服務
     */
    async loadAIServices() {
      this.loading = true;
      this.error = null;

      try {
        const services = (await window.electronAPI.loadData('ai_services')) as AIService[];
        this.services = services;
      } catch (error) {
        this.error = `載入AI服務失敗: ${error}`;
        console.error('Failed to load AI services:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 建立聊天視窗
     */
    async createChatWindow(serviceId: string) {
      try {
        await window.electronAPI.createChatWindow(serviceId);

        // 更新最後使用時間
        await this.updateLastUsed(serviceId);
      } catch (error) {
        this.error = `開啟聊天視窗失敗: ${error}`;
        console.error('Failed to create chat window:', error);
        throw error;
      }
    },

    /**
     * 更新服務的額度狀態
     */
    async updateQuotaStatus(serviceId: string, isAvailable: boolean, resetTime?: Date) {
      try {
        await window.electronAPI.saveData('ai_services', {
          id: serviceId,
          isAvailable,
          quotaResetTime: resetTime,
        });

        // 更新本地狀態
        const service = this.services.find((s) => s.id === serviceId);
        if (service) {
          service.isAvailable = isAvailable;
          service.quotaResetTime = resetTime;
        }

        // 更新額度狀態
        this.quotaStatus.set(serviceId, {
          serviceId,
          isAvailable,
          resetTime,
        });
      } catch (error) {
        this.error = `更新額度狀態失敗: ${error}`;
        console.error('Failed to update quota status:', error);
      }
    },

    /**
     * 更新最後使用時間
     */
    async updateLastUsed(serviceId: string) {
      try {
        await window.electronAPI.saveData('ai_services', {
          id: serviceId,
          lastUsed: new Date(),
        });

        // 更新本地狀態
        const service = this.services.find((s) => s.id === serviceId);
        if (service) {
          service.lastUsed = new Date();
        }
      } catch (error) {
        console.error('Failed to update last used:', error);
      }
    },

    /**
     * 檢查所有服務的可用性
     */
    async checkAvailability() {
      // 檢查額度重置時間是否已過
      const now = new Date();

      for (const service of this.services) {
        if (!service.isAvailable && service.quotaResetTime) {
          if (now >= service.quotaResetTime) {
            // 額度已重置，更新狀態
            await this.updateQuotaStatus(service.id, true);
          }
        }
      }
    },
  },
});
