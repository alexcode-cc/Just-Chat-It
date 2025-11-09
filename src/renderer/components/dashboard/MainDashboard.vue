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

      <!-- AI 服務快速啟動 -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card ref="aiServicesCard" class="liquid-glass-card">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-robot</v-icon>
                AI 服務
              </div>
              <v-chip :color="availableServices.length > 0 ? 'success' : 'error'" size="small">
                {{ availableServices.length }} / {{ aiServices.length }} 可用
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  v-for="service in aiServices"
                  :key="service.id"
                  cols="12"
                  sm="6"
                  md="4"
                  lg="3"
                >
                  <v-card
                    class="service-card liquid-glass-interactive"
                    :class="{ disabled: !service.isAvailable }"
                    @click="handleOpenAIService(service.id)"
                  >
                    <v-card-text class="text-center">
                      <v-avatar size="48" class="mb-2">
                        <v-icon v-if="!service.iconUrl" size="32" color="primary">
                          mdi-robot
                        </v-icon>
                        <img v-else :src="service.iconUrl" :alt="service.name" />
                      </v-avatar>
                      <h4 class="text-h6 mb-1">{{ service.name }}</h4>
                      <p class="text-caption text-grey mb-2">{{ service.description }}</p>
                      <v-chip
                        :color="service.isAvailable ? 'success' : 'error'"
                        size="x-small"
                        variant="flat"
                      >
                        {{ service.isAvailable ? '可用' : '不可用' }}
                      </v-chip>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <v-alert v-if="aiServices.length === 0" type="info" class="mt-4">
                正在載入 AI 服務...
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 快速功能 -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card class="liquid-glass-card">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="info">mdi-lightning-bolt</v-icon>
              快速功能
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-card
                    class="function-card liquid-glass-interactive"
                    @click="$router.push('/prompts')"
                  >
                    <v-card-text class="text-center">
                      <v-icon size="48" color="purple" class="mb-2">mdi-text-box-multiple</v-icon>
                      <h4 class="text-h6 mb-1">提示詞庫</h4>
                      <p class="text-caption text-grey">管理和使用提示詞</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card
                    class="function-card liquid-glass-interactive"
                    @click="$router.push('/compare')"
                  >
                    <v-card-text class="text-center">
                      <v-icon size="48" color="orange" class="mb-2">mdi-compare</v-icon>
                      <h4 class="text-h6 mb-1">AI 比較</h4>
                      <p class="text-caption text-grey">同時查詢多個 AI</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card
                    class="function-card liquid-glass-interactive"
                    @click="$router.push('/quota')"
                  >
                    <v-card-text class="text-center">
                      <v-icon size="48" color="warning" class="mb-2">mdi-gauge</v-icon>
                      <h4 class="text-h6 mb-1">額度追蹤</h4>
                      <p class="text-caption text-grey">管理 AI 使用額度</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card
                    class="function-card liquid-glass-interactive"
                    @click="$router.push('/history')"
                  >
                    <v-card-text class="text-center">
                      <v-icon size="48" color="cyan" class="mb-2">mdi-history</v-icon>
                      <h4 class="text-h6 mb-1">對話歷史</h4>
                      <p class="text-caption text-grey">查看離線對話記錄</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card
                    class="function-card liquid-glass-interactive"
                    @click="$router.push('/settings')"
                  >
                    <v-card-text class="text-center">
                      <v-icon size="48" color="blue" class="mb-2">mdi-cog</v-icon>
                      <h4 class="text-h6 mb-1">系統設定</h4>
                      <p class="text-caption text-grey">調整應用程式設定</p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useAIStore } from '@/stores/ai';
import { LiquidGlassEffect } from '@/utils/liquid-glass-effect';
import WindowControls from '@/components/common/WindowControls.vue';

// Stores
const settingsStore = useSettingsStore();
const aiStore = useAIStore();

// Refs
const aiServicesCard = ref<HTMLElement | null>(null);
const statusCard = ref<HTMLElement | null>(null);
const planCard = ref<HTMLElement | null>(null);
const demoCard = ref<HTMLElement | null>(null);

// Liquid Glass effect instances
let effects: LiquidGlassEffect[] = [];

// Computed
const aiServices = computed(() => aiStore.services);
const availableServices = computed(() => aiStore.availableServices);

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
  { text: '多視窗狀態持久化' },
  { text: 'AI 服務整合系統' },
];

const upcomingTasks = [
  { id: 'Task 6', text: '實作系統托盤和熱鍵功能' },
  { id: 'Task 7', text: '實作剪貼簿智能整合' },
  { id: 'Task 8', text: '建立提示詞管理系統' },
  { id: 'Task 9', text: '實作多 AI 比較功能' },
];

// Methods
const toggleTheme = async () => {
  await settingsStore.toggleTheme();
};

const handleOpenAIService = async (serviceId: string) => {
  try {
    await aiStore.createChatWindow(serviceId);
  } catch (error) {
    console.error('Failed to open AI service:', error);
  }
};

// Lifecycle
onMounted(async () => {
  // 載入設定
  await settingsStore.loadSettings();

  // 載入 AI 服務
  await aiStore.loadAIServices();

  // 初始化 Liquid Glass 效果
  if (settingsStore.liquidGlassSettings.enabled) {
    // 為卡片元素添加效果
    const cards = [aiServicesCard.value, statusCard.value, planCard.value, demoCard.value].filter(
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

    // 為所有按鈕和服務卡片添加效果
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

      // 為 AI 服務卡片添加效果
      const serviceCards = document.querySelectorAll<HTMLElement>('.service-card');
      serviceCards.forEach((card) => {
        effects.push(
          new LiquidGlassEffect(card, {
            enableMouseTracking: true,
            enableRipple: true,
            enableScrollEffect: false,
            lightIntensity: 0.3,
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

.service-card {
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover:not(.disabled) {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.function-card {
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
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

  .service-card {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .function-card {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
