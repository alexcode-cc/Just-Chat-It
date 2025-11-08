<template>
  <div class="chat-window">
    <!-- 標題欄 -->
    <div class="title-bar liquid-glass" style="-webkit-app-region: drag">
      <div class="title-content">
        <!-- AI 服務圖示和名稱 -->
        <div class="service-info">
          <v-avatar size="32" class="mr-2">
            <v-icon v-if="!service?.iconUrl" color="primary">mdi-robot</v-icon>
            <img v-else :src="service.iconUrl" :alt="service.name" />
          </v-avatar>
          <div>
            <h3 class="text-h6 mb-0">{{ service?.name || 'AI 聊天' }}</h3>
            <p v-if="currentSession" class="text-caption mb-0 text-grey">
              {{ currentSession.title }}
            </p>
          </div>
        </div>

        <!-- 服務狀態指示器 -->
        <div class="status-indicator">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-chip
                v-bind="props"
                :color="serviceStatus?.isOnline ? 'success' : 'error'"
                size="small"
                variant="flat"
              >
                <v-icon start>{{
                  serviceStatus?.isOnline ? 'mdi-check-circle' : 'mdi-alert-circle'
                }}</v-icon>
                {{ serviceStatus?.isOnline ? '在線' : '離線' }}
              </v-chip>
            </template>
            <span v-if="serviceStatus">
              最後檢查: {{ serviceStatus.lastChecked.toLocaleTimeString() }}<br />
              響應時間: {{ serviceStatus.responseTime }}ms
            </span>
          </v-tooltip>
        </div>

        <!-- 視窗控制按鈕 -->
        <div class="window-controls" style="-webkit-app-region: no-drag">
          <WindowControls />
        </div>
      </div>
    </div>

    <!-- 工具列 -->
    <div class="toolbar liquid-glass-subtle">
      <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="handleNewSession">
        新對話
      </v-btn>

      <v-btn variant="text" size="small" prepend-icon="mdi-history" @click="showHistory = true">
        歷史記錄
      </v-btn>

      <v-btn variant="text" size="small" prepend-icon="mdi-refresh" @click="handleRefresh">
        重新整理
      </v-btn>

      <v-spacer></v-spacer>

      <!-- 會話統計 -->
      <div v-if="sessionStats" class="text-caption text-grey mr-4">
        訊息: {{ sessionStats.totalMessages }} | 字元: {{ sessionStats.totalCharacters }}
      </div>

      <!-- 導航控制開關 -->
      <v-switch
        v-model="showNavigation"
        hide-details
        density="compact"
        label="顯示導航列"
        color="primary"
        class="mr-2"
      ></v-switch>
    </div>

    <!-- WebView 容器 -->
    <div class="webview-container">
      <AIWebView
        v-if="service"
        ref="webviewRef"
        :url="service.webUrl"
        :service-id="serviceId"
        :session-id="sessionId"
        :show-navigation="showNavigation"
        :enable-content-capture="true"
        @load-start="handleLoadStart"
        @load-finish="handleLoadFinish"
        @load-error="handleLoadError"
        @content-change="handleContentChange"
        @new-window="handleNewWindow"
      />
      <div v-else class="error-state">
        <v-icon size="64" color="error">mdi-alert-circle</v-icon>
        <p class="text-h6 mt-4">找不到 AI 服務</p>
        <p class="text-caption">服務 ID: {{ serviceId }}</p>
      </div>
    </div>

    <!-- 歷史記錄對話框 -->
    <v-dialog v-model="showHistory" max-width="800">
      <v-card class="liquid-glass-card">
        <v-card-title>
          <div class="d-flex align-center justify-space-between">
            <span>歷史對話記錄</span>
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
              @click="handleSwitchSession(session.id)"
            >
              <template #prepend>
                <v-icon>mdi-message-text</v-icon>
              </template>
              <v-list-item-title>{{ session.title }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ new Date(session.createdAt).toLocaleString() }}
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

    <!-- 載入覆蓋層 -->
    <v-overlay :model-value="isLoadingSession" class="align-center justify-center" contained>
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      <p class="mt-4">載入會話中...</p>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAIStore } from '../../stores/ai';
import { useChatStore } from '../../stores/chat';
import { useChatSession } from '../../composables/useChatSession';
import { useAIServiceMonitor } from '../../utils/ai-service-monitor';
import AIWebView from './AIWebView.vue';
import WindowControls from '../common/WindowControls.vue';
import type { ServiceHealthStatus } from '../../utils/ai-service-monitor';

