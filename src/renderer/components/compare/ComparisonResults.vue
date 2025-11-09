<template>
  <v-card class="comparison-results liquid-glass-card">
    <v-card-title>
      <div class="d-flex align-center justify-space-between">
        <span>比較結果</span>
        <div class="d-flex gap-2">
          <!-- 結果統計 -->
          <v-chip size="small" color="success" v-if="successCount > 0">
            <v-icon start size="small">mdi-check</v-icon>
            {{ successCount }} 成功
          </v-chip>
          <v-chip size="small" color="error" v-if="errorCount > 0">
            <v-icon start size="small">mdi-alert</v-icon>
            {{ errorCount }} 失敗
          </v-chip>
          <v-chip size="small" v-if="loadingCount > 0">
            <v-icon start size="small">mdi-loading mdi-spin</v-icon>
            {{ loadingCount }} 載入中
          </v-chip>

          <!-- 匯出按鈕 -->
          <v-menu v-if="hasResults">
            <template #activator="{ props }">
              <v-btn icon="mdi-download" size="small" variant="text" v-bind="props"></v-btn>
            </template>
            <v-list>
              <v-list-item @click="exportAsJSON">
                <template #prepend>
                  <v-icon>mdi-code-json</v-icon>
                </template>
                <v-list-item-title>匯出為 JSON</v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportAsMarkdown">
                <template #prepend>
                  <v-icon>mdi-language-markdown</v-icon>
                </template>
                <v-list-item-title>匯出為 Markdown</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <!-- 無結果提示 -->
      <v-alert v-if="!hasResults" type="info" variant="tonal" class="mb-4">
        <v-alert-title>尚未開始比較</v-alert-title>
        請選擇 AI 服務並輸入提示詞，然後點擊「發送」按鈕開始比較。
      </v-alert>

      <!-- 結果網格 -->
      <div v-else class="results-grid">
        <v-card
          v-for="result in sortedResults"
          :key="result.id"
          class="result-card"
          :class="{ loading: result.status === 'loading' }"
        >
          <!-- 標題列 -->
          <v-card-title class="result-header">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-2">
                  <v-icon v-if="!getServiceIcon(result.aiServiceId)">mdi-robot</v-icon>
                  <img v-else :src="getServiceIcon(result.aiServiceId)" :alt="result.aiServiceId" />
                </v-avatar>
                <span>{{ getServiceName(result.aiServiceId) }}</span>
              </div>

              <!-- 狀態指示 -->
              <v-chip
                size="small"
                :color="getStatusColor(result.status)"
                :variant="result.status === 'success' ? 'flat' : 'outlined'"
              >
                <v-icon v-if="result.status === 'loading'" start size="small" class="mdi-spin">
                  mdi-loading
                </v-icon>
                {{ getStatusText(result.status) }}
              </v-chip>
            </div>
          </v-card-title>

          <!-- 回應內容 -->
          <v-card-text class="result-content">
            <!-- 載入中 -->
            <div v-if="result.status === 'loading'" class="loading-state">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-4 text-caption">正在等待回應...</p>
            </div>

            <!-- 錯誤狀態 -->
            <div v-else-if="result.status === 'error'" class="error-state">
              <v-icon size="48" color="error">mdi-alert-circle</v-icon>
              <p class="mt-2 text-body-2">{{ result.errorMessage || '發生錯誤' }}</p>
            </div>

            <!-- 成功狀態 -->
            <div v-else-if="result.status === 'success'" class="success-state">
              <!-- 回應內容 -->
              <div class="response-text">{{ result.response }}</div>

              <!-- 回應時間 -->
              <div v-if="result.responseTime" class="mt-2 text-caption text-grey">
                回應時間: {{ result.responseTime }}ms
              </div>

              <!-- 操作按鈕 -->
              <div class="actions mt-3">
                <v-btn size="small" variant="outlined" prepend-icon="mdi-content-copy" @click="copyResponse(result)">
                  複製
                </v-btn>
              </div>
            </div>

            <!-- 待處理狀態 -->
            <div v-else class="pending-state">
              <v-icon size="48" color="grey">mdi-clock-outline</v-icon>
              <p class="mt-2 text-caption">等待發送...</p>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCompareStore } from '../../stores/compare';
import { useAIStore } from '../../stores/ai';
import type { ComparisonResult } from '../../../shared/types/database';

// Stores
const compareStore = useCompareStore();
const aiStore = useAIStore();

// 計算屬性
const results = computed(() => compareStore.currentResults);
const hasResults = computed(() => results.value.length > 0);

const successCount = computed(() => results.value.filter((r) => r.status === 'success').length);
const errorCount = computed(() => results.value.filter((r) => r.status === 'error').length);
const loadingCount = computed(() => results.value.filter((r) => r.status === 'loading').length);

/**
 * 按狀態排序結果：成功 > 載入中 > 錯誤 > 待處理
 */
const sortedResults = computed(() => {
  const statusOrder = { success: 1, loading: 2, error: 3, pending: 4 };
  return [...results.value].sort((a, b) => {
    return statusOrder[a.status] - statusOrder[b.status];
  });
});

/**
 * 取得服務名稱
 */
const getServiceName = (serviceId: string): string => {
  const service = aiStore.getServiceById(serviceId);
  return service?.displayName || service?.name || serviceId;
};

/**
 * 取得服務圖示
 */
const getServiceIcon = (serviceId: string): string | undefined => {
  const service = aiStore.getServiceById(serviceId);
  return service?.iconUrl || service?.iconPath;
};

/**
 * 取得狀態顏色
 */
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'grey',
    loading: 'info',
    success: 'success',
    error: 'error',
  };
  return colors[status] || 'grey';
};

/**
 * 取得狀態文字
 */
const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: '待處理',
    loading: '載入中',
    success: '成功',
    error: '錯誤',
  };
  return texts[status] || '未知';
};

/**
 * 複製回應內容
 */
const copyResponse = async (result: ComparisonResult) => {
  try {
    await navigator.clipboard.writeText(result.response);
    // TODO: 顯示成功提示
  } catch (error) {
    console.error('Failed to copy response:', error);
  }
};

/**
 * 匯出為 JSON
 */
const exportAsJSON = () => {
  try {
    const json = compareStore.exportResultsAsJSON();
    downloadFile(json, 'comparison-results.json', 'application/json');
  } catch (error) {
    console.error('Failed to export as JSON:', error);
  }
};

/**
 * 匯出為 Markdown
 */
const exportAsMarkdown = () => {
  try {
    const markdown = compareStore.exportResultsAsMarkdown();
    downloadFile(markdown, 'comparison-results.md', 'text/markdown');
  } catch (error) {
    console.error('Failed to export as Markdown:', error);
  }
};

/**
 * 下載檔案
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<style scoped lang="scss">
.comparison-results {
  width: 100%;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.result-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &.loading {
    border: 2px solid rgb(var(--v-theme-info));
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.result-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.loading-state,
.error-state,
.pending-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}

.success-state {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.response-text {
  flex: 1;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
  line-height: 1.6;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  max-height: 400px;
}

.actions {
  display: flex;
  gap: 8px;
}

// Liquid Glass 樣式
.liquid-glass-card {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
}

// 深色主題適配
:global(body.dark-theme) {
  .result-card {
    background: rgba(0, 0, 0, 0.2);

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }

  .result-header {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .response-text {
    background: rgba(0, 0, 0, 0.3);
  }

  .liquid-glass-card {
    background: rgba(0, 0, 0, 0.4) !important;
  }
}

// 旋轉動畫
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.mdi-spin {
  animation: spin 1s linear infinite;
}
</style>
