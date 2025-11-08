<template>
  <v-container fluid class="liquid-glass-bg pa-0">
    <div class="window-title-bar window-drag-region">
      <span class="app-title">Just Chat It</span>
      <div class="window-no-drag" style="display: flex; gap: 8px; align-items: center">
        <v-btn
          icon
          size="small"
          variant="text"
          @click="toggleTheme"
          class="liquid-glass-interactive"
        >
          <v-icon>{{
            settingsStore.isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'
          }}</v-icon>
        </v-btn>
        <window-controls />
      </div>
    </div>

    <v-main class="pa-4">
      <div class="welcome-section mb-6">
        <h1 class="text-h3 mb-2 liquid-glass-text">Just Chat It</h1>
        <p class="text-subtitle-1 text-medium-emphasis">多 AI 聊天桌面應用程式</p>
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <v-card ref="statusCard" class="liquid-glass-card mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
              專案架構完成
            </v-card-title>
            <v-card-text>
              <div class="status-list">
                <div v-for="item in completedItems" :key="item.text" class="status-item">
                  <v-icon size="small" color="success" class="mr-2">mdi-check</v-icon>
                  <span>{{ item.text }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card ref="planCard" class="liquid-glass-card mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-clipboard-list</v-icon>
              後續開發計劃
            </v-card-title>
            <v-card-text>
              <div class="plan-list">
                <div v-for="task in upcomingTasks" :key="task.id" class="plan-item">
                  <v-chip size="small" color="primary" class="mr-2">{{ task.id }}</v-chip>
                  <span>{{ task.text }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card ref="demoCard" class="liquid-glass-card">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="info">mdi-palette</v-icon>
          Liquid Glass 效果展示
        </v-card-title>
        <v-card-text>
          <div class="demo-section">
            <p class="mb-4">點擊下方按鈕體驗不同的 Liquid Glass 效果：</p>
            <div class="demo-buttons">
              <button class="liquid-glass-button primary mr-2 mb-2">主要按鈕</button>
              <button class="liquid-glass-button secondary mr-2 mb-2">次要按鈕</button>
              <button class="liquid-glass-button mr-2 mb-2">標準按鈕</button>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-main>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { LiquidGlassEffect } from '@/utils/liquid-glass-effect';
import WindowControls from '@/components/common/WindowControls.vue';

// Stores
const settingsStore = useSettingsStore();

// Refs
const statusCard = ref<HTMLElement | null>(null);
const planCard = ref<HTMLElement | null>(null);
const demoCard = ref<HTMLElement | null>(null);

// Liquid Glass effect instances
let effects: LiquidGlassEffect[] = [];

// Data
const completedItems = [
  { text: 'Electron 主程序架構' },
  { text: 'Vue 3 + Vuetify 渲染程序' },
  { text: 'TypeScript 配置' },
  { text: '視窗管理系統' },
  { text: 'IPC 通訊機制' },
  { text: 'SQLite 資料庫層' },
  { text: 'Pinia 狀態管理' },
  { text: 'Liquid Glass 視覺效果系統' },
];

const upcomingTasks = [
  { id: 'Task 4', text: '建立多視窗管理系統' },
  { id: 'Task 5', text: '實作 AI 服務整合系統' },
  { id: 'Task 6', text: '實作系統托盤和熱鍵功能' },
  { id: 'Task 7', text: '實作剪貼簿智能整合' },
];

// Methods
const toggleTheme = async () => {
  await settingsStore.toggleTheme();
};

// Lifecycle
onMounted(async () => {
  // 載入設定
  await settingsStore.loadSettings();

  // 初始化 Liquid Glass 效果
  if (settingsStore.liquidGlassSettings.enabled) {
    // 為卡片元素添加效果
    const cards = [statusCard.value, planCard.value, demoCard.value].filter(
      (card): card is HTMLElement => card !== null
    );

    effects = cards.map((card) => {
      return new LiquidGlassEffect(card, {
        enableMouseTracking: settingsStore.liquidGlassSettings.enableMouseTracking,
        enableRipple: settingsStore.liquidGlassSettings.enableRipple,
        enableScrollEffect: settingsStore.liquidGlassSettings.enableScrollEffect,
        lightIntensity: settingsStore.liquidGlassSettings.intensity / 100,
      });
    });

    // 為所有按鈕添加效果
    setTimeout(() => {
      const buttons = document.querySelectorAll<HTMLElement>('.liquid-glass-button');
      buttons.forEach((button) => {
        effects.push(
          new LiquidGlassEffect(button, {
            enableMouseTracking: true,
            enableRipple: true,
            enableScrollEffect: false,
            lightIntensity: 0.4,
          })
        );
      });
    }, 100);
  }
});

onUnmounted(() => {
  // 清理 Liquid Glass 效果
  effects.forEach((effect) => effect.destroy());
  effects = [];
});
</script>

<style lang="scss" scoped>
.liquid-glass-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
}

.window-title-bar {
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.app-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
}

.welcome-section {
  text-align: center;
  padding: 24px 0;

  .liquid-glass-text {
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.status-list,
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item,
.plan-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }
}

.demo-section {
  .demo-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
}

// 深色主題樣式
:global(.dark-theme) {
  .liquid-glass-bg {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.2));
  }

  .app-title {
    color: rgba(255, 255, 255, 0.9);
  }

  .status-item,
  .plan-item {
    background: rgba(255, 255, 255, 0.05);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
