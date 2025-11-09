<template>
  <v-card class="ai-service-selector liquid-glass-card">
    <v-card-title>
      <div class="d-flex align-center justify-space-between">
        <span>選擇 AI 服務</span>
        <v-chip size="small" color="primary">{{ selectedCount }} / {{ availableCount }}</v-chip>
      </div>
    </v-card-title>

    <v-card-text>
      <v-alert v-if="!hasAvailableServices" type="info" class="mb-4">
        目前沒有可用的 AI 服務。請先設定 AI 服務。
      </v-alert>

      <div class="service-grid">
        <v-card
          v-for="service in availableServices"
          :key="service.id"
          :class="[
            'service-card',
            { selected: isSelected(service.id), unavailable: !service.isAvailable },
          ]"
          @click="toggleService(service.id)"
        >
          <!-- 選中指示器 -->
          <div class="selection-indicator">
            <v-icon v-if="isSelected(service.id)" color="success" size="small">
              mdi-check-circle
            </v-icon>
            <v-icon v-else size="small" color="grey-lighten-1">mdi-circle-outline</v-icon>
          </div>

          <!-- AI 服務內容 -->
          <div class="service-content">
            <v-avatar size="48" class="mb-2">
              <v-icon v-if="!service.iconUrl" size="large">mdi-robot</v-icon>
              <img v-else :src="service.iconUrl" :alt="service.name" />
            </v-avatar>

            <h4 class="text-subtitle-1 mb-1">{{ service.displayName || service.name }}</h4>

            <!-- 服務狀態 -->
            <v-chip
              size="x-small"
              :color="service.isAvailable ? 'success' : 'error'"
              variant="flat"
            >
              {{ service.isAvailable ? '可用' : '不可用' }}
            </v-chip>

            <!-- 額度重置時間 -->
            <div v-if="!service.isAvailable && service.quotaResetTime" class="text-caption mt-1">
              重置: {{ formatResetTime(service.quotaResetTime) }}
            </div>
          </div>
        </v-card>
      </div>

      <!-- 快速選擇按鈕 -->
      <div class="quick-actions mt-4">
        <v-btn size="small" variant="outlined" @click="selectAll" :disabled="!hasAvailableServices">
          全選
        </v-btn>
        <v-btn size="small" variant="outlined" @click="selectNone" class="ml-2">清空</v-btn>
        <v-btn
          size="small"
          variant="outlined"
          @click="selectOnlyAvailable"
          :disabled="!hasAvailableServices"
          class="ml-2"
        >
          僅選可用
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAIStore } from '../../stores/ai';
import { useCompareStore } from '../../stores/compare';
import type { AIService } from '../../../shared/types/database';

// Stores
const aiStore = useAIStore();
const compareStore = useCompareStore();

// 計算屬性
const availableServices = computed<AIService[]>(() => aiStore.services);
const hasAvailableServices = computed(() => availableServices.value.length > 0);
const availableCount = computed(() => availableServices.value.filter((s) => s.isAvailable).length);
const selectedCount = computed(() => compareStore.selectedAIServices.length);

/**
 * 檢查服務是否被選中
 */
const isSelected = (serviceId: string): boolean => {
  return compareStore.selectedAIServices.includes(serviceId);
};

/**
 * 切換服務選擇狀態
 */
const toggleService = (serviceId: string) => {
  compareStore.toggleAIService(serviceId);
};

/**
 * 全選
 */
const selectAll = () => {
  const allIds = availableServices.value.map((s) => s.id);
  compareStore.setSelectedAIServices(allIds);
};

/**
 * 清空選擇
 */
const selectNone = () => {
  compareStore.clearSelectedAIServices();
};

/**
 * 僅選擇可用的服務
 */
const selectOnlyAvailable = () => {
  const availableIds = availableServices.value.filter((s) => s.isAvailable).map((s) => s.id);
  compareStore.setSelectedAIServices(availableIds);
};

/**
 * 格式化重置時間
 */
const formatResetTime = (resetTime: Date): string => {
  const now = new Date();
  const reset = new Date(resetTime);
  const diff = reset.getTime() - now.getTime();

  if (diff <= 0) return '即將重置';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} 天後`;
  }

  return hours > 0 ? `${hours} 小時 ${minutes} 分鐘後` : `${minutes} 分鐘後`;
};
</script>

<style scoped lang="scss">
.ai-service-selector {
  width: 100%;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.service-card {
  position: relative;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.03);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: rgb(var(--v-theme-success));
    background: rgba(var(--v-theme-success), 0.1);
  }

  &.unavailable {
    opacity: 0.6;

    &:not(.selected) {
      cursor: not-allowed;
    }
  }
}

.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
}

.service-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 8px;
}

.quick-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

// Liquid Glass 樣式
.liquid-glass-card {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
}

// 深色主題適配
:global(body.dark-theme) {
  .service-card {
    background: rgba(0, 0, 0, 0.2);

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    &.selected {
      background: rgba(var(--v-theme-success), 0.15);
    }
  }

  .liquid-glass-card {
    background: rgba(0, 0, 0, 0.4) !important;
  }
}
</style>
