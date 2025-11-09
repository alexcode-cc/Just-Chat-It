<template>
  <div class="compare-window">
    <!-- 標題欄 -->
    <div class="title-bar liquid-glass" style="-webkit-app-region: drag">
      <div class="title-content">
        <div class="d-flex align-center">
          <v-icon class="mr-2" size="large">mdi-compare</v-icon>
          <div>
            <h3 class="text-h6 mb-0">AI 比較工具</h3>
            <p v-if="currentSession" class="text-caption mb-0 text-grey">
              {{ currentSession.title }}
            </p>
          </div>
        </div>

        <!-- 視窗控制按鈕 -->
        <div class="window-controls" style="-webkit-app-region: no-drag">
          <WindowControls />
        </div>
      </div>
    </div>

    <!-- 工具列 -->
    <div class="toolbar liquid-glass-subtle">
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-plus"
        @click="handleNewComparison"
      >
        新比較
      </v-btn>

      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-history"
        @click="showHistory = true"
      >
        歷史記錄
      </v-btn>

      <v-spacer></v-spacer>

      <!-- 進度指示 -->
      <div v-if="isComparing" class="text-caption text-grey mr-4">
        <v-icon size="small" class="mdi-spin mr-1">mdi-loading</v-icon>
        正在比較... {{ completedCount }} / {{ totalCount }}
      </div>

      <!-- 說明 -->
      <v-btn variant="text" size="small" icon="mdi-help-circle" @click="showHelp = true"></v-btn>
    </div>

    <!-- 主要內容 -->
    <div class="main-content">
      <v-container fluid class="pa-4">
        <!-- 第一步：選擇 AI 服務 -->
        <AIServiceSelector class="mb-4" />

        <!-- 第二步：輸入提示詞 -->
        <PromptInputArea
          class="mb-4"
          :loading="isComparing"
          @submit="handleSubmit"
        />

        <!-- 第三步：顯示結果 -->
        <ComparisonResults />
      </v-container>
    </div>

    <!-- 歷史記錄對話框 -->
    <v-dialog v-model="showHistory" max-width="900">
      <v-card class="liquid-glass-card">
        <v-card-title>
          <div class="d-flex align-center justify-space-between">
            <span>歷史比較記錄</span>
            <v-btn icon size="small" @click="showHistory = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="session in historySessions"
              :key="session.id"
              :active="session.id === currentSession?.id"
              @click="handleLoadSession(session.id)"
            >
              <template #prepend>
                <v-icon>mdi-compare</v-icon>
              </template>
              <v-list-item-title>{{ session.title }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ new Date(session.createdAt).toLocaleString() }} -
                {{ session.aiServiceIds.length }} 個 AI
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click.stop="handleDeleteSession(session.id)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-if="historySessions.length === 0" type="info" class="mt-4">
            目前沒有歷史記錄
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 說明對話框 -->
    <v-dialog v-model="showHelp" max-width="600">
      <v-card class="liquid-glass-card">
        <v-card-title>
          <div class="d-flex align-center justify-space-between">
            <span>使用說明</span>
            <v-btn icon size="small" @click="showHelp = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <h4 class="text-h6 mb-2">如何使用 AI 比較工具</h4>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-numeric-1-circle">
              <v-list-item-title>選擇要比較的 AI 服務</v-list-item-title>
              <v-list-item-subtitle>
                點擊 AI 服務卡片選擇多個服務進行比較
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item prepend-icon="mdi-numeric-2-circle">
              <v-list-item-title>輸入提示詞</v-list-item-title>
              <v-list-item-subtitle>
                輸入要發送給所有 AI 的提示詞，或從提示詞庫選擇
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item prepend-icon="mdi-numeric-3-circle">
              <v-list-item-title>發送並查看結果</v-list-item-title>
              <v-list-item-subtitle>
                點擊「發送」按鈕，系統會同時向所有選中的 AI 發送提示詞
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item prepend-icon="mdi-numeric-4-circle">
              <v-list-item-title>比較和匯出</v-list-item-title>
              <v-list-item-subtitle>
                查看各 AI 的回應並進行比較，可匯出為 JSON 或 Markdown
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-alert type="info" variant="tonal" class="mt-4">
            <v-alert-title>注意事項</v-alert-title>
            <ul class="text-caption">
              <li>比較功能會為每個選中的 AI 開啟獨立的 WebView</li>
              <li>需要手動在各個 AI 網頁中查看和複製回應</li>
              <li>確保已登入各 AI 服務以獲得最佳體驗</li>
              <li>比較結果會自動儲存到資料庫</li>
            </ul>
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 載入覆蓋層 -->
    <v-overlay :model-value="loading" class="align-center justify-center" contained>
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      <p class="mt-4">{{ loadingMessage }}</p>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCompareStore } from '../../stores/compare';
import { useAIStore } from '../../stores/ai';
import AIServiceSelector from './AIServiceSelector.vue';
import PromptInputArea from './PromptInputArea.vue';
import ComparisonResults from './ComparisonResults.vue';
import WindowControls from '../common/WindowControls.vue';