// 路由
const route = useRoute();
const serviceId = route.params.serviceId as string;

// Stores
const aiStore = useAIStore();
const chatStore = useChatStore();

// 會話管理
const {
  currentSession,
  messages,
  isLoadingSession,
  sessionId,
  createNewSession,
  saveMessage,
  switchSession,
  deleteSession,
  getSessionStats,
} = useChatSession(serviceId);

// AI 服務監控
const { getStatus, checkHealth, watchStatus } = useAIServiceMonitor();

// 狀態
const webviewRef = ref<InstanceType<typeof AIWebView> | null>(null);
const showNavigation = ref(false);
const showHistory = ref(false);
const serviceStatus = ref<ServiceHealthStatus | undefined>(undefined);
const lastContent = ref('');

// 計算屬性
const service = computed(() => aiStore.getServiceById(serviceId));
const historySessions = computed(() => chatStore.getSessionsByService(serviceId));
const sessionStats = computed(() => getSessionStats());

/**
 * WebView 事件處理
 */
const handleLoadStart = () => {
  console.log('WebView started loading');
};

const handleLoadFinish = (url: string) => {
  console.log('WebView finished loading:', url);
};

const handleLoadError = (error: string) => {
  console.error('WebView load error:', error);
};

const handleContentChange = async (content: string) => {
  // 避免重複儲存相同內容
  if (content === lastContent.value) return;
  lastContent.value = content;

  // 這裡可以實作更智能的內容解析
  // 例如識別用戶訊息和 AI 回應，分別儲存
  console.log('Content changed, length:', content.length);

  // 簡單範例：將內容儲存為 assistant 訊息
  // 實際應用中需要更複雜的解析邏輯
  try {
    if (content.length > 100) {
      // 避免儲存太短的內容
      await saveMessage('assistant', content, {
        capturedAt: new Date().toISOString(),
        url: service.value?.webUrl,
      });
    }
  } catch (error) {
    console.error('Failed to save message:', error);
  }
};

const handleNewWindow = (url: string) => {
  console.log('New window requested:', url);
  // 可以選擇在系統瀏覽器中開啟
  window.open(url, '_blank');
};

/**
 * 工具列操作
 */
const handleNewSession = async () => {
  try {
    await createNewSession();
    webviewRef.value?.reload();
  } catch (error) {
    console.error('Failed to create new session:', error);
  }
};

const handleRefresh = () => {
  webviewRef.value?.reload();
};

const handleSwitchSession = async (sessionId: string) => {
  try {
    await switchSession(sessionId);
    showHistory.value = false;
  } catch (error) {
    console.error('Failed to switch session:', error);
  }
};

const handleDeleteSession = async (sessionId: string) => {
  if (confirm('確定要刪除這個會話嗎？')) {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }
};

/**
 * 檢查服務健康狀態
 */
const checkServiceHealth = async () => {
  if (!service.value) return;

  try {
    const status = await checkHealth(service.value);
    serviceStatus.value = status;
  } catch (error) {
    console.error('Failed to check service health:', error);
  }
};

/**
 * 監聽服務狀態變化
 */
let unwatch: (() => void) | null = null;

onMounted(async () => {
  // 載入 AI 服務
  if (aiStore.services.length === 0) {
    await aiStore.loadAIServices();
  }

  // 載入會話列表
  if (chatStore.sessions.length === 0) {
    await chatStore.loadSessions();
  }

  // 檢查服務健康狀態
  await checkServiceHealth();

  // 監聽狀態變化
  unwatch = watchStatus(serviceId, (status) => {
    serviceStatus.value = status;
  });

  // 定期檢查服務狀態
  const healthCheckInterval = setInterval(checkServiceHealth, 5 * 60 * 1000); // 每 5 分鐘

  // 清理
  onUnmounted(() => {
    clearInterval(healthCheckInterval);
    if (unwatch) {
      unwatch();
    }
  });
});
</script>

<style scoped lang="scss">
.chat-window {
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

.service-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.status-indicator {
  display: flex;
  align-items: center;
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

.webview-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--v-theme-on-background);
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
</style>
