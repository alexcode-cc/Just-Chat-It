/**
 * Vuetify Liquid Glass 主題配置
 * 提供淺色和深色兩種 Liquid Glass 主題
 */

import { createVuetify, type ThemeDefinition } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// ============================================================================
// Liquid Glass 淺色主題
// ============================================================================
const liquidGlassLight: ThemeDefinition = {
  dark: false,
  colors: {
    // 主要顏色
    primary: '#6366F1', // Indigo
    secondary: '#8B5CF6', // Purple
    accent: '#3B82F6', // Blue
    error: '#EF4444', // Red
    warning: '#F59E0B', // Amber
    info: '#06B6D4', // Cyan
    success: '#10B981', // Green

    // 背景和表面
    background: '#F8FAFC', // 極淺灰藍
    surface: 'rgba(255, 255, 255, 0.1)', // 透明白色

    // 文字顏色
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-background': '#1E293B', // 深灰藍
    'on-surface': '#334155', // 中深灰

    // Liquid Glass 特定顏色
    'glass-bg': 'rgba(255, 255, 255, 0.1)',
    'glass-border': 'rgba(255, 255, 255, 0.2)',
    'glass-highlight': 'rgba(255, 255, 255, 0.3)',
    'glass-shadow': 'rgba(0, 0, 0, 0.1)',
  },
  variables: {
    // 邊框
    'border-color': 'rgba(255, 255, 255, 0.2)',
    'border-opacity': 0.2,

    // 玻璃效果參數
    'glass-blur': '20px',
    'glass-saturation': '180%',
    'glass-opacity': 0.1,
    'glass-radius': '16px',

    // 陰影
    'shadow-key-umbra-opacity': 0.1,
    'shadow-key-penumbra-opacity': 0.08,
    'shadow-key-ambient-opacity': 0.05,

    // 動畫
    'transition-fast': '0.2s',
    'transition-normal': '0.3s',
    'transition-slow': '0.6s',
  },
};

// ============================================================================
// Liquid Glass 深色主題
// ============================================================================
const liquidGlassDark: ThemeDefinition = {
  dark: true,
  colors: {
    // 主要顏色（深色模式下使用稍微亮一點的顏色）
    primary: '#818CF8', // Lighter Indigo
    secondary: '#A78BFA', // Lighter Purple
    accent: '#60A5FA', // Lighter Blue
    error: '#F87171', // Lighter Red
    warning: '#FCD34D', // Lighter Amber
    info: '#22D3EE', // Lighter Cyan
    success: '#34D399', // Lighter Green

    // 背景和表面
    background: '#0F172A', // 極深藍灰
    surface: 'rgba(0, 0, 0, 0.2)', // 透明黑色

    // 文字顏色
    'on-primary': '#0F172A',
    'on-secondary': '#0F172A',
    'on-background': '#F1F5F9', // 淺灰白
    'on-surface': '#CBD5E1', // 中淺灰

    // Liquid Glass 特定顏色
    'glass-bg': 'rgba(0, 0, 0, 0.3)',
    'glass-border': 'rgba(255, 255, 255, 0.1)',
    'glass-highlight': 'rgba(255, 255, 255, 0.15)',
    'glass-shadow': 'rgba(0, 0, 0, 0.5)',
  },
  variables: {
    // 邊框
    'border-color': 'rgba(255, 255, 255, 0.1)',
    'border-opacity': 0.1,

    // 玻璃效果參數
    'glass-blur': '24px',
    'glass-saturation': '200%',
    'glass-opacity': 0.15,
    'glass-radius': '16px',

    // 陰影
    'shadow-key-umbra-opacity': 0.3,
    'shadow-key-penumbra-opacity': 0.2,
    'shadow-key-ambient-opacity': 0.15,

    // 動畫
    'transition-fast': '0.2s',
    'transition-normal': '0.3s',
    'transition-slow': '0.6s',
  },
};

// ============================================================================
// Vuetify 配置
// ============================================================================
export default createVuetify({
  components,
  directives,

  // 主題配置
  theme: {
    defaultTheme: 'liquidGlassLight',
    themes: {
      liquidGlassLight,
      liquidGlassDark,
    },
    variations: {
      colors: ['primary', 'secondary', 'accent'],
      lighten: 5,
      darken: 5,
    },
  },

  // 全局屬性
  defaults: {
    // VBtn 預設屬性
    VBtn: {
      elevation: 0,
      class: 'text-none',
      style: 'letter-spacing: normal;',
    },

    // VCard 預設屬性
    VCard: {
      elevation: 0,
      class: 'liquid-glass',
    },

    // VSheet 預設屬性
    VSheet: {
      elevation: 0,
    },

    // VTextField 預設屬性
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },

    // VSelect 預設屬性
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },

    // VTextarea 預設屬性
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
    },

    // VSwitch 預設屬性
    VSwitch: {
      color: 'primary',
      inset: true,
    },

    // VCheckbox 預設屬性
    VCheckbox: {
      color: 'primary',
    },

    // VRadio 預設屬性
    VRadio: {
      color: 'primary',
    },

    // VSlider 預設屬性
    VSlider: {
      color: 'primary',
      thumbLabel: true,
    },

    // VProgressLinear 預設屬性
    VProgressLinear: {
      color: 'primary',
      height: 4,
    },

    // VProgressCircular 預設屬性
    VProgressCircular: {
      color: 'primary',
      width: 3,
    },

    // VChip 預設屬性
    VChip: {
      class: 'liquid-glass-subtle',
    },

    // VTooltip 預設屬性
    VTooltip: {
      location: 'top',
      openDelay: 500,
    },

    // VDialog 預設屬性
    VDialog: {
      scrim: 'rgba(0, 0, 0, 0.5)',
    },

    // VMenu 預設屬性
    VMenu: {
      offset: 8,
      transition: 'scale-transition',
    },
  },

  // 顯示設定
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
});

/**
 * 主題管理工具函數
 */
export const themeUtils = {
  /**
   * 切換主題（淺色/深色）
   */
  toggleTheme(vuetifyInstance: ReturnType<typeof createVuetify>): void {
    const currentTheme = vuetifyInstance.theme.global.name.value;
    vuetifyInstance.theme.global.name.value =
      currentTheme === 'liquidGlassLight' ? 'liquidGlassDark' : 'liquidGlassLight';
  },

  /**
   * 設定主題
   */
  setTheme(vuetifyInstance: ReturnType<typeof createVuetify>, isDark: boolean): void {
    vuetifyInstance.theme.global.name.value = isDark ? 'liquidGlassDark' : 'liquidGlassLight';
  },

  /**
   * 獲取當前是否為深色主題
   */
  isDarkTheme(vuetifyInstance: ReturnType<typeof createVuetify>): boolean {
    return vuetifyInstance.theme.global.name.value === 'liquidGlassDark';
  },

  /**
   * 獲取當前主題名稱
   */
  getCurrentTheme(vuetifyInstance: ReturnType<typeof createVuetify>): string {
    return vuetifyInstance.theme.global.name.value;
  },
};