// Stores
const compareStore = useCompareStore();
const aiStore = useAIStore();

// 狀態
const loading = ref(false);
const loadingMessage = ref('載入中...');
const showHistory = ref(false);
const showHelp = ref(false);
const isComparing = ref(false);

// 計算屬性
const currentSession = computed(() => compareStore.currentSession);
const historySessions = computed(() => compareStore.sessions);
const totalCount = computed(() => compareStore.selectedAIServices.length);
const completedCount = computed(() => {
  return compareStore.currentResults.filter(
    (r) => r.status === 'success' || r.status === 'error'
  ).length;
});

/**
 * 處理提交
 */
const handleSubmit = async (payload: { title: string; promptContent: string }) => {
  const { title, promptContent } = payload;

  if (compareStore.selectedAIServices.length === 0) {
    alert('請至少選擇一個 AI 服務');
    return;
  }

  try {
    isComparing.value = true;
    loading.value = true;
    loadingMessage.value = '建立比較會話...';

    // 建立新的比較會話
    await compareStore.createSession(
      title,
      promptContent,
      compareStore.selectedAIServices
    );

    loadingMessage.value = '開啟 AI 服務視窗...';

    // 為每個選中的 AI 服務開啟聊天視窗
    // 注意：這裡使用模擬的方式，實際應用中需要真正開啟 WebView 並自動填入提示詞
    for (const serviceId of compareStore.selectedAIServices) {
      try {
        // 更新結果狀態為載入中
        const result = compareStore.currentResults.find((r) => r.aiServiceId === serviceId);
        if (result) {
          await compareStore.updateResult(result.id, { status: 'loading' });
        }

        // 開啟聊天視窗
        await aiStore.createChatWindow(serviceId);

        // 這裡應該實作自動填入提示詞的邏輯
        // 由於 WebView 的限制，實際實作可能需要用戶手動操作
        // 或使用更高級的自動化技術

        // 模擬延遲
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to open chat window for ${serviceId}:`, error);
        const result = compareStore.currentResults.find((r) => r.aiServiceId === serviceId);
        if (result) {
          await compareStore.updateResult(result.id, {
            status: 'error',
            errorMessage: `開啟視窗失敗: ${error}`,
          });
        }
      }
    }

    loadingMessage.value = '等待 AI 回應...';

    // 提示用戶手動操作
    alert(
      `已為 ${compareStore.selectedAIServices.length} 個 AI 服務開啟視窗。\n\n` +
        `請在各個視窗中：\n` +
        `1. 確認已登入\n` +
        `2. 貼上或輸入提示詞\n` +
        `3. 發送並等待回應\n` +
        `4. 回應內容將自動擷取（或手動複製回本視窗）`
    );
  } catch (error) {
    console.error('Failed to submit comparison:', error);
    alert(`比較失敗: ${error}`);
  } finally {
    loading.value = false;
    isComparing.value = false;
  }
};

/**
 * 處理新建比較
 */
const handleNewComparison = () => {
  if (confirm('確定要開始新的比較嗎？當前的比較結果將被清除。')) {
    compareStore.currentSession = null;
    compareStore.clearSelectedAIServices();
  }
};

/**
 * 載入歷史會話
 */
const handleLoadSession = async (sessionId: string) => {
  try {
    loading.value = true;
    loadingMessage.value = '載入會話...';

    await compareStore.setCurrentSession(sessionId);
    const session = compareStore.currentSession;

    if (session) {
      // 設定選中的 AI 服務
      compareStore.setSelectedAIServices(session.aiServiceIds);
    }

    showHistory.value = false;
  } catch (error) {
    console.error('Failed to load session:', error);
    alert(`載入會話失敗: ${error}`);
  } finally {
    loading.value = false;
  }
};

/**
 * 刪除會話
 */
const handleDeleteSession = async (sessionId: string) => {
  if (confirm('確定要刪除這個比較記錄嗎？')) {
    try {
      await compareStore.deleteSession(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert(`刪除會話失敗: ${error}`);
    }
  }
};

/**
 * 初始化
 */
onMounted(async () => {
  try {
    loading.value = true;
    loadingMessage.value = '初始化...';

    // 載入 AI 服務
    if (aiStore.services.length === 0) {
      await aiStore.loadAIServices();
    }

    // 載入歷史會話
    await compareStore.loadSessions();
  } catch (error) {
    console.error('Failed to initialize:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.compare-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--v-theme-background);
  overflow: hidden;
}

.title-bar {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.title-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.window-controls {
  margin-left: auto;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

// Liquid Glass 樣式
.liquid-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.liquid-glass-subtle {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px) saturate(150%);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
}

.liquid-glass-card {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
}

// 深色主題適配
:global(body.dark-theme) {
  .title-bar,
  .toolbar {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .liquid-glass {
    background: rgba(0, 0, 0, 0.3);
  }

  .liquid-glass-subtle {
    background: rgba(0, 0, 0, 0.2);
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
