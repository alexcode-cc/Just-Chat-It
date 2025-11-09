/**
 * 效能監控管理器
 * 負責監控應用程式的記憶體、CPU 和渲染效能
 */

import { app, BrowserWindow } from 'electron';
import * as os from 'os';
import { logger } from '../logging';
import type {
  PerformanceReport,
  SystemPerformance,
  WindowPerformance,
  MemoryUsage,
  CPUUsage,
  PerformanceWarning,
  PerformanceWarningLevel,
  PerformanceMonitorConfig,
} from '../../shared/types/performance';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCPUUsage = process.cpuUsage();
  private lastCheck = Date.now();
  private warnings: PerformanceWarning[] = [];
  private config: PerformanceMonitorConfig = {
    interval: 5000, // 每 5 秒檢查一次
    memoryWarningThreshold: 500, // 500 MB
    memoryCriticalThreshold: 1000, // 1 GB
    cpuWarningThreshold: 70, // 70%
    cpuCriticalThreshold: 90, // 90%
    fpsWarningThreshold: 30, // 30 FPS
    enableAutoOptimization: true,
  };

  private constructor() {
    logger.info('PerformanceMonitor initialized');
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 開始監控
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      logger.warn('Performance monitoring already started');
      return;
    }

    logger.info('Starting performance monitoring', {
      interval: this.config.interval,
    });

    this.monitoringInterval = setInterval(() => {
      this.checkPerformance();
    }, this.config.interval);
  }

  /**
   * 停止監控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Performance monitoring stopped');
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Performance monitor config updated', this.config);

    // 重新啟動監控以應用新的間隔
    if (this.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * 獲取當前配置
   */
  getConfig(): PerformanceMonitorConfig {
    return { ...this.config };
  }

  /**
   * 檢查效能
   */
  private async checkPerformance(): Promise<void> {
    try {
      const report = await this.getPerformanceReport();
      this.analyzePerformance(report);
    } catch (error) {
      logger.error('Failed to check performance', { error });
    }
  }

  /**
   * 獲取效能報告
   */
  async getPerformanceReport(): Promise<PerformanceReport> {
    const windows = BrowserWindow.getAllWindows();
    const windowPerformances: WindowPerformance[] = [];

    for (const window of windows) {
      const webContents = window.webContents;
      const processMemory = await app.getAppMetrics();
      const windowMetrics = processMemory.find(
        (metric) => metric.pid === webContents.getOSProcessId()
      );

      if (windowMetrics) {
        windowPerformances.push({
          windowId: window.id,
          title: window.getTitle(),
          memory: this.formatMemoryUsage(windowMetrics.memory),
          cpu: this.getCPUUsage(windowMetrics.cpu),
        });
      }
    }

    const mainProcessMemory = process.memoryUsage();
    const report: PerformanceReport = {
      timestamp: Date.now(),
      system: this.getSystemPerformance(),
      windows: windowPerformances,
      mainProcess: {
        memory: {
          workingSetSize: mainProcessMemory.rss,
          privateBytes: mainProcessMemory.heapUsed,
          sharedBytes: mainProcessMemory.external,
          total: mainProcessMemory.rss,
          usagePercent: (mainProcessMemory.rss / os.totalmem()) * 100,
        },
        cpu: this.getProcessCPUUsage(),
      },
    };

    return report;
  }

  /**
   * 獲取系統效能資訊
   */
  private getSystemPerformance(): SystemPerformance {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // 計算系統 CPU 使用率
    const systemCPU = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    return {
      totalMemory,
      freeMemory,
      cpuCores: cpus.length,
      systemCPU,
      loadAverage,
    };
  }

  /**
   * 格式化記憶體使用資訊
   */
  private formatMemoryUsage(memory: {
    workingSetSize: number;
    peakWorkingSetSize: number;
    privateBytes?: number;
  }): MemoryUsage {
    const total = os.totalmem();
    const workingSetSize = memory.workingSetSize;

    return {
      workingSetSize,
      privateBytes: memory.privateBytes || 0,
      sharedBytes: 0,
      total: workingSetSize,
      usagePercent: (workingSetSize / total) * 100,
    };
  }

  /**
   * 獲取 CPU 使用資訊
   */
  private getCPUUsage(cpu?: {
    percentCPUUsage: number;
    idleWakeupsPerSecond: number;
  }): CPUUsage {
    if (cpu) {
      return {
        percentCPUUsage: cpu.percentCPUUsage,
        idleWakeupsPerSecond: cpu.idleWakeupsPerSecond,
      };
    }

    return {
      percentCPUUsage: 0,
      idleWakeupsPerSecond: 0,
    };
  }

  /**
   * 獲取程序 CPU 使用率
   */
  private getProcessCPUUsage(): CPUUsage {
    const currentUsage = process.cpuUsage();
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastCheck;

    const userDiff = currentUsage.user - this.lastCPUUsage.user;
    const systemDiff = currentUsage.system - this.lastCPUUsage.system;
    const totalDiff = userDiff + systemDiff;

    const percentCPUUsage = (totalDiff / (timeDiff * 1000)) * 100;

    this.lastCPUUsage = currentUsage;
    this.lastCheck = currentTime;

    return {
      percentCPUUsage,
      idleWakeupsPerSecond: 0,
    };
  }

  /**
   * 分析效能並產生警告
   */
  private analyzePerformance(report: PerformanceReport): void {
    const newWarnings: PerformanceWarning[] = [];

    // 檢查主程序記憶體使用
    const mainMemoryMB = report.mainProcess.memory.total / 1024 / 1024;
    if (mainMemoryMB > this.config.memoryCriticalThreshold) {
      newWarnings.push({
        id: `memory-main-${Date.now()}`,
        level: 'critical' as PerformanceWarningLevel,
        type: 'memory',
        message: '主程序記憶體使用過高',
        suggestion: '建議關閉一些未使用的視窗，或重新啟動應用程式',
        currentValue: mainMemoryMB,
        threshold: this.config.memoryCriticalThreshold,
        timestamp: Date.now(),
      });
    } else if (mainMemoryMB > this.config.memoryWarningThreshold) {
      newWarnings.push({
        id: `memory-main-${Date.now()}`,
        level: 'warning' as PerformanceWarningLevel,
        type: 'memory',
        message: '主程序記憶體使用偏高',
        suggestion: '建議關閉一些未使用的視窗',
        currentValue: mainMemoryMB,
        threshold: this.config.memoryWarningThreshold,
        timestamp: Date.now(),
      });
    }

    // 檢查主程序 CPU 使用
    const mainCPU = report.mainProcess.cpu.percentCPUUsage;
    if (mainCPU > this.config.cpuCriticalThreshold) {
      newWarnings.push({
        id: `cpu-main-${Date.now()}`,
        level: 'critical' as PerformanceWarningLevel,
        type: 'cpu',
        message: '主程序 CPU 使用率過高',
        suggestion: '建議暫停一些背景任務或重新啟動應用程式',
        currentValue: mainCPU,
        threshold: this.config.cpuCriticalThreshold,
        timestamp: Date.now(),
      });
    } else if (mainCPU > this.config.cpuWarningThreshold) {
      newWarnings.push({
        id: `cpu-main-${Date.now()}`,
        level: 'warning' as PerformanceWarningLevel,
        type: 'cpu',
        message: '主程序 CPU 使用率偏高',
        suggestion: '建議暫停一些背景任務',
        currentValue: mainCPU,
        threshold: this.config.cpuWarningThreshold,
        timestamp: Date.now(),
      });
    }

    // 檢查系統記憶體
    const systemMemoryPercent =
      ((report.system.totalMemory - report.system.freeMemory) /
        report.system.totalMemory) *
      100;
    if (systemMemoryPercent > 90) {
      newWarnings.push({
        id: `system-memory-${Date.now()}`,
        level: 'critical' as PerformanceWarningLevel,
        type: 'system',
        message: '系統記憶體不足',
        suggestion: '建議關閉其他應用程式以釋放記憶體',
        currentValue: systemMemoryPercent,
        threshold: 90,
        timestamp: Date.now(),
      });
    }

    // 更新警告列表（保留最近 100 個警告）
    this.warnings = [...newWarnings, ...this.warnings].slice(0, 100);

    // 如果有新警告，記錄到日誌
    if (newWarnings.length > 0) {
      logger.warn('Performance warnings detected', {
        count: newWarnings.length,
        warnings: newWarnings,
      });

      // 發送警告給渲染程序
      this.notifyRendererProcesses(newWarnings);
    }
  }

  /**
   * 通知渲染程序
   */
  private notifyRendererProcesses(warnings: PerformanceWarning[]): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send('performance:warning', warnings);
    });
  }

  /**
   * 獲取警告列表
   */
  getWarnings(): PerformanceWarning[] {
    return [...this.warnings];
  }

  /**
   * 清除警告
   */
  clearWarnings(): void {
    this.warnings = [];
    logger.info('Performance warnings cleared');
  }

  /**
   * 執行記憶體優化
   */
  async optimizeMemory(): Promise<void> {
    logger.info('Starting memory optimization');

    const windows = BrowserWindow.getAllWindows();
    let optimizedCount = 0;

    for (const window of windows) {
      try {
        // 清除快取
        await window.webContents.session.clearCache();
        optimizedCount++;
      } catch (error) {
        logger.error('Failed to optimize window memory', {
          windowId: window.id,
          error,
        });
      }
    }

    // 強制垃圾回收（如果有 --expose-gc flag）
    if (global.gc) {
      global.gc();
    }

    logger.info('Memory optimization completed', {
      optimizedWindows: optimizedCount,
    });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
