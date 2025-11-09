<template>
  <v-card class="quota-status-card liquid-glass-card" elevation="0">
    <v-card-text>
      <div class="d-flex align-center mb-3">
        <!-- AI 服務圖示和名稱 -->
        <v-avatar :color="statusColor" size="40" class="mr-3">
          <v-icon :icon="serviceIcon" color="white"></v-icon>
        </v-avatar>
        <div class="flex-grow-1">
          <h3 class="text-h6 mb-0">{{ service?.displayName || service?.name }}</h3>
          <div class="d-flex align-center mt-1">
            <v-chip :color="statusColor" size="small" variant="flat" class="mr-2">
              {{ statusText }}
            </v-chip>
            <v-chip
              v-if="quota?.notifyEnabled"
              color="info"
              size="x-small"
              variant="outlined"
              prepend-icon="mdi-bell"
            >
              通知已啟用
            </v-chip>
          </div>
        </div>
      </div>

      <!-- 額度重置倒計時 -->
      <v-divider class="my-3"></v-divider>
      <div v-if="quota?.quotaResetTime && quota.quotaStatus === 'depleted'" class="reset-info">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">
            <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
            重置時間
          </span>
          <span class="text-body-2 text-medium-emphasis">
            {{ formatResetTime(quota.quotaResetTime) }}
          </span>
        </div>
        <div class="countdown-container">
          <v-progress-linear
            :model-value="resetProgress"
            :color="resetProgress > 80 ? 'success' : resetProgress > 50 ? 'warning' : 'error'"
            height="6"
            rounded
            class="mb-1"
          ></v-progress-linear>
          <div class="text-center text-caption">{{ countdownText }}</div>
        </div>
      </div>
      <div v-else-if="quota?.quotaStatus === 'available'" class="text-center py-2">
        <v-icon icon="mdi-check-circle" color="success" size="large"></v-icon>
        <div class="text-body-2 text-success mt-1">額度可用</div>
      </div>
      <div v-else class="text-center py-2">
        <v-icon icon="mdi-help-circle" color="grey" size="large"></v-icon>
        <div class="text-body-2 text-medium-emphasis mt-1">額度狀態未知</div>
      </div>

      <!-- 操作按鈕 -->
      <v-divider class="my-3"></v-divider>
      <div class="actions d-flex flex-wrap gap-2">
        <v-btn
          v-if="quota?.quotaStatus !== 'depleted'"
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="mdi-alert"
          @click="showDepletedDialog"
        >
          標記為已用盡
        </v-btn>
        <v-btn
          v-else
          color="success"
          variant="tonal"
          size="small"
          prepend-icon="mdi-check"
          @click="markAvailable"
        >
          標記為可用
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          prepend-icon="mdi-cog"
          @click="showSettingsDialog"
        >
          設定
        </v-btn>
      </div>
    </v-card-text>

    <!-- 標記為已用盡對話框 -->
    <v-dialog v-model="depletedDialog" max-width="500">
      <v-card class="liquid-glass-card">
        <v-card-title>標記額度為已用盡</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="markDepleted">
            <v-text-field
              v-model="resetTimeInput"
              label="重置時間"
              type="datetime-local"
              variant="outlined"
              density="comfortable"
              hint="設定額度預計重置的時間"
              persistent-hint
            ></v-text-field>
            <v-textarea
              v-model="notesInput"
              label="備註（選填）"
              variant="outlined"
              density="comfortable"
              rows="2"
              class="mt-4"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="depletedDialog = false">取消</v-btn>
          <v-btn color="warning" variant="flat" @click="markDepleted">確認</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 設定對話框 -->
    <v-dialog v-model="settingsDialog" max-width="500">
      <v-card class="liquid-glass-card">
        <v-card-title>額度通知設定</v-card-title>
        <v-card-text>
          <v-form>
            <v-switch
              v-model="notifyEnabledInput"
              label="啟用額度重置通知"
              color="primary"
              hide-details
            ></v-switch>
            <v-slider
              v-model="notifyBeforeMinutesInput"
              :disabled="!notifyEnabledInput"
              label="提前通知時間（分鐘）"
              :min="10"
              :max="1440"
              :step="10"
              thumb-label="always"
              class="mt-4"
            ></v-slider>
            <div class="text-caption text-medium-emphasis">
              將在額度重置前 {{ notifyBeforeMinutesInput }} 分鐘發送通知
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="settingsDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveSettings">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAIStore } from '../../stores/ai';
import type { AIService, QuotaTracking } from '../../../shared/types/database';

