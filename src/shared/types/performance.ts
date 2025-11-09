/**
 * 效能監控相關類型定義
 */

/**
 * 記憶體使用資訊
 */
export interface MemoryUsage {
  /** 工作集大小（實際使用的物理記憶體） */
  workingSetSize: number;
  /** 私有位元組 */
  privateBytes: number;
  /** 共享位元組 */
  sharedBytes: number;
  /** 總記憶體 */
  total: number;
  /** 已使用記憶體百分比 */
  usagePercent: number;
}

/**
 * CPU 使用資訊
 */
export interface CPUUsage {
  /** CPU 使用百分比 */
  percentCPUUsage: number;
  /** 閒置時間 */
  idleWakeupsPerSecond: number;
}

/**
 * 渲染效能資訊
 */
export interface RenderPerformance {
  /** FPS (每秒幀數) */
  fps: number;
  /** 平均渲染時間 (ms) */
  averageRenderTime: number;
  /** 最大渲染時間 (ms) */
  maxRenderTime: number;
  /** 掉幀數量 */
  droppedFrames: number;
}

/**
 * 視窗效能資訊
 */
export interface WindowPerformance {
  /** 視窗 ID */
  windowId: number;
  /** 視窗標題 */
  title: string;
  /** 記憶體使用 */
  memory: MemoryUsage;
  /** CPU 使用 */
  cpu: CPUUsage;
  /** 渲染效能 */
  render?: RenderPerformance;
}

/**
 * 系統效能資訊
 */
export interface SystemPerformance {
  /** 總記憶體 (bytes) */
  totalMemory: number;
  /** 可用記憶體 (bytes) */
  freeMemory: number;
  /** CPU 核心數 */
  cpuCores: number;
  /** 系統 CPU 使用率 */
  systemCPU: number;
  /** 系統負載 */
  loadAverage: number[];
}

/**
 * 完整的效能報告
 */
export interface PerformanceReport {
  /** 時間戳 */
  timestamp: number;
  /** 系統效能 */
  system: SystemPerformance;
  /** 各視窗效能 */
  windows: WindowPerformance[];
  /** 主程序效能 */
  mainProcess: {
    memory: MemoryUsage;
    cpu: CPUUsage;
  };
}

/**
 * 效能警告等級
 */
export enum PerformanceWarningLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * 效能警告
 */
export interface PerformanceWarning {
  /** 警告 ID */
  id: string;
  /** 警告等級 */
  level: PerformanceWarningLevel;
  /** 警告類型 */
  type: 'memory' | 'cpu' | 'render' | 'system';
  /** 警告訊息 */
  message: string;
  /** 建議 */
  suggestion: string;
  /** 當前值 */
  currentValue: number;
  /** 閾值 */
  threshold: number;
  /** 時間戳 */
  timestamp: number;
}

/**
 * 效能優化建議
 */
export interface PerformanceOptimization {
  /** 建議 ID */
  id: string;
  /** 建議標題 */
  title: string;
  /** 建議描述 */
  description: string;
  /** 預期效益 */
  expectedBenefit: string;
  /** 優先級 (1-5, 5 為最高) */
  priority: number;
  /** 相關視窗 */
  windowId?: number;
}

/**
 * 效能監控配置
 */
export interface PerformanceMonitorConfig {
  /** 監控間隔 (ms) */
  interval: number;
  /** 記憶體警告閾值 (MB) */
  memoryWarningThreshold: number;
  /** 記憶體嚴重閾值 (MB) */
  memoryCriticalThreshold: number;
  /** CPU 警告閾值 (%) */
  cpuWarningThreshold: number;
  /** CPU 嚴重閾值 (%) */
  cpuCriticalThreshold: number;
  /** FPS 警告閾值 */
  fpsWarningThreshold: number;
  /** 是否啟用自動優化 */
  enableAutoOptimization: boolean;
}
