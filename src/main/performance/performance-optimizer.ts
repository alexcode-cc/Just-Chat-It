/**
 * 效能優化建議器
 * 根據效能報告提供優化建議
 */

import { BrowserWindow } from 'electron';
import { logger } from '../logging';
import type {
  PerformanceReport,
  PerformanceOptimization,
  WindowPerformance,
} from '../../shared/types/performance';

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;

  private constructor() {
    logger.info('PerformanceOptimizer initialized');
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * 分析效能報告並產生優化建議
   */
  analyzeAndOptimize(report: PerformanceReport): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];

    // 分析記憶體使用
    optimizations.push(...this.analyzeMemoryUsage(report));

    // 分析 CPU 使用
    optimizations.push(...this.analyzeCPUUsage(report));

    // 分析視窗數量
    optimizations.push(...this.analyzeWindowCount(report));

    // 分析系統資源
    optimizations.push(...this.analyzeSystemResources(report));

    // 按優先級排序
    return optimizations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 分析記憶體使用
   */
  private analyzeMemoryUsage(
    report: PerformanceReport
  ): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];

    // 檢查主程序記憶體
    const mainMemoryMB = report.mainProcess.memory.total / 1024 / 1024;
    if (mainMemoryMB > 500) {
      optimizations.push({
        id: 'optimize-main-memory',
        title: '優化主程序記憶體使用',
        description: `主程序使用了 ${mainMemoryMB.toFixed(2)} MB 記憶體，建議執行記憶體清理`,
        expectedBenefit: '可釋放 20-30% 的記憶體',
        priority: mainMemoryMB > 1000 ? 5 : 3,
      });
    }

    // 檢查視窗記憶體
    const highMemoryWindows = report.windows.filter(
      (w) => w.memory.total / 1024 / 1024 > 300
    );

    if (highMemoryWindows.length > 0) {
      highMemoryWindows.forEach((window) => {
        const memoryMB = window.memory.total / 1024 / 1024;
        optimizations.push({
          id: `optimize-window-memory-${window.windowId}`,
          title: `優化視窗記憶體 - ${window.title}`,
          description: `視窗 "${window.title}" 使用了 ${memoryMB.toFixed(2)} MB 記憶體`,
          expectedBenefit: '清除快取可釋放 10-20% 的記憶體',
          priority: memoryMB > 500 ? 4 : 2,
          windowId: window.windowId,
        });
      });
    }

    // 檢查系統記憶體
    const systemMemoryPercent =
      ((report.system.totalMemory - report.system.freeMemory) /
        report.system.totalMemory) *
      100;

    if (systemMemoryPercent > 80) {
      optimizations.push({
        id: 'system-memory-low',
        title: '系統記憶體不足',
        description: `系統記憶體使用率達 ${systemMemoryPercent.toFixed(1)}%`,
        expectedBenefit: '關閉未使用的視窗可改善系統效能',
        priority: 5,
      });
    }

    return optimizations;
  }

  /**
   * 分析 CPU 使用
   */
  private analyzeCPUUsage(
    report: PerformanceReport
  ): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];

    // 檢查主程序 CPU
    const mainCPU = report.mainProcess.cpu.percentCPUUsage;
    if (mainCPU > 50) {
      optimizations.push({
        id: 'optimize-main-cpu',
        title: '降低主程序 CPU 使用',
        description: `主程序 CPU 使用率為 ${mainCPU.toFixed(1)}%`,
        expectedBenefit: '暫停背景任務可降低 CPU 使用',
        priority: mainCPU > 70 ? 4 : 2,
      });
    }

    // 檢查高 CPU 使用的視窗
    const highCPUWindows = report.windows.filter(
      (w) => w.cpu.percentCPUUsage > 30
    );

    if (highCPUWindows.length > 0) {
      highCPUWindows.forEach((window) => {
        optimizations.push({
          id: `optimize-window-cpu-${window.windowId}`,
          title: `降低視窗 CPU 使用 - ${window.title}`,
          description: `視窗 "${window.title}" CPU 使用率為 ${window.cpu.percentCPUUsage.toFixed(1)}%`,
          expectedBenefit: '暫停此視窗的活動可降低 CPU 使用',
          priority: 3,
          windowId: window.windowId,
        });
      });
    }

    return optimizations;
  }

  /**
   * 分析視窗數量
   */
  private analyzeWindowCount(
    report: PerformanceReport
  ): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];

    if (report.windows.length > 6) {
      optimizations.push({
        id: 'reduce-window-count',
        title: '減少開啟的視窗數量',
        description: `目前開啟了 ${report.windows.length} 個視窗，建議關閉未使用的視窗`,
        expectedBenefit: '減少視窗可顯著降低記憶體和 CPU 使用',
        priority: report.windows.length > 10 ? 5 : 3,
      });
    }

    return optimizations;
  }

  /**
   * 分析系統資源
   */
  private analyzeSystemResources(
    report: PerformanceReport
  ): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];

    // 檢查系統負載
    const loadAverage = report.system.loadAverage[0];
    const cpuCores = report.system.cpuCores;

    if (loadAverage > cpuCores * 1.5) {
      optimizations.push({
        id: 'high-system-load',
        title: '系統負載過高',
        description: `系統負載為 ${loadAverage.toFixed(2)}，超過 CPU 核心數 ${cpuCores} 的 1.5 倍`,
        expectedBenefit: '關閉其他應用程式可改善整體效能',
        priority: 4,
      });
    }

    return optimizations;
  }

  /**
   * 執行自動優化
   */
  async executeAutoOptimizations(
    optimizations: PerformanceOptimization[]
  ): Promise<number> {
    let executedCount = 0;

    for (const optimization of optimizations) {
      try {
        const executed = await this.executeOptimization(optimization);
        if (executed) {
          executedCount++;
        }
      } catch (error) {
        logger.error('Failed to execute optimization', {
          optimization,
          error,
        });
      }
    }

    logger.info('Auto optimizations executed', { count: executedCount });
    return executedCount;
  }

  /**
   * 執行單一優化建議
   */
  private async executeOptimization(
    optimization: PerformanceOptimization
  ): Promise<boolean> {
    switch (optimization.id.split('-')[0]) {
      case 'optimize':
        if (optimization.windowId) {
          return await this.optimizeWindow(optimization.windowId);
        } else if (optimization.id.includes('main')) {
          return await this.optimizeMainProcess();
        }
        break;

      default:
        // 不自動執行其他類型的優化
        return false;
    }

    return false;
  }

  /**
   * 優化視窗
   */
  private async optimizeWindow(windowId: number): Promise<boolean> {
    const window = BrowserWindow.fromId(windowId);
    if (!window) {
      return false;
    }

    try {
      // 清除快取
      await window.webContents.session.clearCache();
      logger.info('Window optimized', { windowId });
      return true;
    } catch (error) {
      logger.error('Failed to optimize window', { windowId, error });
      return false;
    }
  }

  /**
   * 優化主程序
   */
  private async optimizeMainProcess(): Promise<boolean> {
    try {
      // 強制垃圾回收
      if (global.gc) {
        global.gc();
      }

      // 清除所有視窗的快取
      const windows = BrowserWindow.getAllWindows();
      await Promise.all(
        windows.map((w) => w.webContents.session.clearCache())
      );

      logger.info('Main process optimized');
      return true;
    } catch (error) {
      logger.error('Failed to optimize main process', { error });
      return false;
    }
  }

  /**
   * 獲取優化統計
   */
  getOptimizationStats(report: PerformanceReport): {
    totalMemory: number;
    totalCPU: number;
    windowCount: number;
    highMemoryWindows: number;
    highCPUWindows: number;
  } {
    const totalMemory =
      report.windows.reduce((sum, w) => sum + w.memory.total, 0) +
      report.mainProcess.memory.total;

    const averageCPU =
      report.windows.reduce((sum, w) => sum + w.cpu.percentCPUUsage, 0) /
      (report.windows.length || 1);

    return {
      totalMemory: totalMemory / 1024 / 1024, // MB
      totalCPU: averageCPU,
      windowCount: report.windows.length,
      highMemoryWindows: report.windows.filter(
        (w) => w.memory.total / 1024 / 1024 > 300
      ).length,
      highCPUWindows: report.windows.filter((w) => w.cpu.percentCPUUsage > 30)
        .length,
    };
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();
