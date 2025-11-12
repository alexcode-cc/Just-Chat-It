/**
 * Liquid Glass 動態光影效果類別
 * 處理滑鼠追蹤、動態光影漸層、波紋效果等互動視覺效果
 */

export interface LiquidGlassOptions {
  // 是否啟用滑鼠追蹤
  enableMouseTracking?: boolean;
  // 是否啟用點擊波紋效果
  enableRipple?: boolean;
  // 光影強度 (0-1)
  lightIntensity?: number;
  // 光影擴散範圍 (%)
  lightRadius?: number;
  // 是否啟用捲動光影效果
  enableScrollEffect?: boolean;
}

export class LiquidGlassEffect {
  private element: HTMLElement;
  private rect: DOMRect;
  private options: Required<LiquidGlassOptions>;
  private rafId: number | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isHovering: boolean = false;

  // 預設選項
  private static readonly DEFAULT_OPTIONS: Required<LiquidGlassOptions> = {
    enableMouseTracking: true,
    enableRipple: true,
    lightIntensity: 0.3,
    lightRadius: 60,
    enableScrollEffect: true,
  };

  constructor(element: HTMLElement, options: LiquidGlassOptions = {}) {
    // 驗證元素是否為有效的 DOM 元素
    if (!element || !(element instanceof HTMLElement) || typeof element.getBoundingClientRect !== 'function') {
      console.error('LiquidGlassEffect: Invalid element provided', element);
      // 創建一個空的 div 元素作為回退
      this.element = document.createElement('div');
    } else {
      this.element = element;
    }

    this.options = { ...LiquidGlassEffect.DEFAULT_OPTIONS, ...options };
    this.rect = this.element.getBoundingClientRect();
    this.init();
  }

  /**
   * 初始化所有效果
   */
  private init(): void {
    if (this.options.enableMouseTracking) {
      this.setupMouseTracking();
    }

    if (this.options.enableRipple) {
      this.setupRippleEffect();
    }

    if (this.options.enableScrollEffect) {
      this.setupScrollEffect();
    }

    // 監聽視窗大小變化，更新元素位置
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * 設定滑鼠追蹤效果
   */
  private setupMouseTracking(): void {
    this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  /**
   * 處理滑鼠進入
   */
  private handleMouseEnter(e: MouseEvent): void {
    this.isHovering = true;
    this.rect = this.element.getBoundingClientRect();
    this.updateDynamicLight(e);
  }

  /**
   * 處理滑鼠離開
   */
  private handleMouseLeave(): void {
    this.isHovering = false;
    this.element.style.setProperty('--dynamic-light', 'transparent');
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 處理滑鼠移動
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isHovering) return;

    // 使用 requestAnimationFrame 優化性能
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.updateDynamicLight(e);
    });
  }

  /**
   * 更新動態光影
   */
  private updateDynamicLight(e: MouseEvent): void {
    const x = ((e.clientX - this.rect.left) / this.rect.width) * 100;
    const y = ((e.clientY - this.rect.top) / this.rect.height) * 100;

    this.mouseX = x;
    this.mouseY = y;

    // 設定 CSS 變數
    this.element.style.setProperty('--mouse-x', `${x}%`);
    this.element.style.setProperty('--mouse-y', `${y}%`);

    // 動態光影漸層
    const gradient = `radial-gradient(
      circle at ${x}% ${y}%,
      rgba(255, 255, 255, ${this.options.lightIntensity}) 0%,
      rgba(255, 255, 255, ${this.options.lightIntensity * 0.5}) ${this.options.lightRadius * 0.3}%,
      transparent ${this.options.lightRadius}%
    )`;

    this.element.style.setProperty('--dynamic-light', gradient);
  }

  /**
   * 設定波紋效果
   */
  private setupRippleEffect(): void {
    this.element.addEventListener('click', this.createRipple.bind(this));
  }

  /**
   * 創建波紋動畫
   */
  private createRipple(e: MouseEvent): void {
    const ripple = document.createElement('span');
    const rect = this.element.getBoundingClientRect();

    // 計算點擊位置
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 計算波紋大小（取元素最大邊長的2倍）
    const size = Math.max(rect.width, rect.height) * 2;

    // 設定波紋樣式
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      margin-left: ${-size / 2}px;
      margin-top: ${-size / 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      pointer-events: none;
      animation: ripple 0.6s ease-out;
      z-index: 999;
    `;

    // 確保元素有相對定位
    if (getComputedStyle(this.element).position === 'static') {
      this.element.style.position = 'relative';
    }

    this.element.appendChild(ripple);

    // 動畫結束後移除波紋
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  /**
   * 設定捲動光影效果
   */
  private setupScrollEffect(): void {
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = (): void => {
      // 添加捲動類別
      this.element.classList.add('liquid-glass-scrolling');

      // 清除之前的計時器
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // 捲動停止後移除類別
      scrollTimeout = setTimeout(() => {
        this.element.classList.remove('liquid-glass-scrolling');
      }, 150);
    };

    // 監聽元素或其父容器的捲動事件
    const scrollContainer = this.findScrollContainer();
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  /**
   * 尋找可捲動的父容器
   */
  private findScrollContainer(): HTMLElement | null {
    let parent = this.element.parentElement;

    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }

    return null;
  }

  /**
   * 處理視窗大小變化
   */
  private handleResize(): void {
    this.rect = this.element.getBoundingClientRect();
  }

  /**
   * 更新選項
   */
  public updateOptions(options: Partial<LiquidGlassOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 銷毀效果，清理事件監聽器
   */
  public destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    // 移除所有事件監聽器
    window.removeEventListener('resize', this.handleResize.bind(this));

    // 重置 CSS 變數
    this.element.style.removeProperty('--mouse-x');
    this.element.style.removeProperty('--mouse-y');
    this.element.style.removeProperty('--dynamic-light');
  }

  /**
   * 靜態方法：批量應用效果到多個元素
   */
  public static applyToElements(
    selector: string,
    options?: LiquidGlassOptions
  ): LiquidGlassEffect[] {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    const instances: LiquidGlassEffect[] = [];

    elements.forEach((element) => {
      instances.push(new LiquidGlassEffect(element, options));
    });

    return instances;
  }
}

/**
 * Vue 3 Composition API 用的 composable
 */
export function useLiquidGlass(
  elementRef: { value: HTMLElement | null },
  options: LiquidGlassOptions = {}
) {
  let instance: LiquidGlassEffect | null = null;

  const init = (): void => {
    if (elementRef.value && !instance) {
      instance = new LiquidGlassEffect(elementRef.value, options);
    }
  };

  const destroy = (): void => {
    if (instance) {
      instance.destroy();
      instance = null;
    }
  };

  const updateOptions = (newOptions: Partial<LiquidGlassOptions>): void => {
    if (instance) {
      instance.updateOptions(newOptions);
    }
  };

  return {
    init,
    destroy,
    updateOptions,
    getInstance: () => instance,
  };
}
