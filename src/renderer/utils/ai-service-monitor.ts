/**
 * AI 服務狀態監控系統
 * 負責檢查 AI 服務的可用性和健康狀態
 */

import type { AIService } from '../../shared/types/database';

export interface ServiceHealthStatus {
  serviceId: string;
  isOnline: boolean;
  responseTime: number;
  lastChecked: Date;
  errorMessage?: string;
}

export class AIServiceMonitor {
  private healthStatus: Map<string, ServiceHealthStatus> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(status: ServiceHealthStatus) => void>> = new Map();

  /**
   * 開始監控所有服務
   * @param services 要監控的服務列表
   * @param interval 檢查間隔（毫秒），預設 5 分鐘
   */
  startMonitoring(services: AIService[], interval: number = 5 * 60 * 1000) {
    // 立即執行一次檢查
    this.checkAllServices(services);

    // 設定定期檢查
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkAllServices(services);
    }, interval);
  }

  /**
   * 停止監控
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 檢查所有服務的健康狀態
   */
  private async checkAllServices(services: AIService[]) {
    const checkPromises = services.map((service) => this.checkServiceHealth(service));
    await Promise.allSettled(checkPromises);
  }

  /**
   * 檢查單一服務的健康狀態
   */
  async checkServiceHealth(service: AIService): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    let status: ServiceHealthStatus;

    try {
      // 嘗試發送 HEAD 請求檢查服務是否可訪問
      const response = await fetch(service.webUrl, {
        method: 'HEAD',
        mode: 'no-cors', // 避免 CORS 問題
        cache: 'no-cache',
      });

      const responseTime = Date.now() - startTime;

      status = {
        serviceId: service.id,
        isOnline: true,
        responseTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      status = {
        serviceId: service.id,
        isOnline: false,
        responseTime,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : '未知錯誤',
      };
    }

    // 更新狀態
    this.healthStatus.set(service.id, status);

    // 通知監聽器
    this.notifyListeners(service.id, status);

    return status;
  }

  /**
   * 取得服務的健康狀態
   */
  getHealthStatus(serviceId: string): ServiceHealthStatus | undefined {
    return this.healthStatus.get(serviceId);
  }

  /**
   * 取得所有服務的健康狀態
   */
  getAllHealthStatus(): ServiceHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * 監聽特定服務的狀態變化
   */
  onStatusChange(serviceId: string, callback: (status: ServiceHealthStatus) => void) {
    if (!this.listeners.has(serviceId)) {
      this.listeners.set(serviceId, new Set());
    }
    this.listeners.get(serviceId)!.add(callback);

    // 返回取消監聽的函數
    return () => {
      const listeners = this.listeners.get(serviceId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * 通知監聽器
   */
  private notifyListeners(serviceId: string, status: ServiceHealthStatus) {
    const listeners = this.listeners.get(serviceId);
    if (listeners) {
      listeners.forEach((callback) => callback(status));
    }
  }

  /**
   * 清理資源
   */
  destroy() {
    this.stopMonitoring();
    this.healthStatus.clear();
    this.listeners.clear();
  }
}

// 單例實例
let monitorInstance: AIServiceMonitor | null = null;

/**
 * 取得 AI 服務監控實例（單例）
 */
export function getAIServiceMonitor(): AIServiceMonitor {
  if (!monitorInstance) {
    monitorInstance = new AIServiceMonitor();
  }
  return monitorInstance;
}

/**
 * Vue 組合式函數：使用 AI 服務監控
 */
export function useAIServiceMonitor(serviceId?: string) {
  const monitor = getAIServiceMonitor();

  /**
   * 取得健康狀態
   */
  const getStatus = (id: string) => {
    return monitor.getHealthStatus(id);
  };

  /**
   * 檢查服務健康狀態
   */
  const checkHealth = async (service: AIService) => {
    return await monitor.checkServiceHealth(service);
  };

  /**
   * 監聽狀態變化
   */
  const watchStatus = (id: string, callback: (status: ServiceHealthStatus) => void) => {
    return monitor.onStatusChange(id, callback);
  };

  return {
    monitor,
    getStatus,
    checkHealth,
    watchStatus,
  };
}
