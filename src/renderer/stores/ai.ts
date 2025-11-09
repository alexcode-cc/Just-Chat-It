import { defineStore } from 'pinia';
import type { AIService, QuotaInfo, QuotaTracking } from '../../shared/types/database';

interface AIStoreState {
  services: AIService[];
  quotaStatus: Map<string, QuotaInfo>;
  quotaTrackings: Map<string, QuotaTracking>;
  loading: boolean;
  error: string | null;
}

export const useAIStore = defineStore('ai', {
  state: (): AIStoreState => ({
    services: [],
    quotaStatus: new Map(),
    quotaTrackings: new Map(),
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

    /**
     * 取得服務的額度追蹤資訊
     */
    getQuotaTracking(state) {
      return (serviceId: string): QuotaTracking | undefined => {
        return state.quotaTrackings.get(serviceId);
      };
    },

    /**
     * 取得已用盡額度的服務
     */
    depletedServices(state): QuotaTracking[] {
      return Array.from(state.quotaTrackings.values()).filter(
        (quota) => quota.quotaStatus === 'depleted',
      );
    },

    /**
     * 取得即將重置的額度（24小時內）
     */
    upcomingResets(state): QuotaTracking[] {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      return Array.from(state.quotaTrackings.values()).filter((quota) => {
        if (!quota.quotaResetTime) return false;
        const resetTime = new Date(quota.quotaResetTime);
        return resetTime > now && resetTime <= tomorrow;
      });
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

    /**
     * 載入所有額度追蹤資訊
     */
    async loadQuotaTrackings() {
      try {
        const quotas = (await window.electronAPI.getAllQuotas()) as QuotaTracking[];
        this.quotaTrackings.clear();
        quotas.forEach((quota) => {
          this.quotaTrackings.set(quota.aiServiceId, quota);
        });
      } catch (error) {
        console.error('Failed to load quota trackings:', error);
        this.error = `載入額度追蹤資訊失敗: ${error}`;
      }
    },

    /**
     * 載入特定服務的額度追蹤資訊
     */
    async loadQuotaTracking(serviceId: string) {
      try {
        const quota = (await window.electronAPI.getQuotaByService(serviceId)) as
          | QuotaTracking
          | undefined;
        if (quota) {
          this.quotaTrackings.set(serviceId, quota);
        }
        return quota;
      } catch (error) {
        console.error(`Failed to load quota tracking for ${serviceId}:`, error);
        throw error;
      }
    },

    /**
     * 標記額度為已用盡
     */
    async markQuotaDepleted(serviceId: string, resetTime?: Date, notes?: string) {
      try {
        const quota = (await window.electronAPI.markQuotaDepleted({
          aiServiceId: serviceId,
          resetTime: resetTime?.toISOString(),
          notes,
        })) as QuotaTracking;

        this.quotaTrackings.set(serviceId, quota);

        // 同時更新服務狀態
        await this.updateQuotaStatus(serviceId, false, resetTime);

        return quota;
      } catch (error) {
        console.error(`Failed to mark quota as depleted for ${serviceId}:`, error);
        this.error = `標記額度用盡失敗: ${error}`;
        throw error;
      }
    },

    /**
     * 標記額度為可用
     */
    async markQuotaAvailable(serviceId: string, resetTime?: Date) {
      try {
        const quota = (await window.electronAPI.markQuotaAvailable({
          aiServiceId: serviceId,
          resetTime: resetTime?.toISOString(),
        })) as QuotaTracking;

        this.quotaTrackings.set(serviceId, quota);

        // 同時更新服務狀態
        await this.updateQuotaStatus(serviceId, true, resetTime);

        return quota;
      } catch (error) {
        console.error(`Failed to mark quota as available for ${serviceId}:`, error);
        this.error = `標記額度可用失敗: ${error}`;
        throw error;
      }
    },

    /**
     * 更新額度重置時間
     */
    async updateQuotaResetTime(serviceId: string, resetTime: Date) {
      try {
        const quota = (await window.electronAPI.updateQuotaResetTime({
          aiServiceId: serviceId,
          resetTime: resetTime.toISOString(),
        })) as QuotaTracking;

        if (quota) {
          this.quotaTrackings.set(serviceId, quota);
        }

        return quota;
      } catch (error) {
        console.error(`Failed to update quota reset time for ${serviceId}:`, error);
        this.error = `更新額度重置時間失敗: ${error}`;
        throw error;
      }
    },

    /**
     * 更新額度通知設定
     */
    async updateQuotaNotifySettings(
      serviceId: string,
      notifyEnabled: boolean,
      notifyBeforeMinutes?: number,
    ) {
      try {
        const quota = (await window.electronAPI.updateQuotaNotifySettings({
          aiServiceId: serviceId,
          notifyEnabled,
          notifyBeforeMinutes,
        })) as QuotaTracking;

        this.quotaTrackings.set(serviceId, quota);

        return quota;
      } catch (error) {
        console.error(`Failed to update quota notify settings for ${serviceId}:`, error);
        this.error = `更新通知設定失敗: ${error}`;
        throw error;
      }
    },

    /**
     * 觸發額度檢查（立即檢查並發送通知）
     */
    async triggerQuotaCheck() {
      try {
        await window.electronAPI.triggerQuotaCheck();
        // 重新載入額度資訊
        await this.loadQuotaTrackings();
      } catch (error) {
        console.error('Failed to trigger quota check:', error);
        this.error = `觸發額度檢查失敗: ${error}`;
      }
    },
  },
});
