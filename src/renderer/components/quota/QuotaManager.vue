<template>
  <div class="quota-manager">
    <!-- 標題和操作 -->
    <div class="header-section mb-6">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h2 class="text-h4 mb-2">額度追蹤管理</h2>
          <p class="text-body-2 text-medium-emphasis">
            監控和管理所有 AI 服務的使用額度，設定重置時間和通知提醒
          </p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          variant="flat"
          @click="refreshQuotas"
          :loading="loading"
        >
          重新整理
        </v-btn>
      </div>

      <!-- 統計卡片 -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="liquid-glass-card stat-card" elevation="0">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="success" size="48" class="mr-3">
                  <v-icon icon="mdi-check-circle" color="white"></v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5">{{ availableCount }}</div>
                  <div class="text-caption text-medium-emphasis">可用服務</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="liquid-glass-card stat-card" elevation="0">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="error" size="48" class="mr-3">
                  <v-icon icon="mdi-alert-circle" color="white"></v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5">{{ depletedCount }}</div>
                  <div class="text-caption text-medium-emphasis">已用盡</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="liquid-glass-card stat-card" elevation="0">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="warning" size="48" class="mr-3">
                  <v-icon icon="mdi-clock-alert" color="white"></v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5">{{ upcomingResetsCount }}</div>
                  <div class="text-caption text-medium-emphasis">24h 內重置</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="liquid-glass-card stat-card" elevation="0">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="info" size="48" class="mr-3">
                  <v-icon icon="mdi-bell" color="white"></v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5">{{ notifyEnabledCount }}</div>
                  <div class="text-caption text-medium-emphasis">通知已啟用</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 篩選和排序 -->
    <div class="filters-section mb-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            label="搜尋 AI 服務"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filterStatus"
            label="篩選狀態"
            :items="filterOptions"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="sortBy"
            label="排序方式"
            :items="sortOptions"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-select>
        </v-col>
      </v-row>
    </div>

    <!-- 額度狀態卡片列表 -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="text-body-1 mt-4">載入中...</div>
    </div>

    <div v-else-if="filteredServices.length === 0" class="text-center py-8">
      <v-icon icon="mdi-magnify" size="64" color="grey"></v-icon>
      <div class="text-body-1 text-medium-emphasis mt-4">沒有找到符合條件的 AI 服務</div>
    </div>

    <v-row v-else>
      <v-col
        v-for="service in filteredServices"
        :key="service.id"
        cols="12"
        md="6"
        lg="4"
      >
        <QuotaStatusCard :service-id="service.id" />
      </v-col>
    </v-row>

    <!-- 快速操作提示 -->
    <v-card class="liquid-glass-card mt-6" elevation="0">
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon icon="mdi-information" color="info" class="mr-3"></v-icon>
          <div class="flex-grow-1">
            <div class="text-subtitle-2 mb-1">快速操作提示</div>
            <ul class="text-caption text-medium-emphasis ma-0 pl-4">
              <li>點擊「標記為已用盡」可設定額度重置時間，系統將在重置前發送提醒通知</li>
              <li>點擊「設定」可調整每個服務的通知設定，包括提前通知時間</li>
              <li>系統每分鐘自動檢查一次額度重置時間，確保及時更新狀態</li>
              <li>支援桌面通知提醒，確保不會錯過額度重置時間</li>
            </ul>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAIStore } from '../../stores/ai';
import QuotaStatusCard from './QuotaStatusCard.vue';
import type { AIService } from '../../../shared/types/database';

const aiStore = useAIStore();

// 狀態
const loading = ref(false);
const searchQuery = ref('');
const filterStatus = ref('all');
const sortBy = ref('name');

// 篩選選項
const filterOptions = [
  { title: '全部', value: 'all' },
  { title: '可用', value: 'available' },
  { title: '已用盡', value: 'depleted' },
  { title: '未知', value: 'unknown' },
];

const sortOptions = [
  { title: '名稱', value: 'name' },
  { title: '狀態', value: 'status' },
  { title: '重置時間', value: 'resetTime' },
];

// 計算屬性
const availableCount = computed(() => {
  return Array.from(aiStore.quotaTrackings.values()).filter(
    (q) => q.quotaStatus === 'available',
  ).length;
});

const depletedCount = computed(() => {
  return aiStore.depletedServices.length;
});

const upcomingResetsCount = computed(() => {
  return aiStore.upcomingResets.length;
});

const notifyEnabledCount = computed(() => {
  return Array.from(aiStore.quotaTrackings.values()).filter((q) => q.notifyEnabled).length;
});

const filteredServices = computed(() => {
  let services = [...aiStore.services];

  // 搜尋篩選
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    services = services.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.displayName?.toLowerCase().includes(query),
    );
  }

  // 狀態篩選
  if (filterStatus.value !== 'all') {
    services = services.filter((s) => {
      const quota = aiStore.getQuotaTracking(s.id);
      return quota?.quotaStatus === filterStatus.value;
    });
  }

  // 排序
  services.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'status': {
        const statusOrder = { available: 0, depleted: 1, unknown: 2 };
        const aStatus = aiStore.getQuotaTracking(a.id)?.quotaStatus || 'unknown';
        const bStatus = aiStore.getQuotaTracking(b.id)?.quotaStatus || 'unknown';
        return statusOrder[aStatus] - statusOrder[bStatus];
      }
      case 'resetTime': {
        const aTime = aiStore.getQuotaTracking(a.id)?.quotaResetTime;
        const bTime = aiStore.getQuotaTracking(b.id)?.quotaResetTime;
        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      }
      default:
        return 0;
    }
  });

  return services;
});

// 方法
async function refreshQuotas() {
  loading.value = true;
  try {
    await Promise.all([aiStore.loadAIServices(), aiStore.loadQuotaTrackings()]);
  } catch (error) {
    console.error('Failed to refresh quotas:', error);
  } finally {
    loading.value = false;
  }
}

// 生命週期
onMounted(async () => {
  await refreshQuotas();
});
</script>

<style scoped lang="scss">
.quota-manager {
  padding: 24px;
}

.header-section {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.filters-section {
  margin-bottom: 16px;
}
</style>