const props = defineProps<{
  serviceId: string;
}>();

const aiStore = useAIStore();

// 資料
const service = computed(() => aiStore.getServiceById(props.serviceId));
const quota = computed(() => aiStore.getQuotaTracking(props.serviceId));

// 對話框狀態
const depletedDialog = ref(false);
const settingsDialog = ref(false);

// 表單輸入
const resetTimeInput = ref('');
const notesInput = ref('');
const notifyEnabledInput = ref(true);
const notifyBeforeMinutesInput = ref(60);

// 倒計時更新
const countdownText = ref('');
const resetProgress = ref(0);
let countdownInterval: NodeJS.Timeout | null = null;

// 計算屬性
const statusColor = computed(() => {
  if (!quota.value) return 'grey';
  switch (quota.value.quotaStatus) {
    case 'available':
      return 'success';
    case 'depleted':
      return 'error';
    default:
      return 'grey';
  }
});

const statusText = computed(() => {
  if (!quota.value) return '未知';
  switch (quota.value.quotaStatus) {
    case 'available':
      return '可用';
    case 'depleted':
      return '已用盡';
    default:
      return '未知';
  }
});

const serviceIcon = computed(() => {
  const iconMap: Record<string, string> = {
    chatgpt: 'mdi-chat',
    claude: 'mdi-robot',
    gemini: 'mdi-google',
    perplexity: 'mdi-magnify',
    grok: 'mdi-twitter',
    copilot: 'mdi-microsoft',
  };
  return iconMap[props.serviceId] || 'mdi-chat';
});

// 方法
function formatResetTime(time: Date): string {
  const date = new Date(time);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function updateCountdown() {
  if (!quota.value?.quotaResetTime) {
    countdownText.value = '';
    resetProgress.value = 0;
    return;
  }

  const now = new Date();
  const resetTime = new Date(quota.value.quotaResetTime);
  const diff = resetTime.getTime() - now.getTime();

  if (diff <= 0) {
    countdownText.value = '已過期';
    resetProgress.value = 100;
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    countdownText.value = `${days} 天 ${hours} 小時`;
  } else if (hours > 0) {
    countdownText.value = `${hours} 小時 ${minutes} 分鐘`;
  } else {
    countdownText.value = `${minutes} 分鐘`;
  }

  // 計算進度（假設總週期為30天）
  const totalCycle = 30 * 24 * 60 * 60 * 1000; // 30天
  resetProgress.value = Math.min(100, (diff / totalCycle) * 100);
}

function showDepletedDialog() {
  // 預設設定為明天此時
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  resetTimeInput.value = tomorrow.toISOString().slice(0, 16);
  notesInput.value = '';
  depletedDialog.value = true;
}

async function markDepleted() {
  try {
    const resetTime = resetTimeInput.value ? new Date(resetTimeInput.value) : undefined;
    await aiStore.markQuotaDepleted(props.serviceId, resetTime, notesInput.value);
    depletedDialog.value = false;
  } catch (error) {
    console.error('Failed to mark quota as depleted:', error);
  }
}

async function markAvailable() {
  try {
    await aiStore.markQuotaAvailable(props.serviceId);
  } catch (error) {
    console.error('Failed to mark quota as available:', error);
  }
}

function showSettingsDialog() {
  if (quota.value) {
    notifyEnabledInput.value = quota.value.notifyEnabled;
    notifyBeforeMinutesInput.value = quota.value.notifyBeforeMinutes;
  }
  settingsDialog.value = true;
}

async function saveSettings() {
  try {
    await aiStore.updateQuotaNotifySettings(
      props.serviceId,
      notifyEnabledInput.value,
      notifyBeforeMinutesInput.value,
    );
    settingsDialog.value = false;
  } catch (error) {
    console.error('Failed to save quota settings:', error);
  }
}

// 生命週期
onMounted(async () => {
  // 載入額度資訊
  await aiStore.loadQuotaTracking(props.serviceId);

  // 啟動倒計時更新
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 60000); // 每分鐘更新
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped lang="scss">
.quota-status-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
}

.reset-info {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
  padding: 12px;
}

.countdown-container {
  margin-top: 8px;
}

.actions {
  .v-btn {
    flex: 1 1 auto;
  }
}

.gap-2 {
  gap: 8px;
}
</style>
