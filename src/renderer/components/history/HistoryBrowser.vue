<template>
  <div class="history-browser">
    <!-- 頂部工具列 -->
    <v-toolbar class="liquid-glass toolbar-glass" density="compact" elevation="0">
      <v-toolbar-title>
        <v-icon>mdi-history</v-icon>
        對話歷史記錄
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- 搜尋框 -->
      <v-text-field
        v-model="searchText"
        density="compact"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        placeholder="搜尋訊息..."
        hide-details
        clearable
        class="mx-4"
        style="max-width: 300px"
        @update:model-value="debouncedSearch"
      ></v-text-field>

      <!-- 篩選按鈕 -->
      <v-btn icon variant="text" @click="filterDialog = true">
        <v-icon>mdi-filter-variant</v-icon>
      </v-btn>

      <!-- 統計資訊按鈕 -->
      <v-btn icon variant="text" @click="showStatsDialog">
        <v-icon>mdi-chart-box</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- 主要內容區 -->
    <div class="content-area">
      <!-- 側邊欄：會話列表 -->
      <div class="sidebar liquid-glass-panel">
        <div class="sidebar-header">
          <h3>會話列表</h3>
          <v-chip size="small" class="ml-2">{{ filteredSessions.length }}</v-chip>
        </div>

        <!-- AI 服務篩選 -->
        <v-select
          v-model="selectedAIService"
          :items="aiServiceOptions"
          item-title="text"
          item-value="value"
          density="compact"
          variant="outlined"
          prepend-inner-icon="mdi-robot"
          hide-details
          class="mb-3"
        ></v-select>

        <!-- 會話列表 -->
        <v-list class="session-list">
          <v-list-item
            v-for="session in filteredSessions"
            :key="session.id"
            :active="selectedSessionId === session.id"
            class="session-item"
            @click="selectSession(session.id)"
          >
            <template #prepend>
              <v-avatar :color="getAIServiceColor(session.aiServiceId)" size="32">
                <v-icon color="white" size="20">{{ getAIServiceIcon(session.aiServiceId) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>{{ session.title }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatDate(session.updatedAt) }}
              <v-chip size="x-small" class="ml-1">{{ getMessageCount(session.id) }}</v-chip>
            </v-list-item-subtitle>

            <template #append>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon size="small" variant="text" v-bind="props">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="exportSession(session.id, 'markdown')">
                    <v-list-item-title>
                      <v-icon size="small">mdi-file-document</v-icon>
                      匯出為 Markdown
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="exportSession(session.id, 'json')">
                    <v-list-item-title>
                      <v-icon size="small">mdi-code-json</v-icon>
                      匯出為 JSON
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteSession(session.id)">
                    <v-list-item-title class="text-error">
                      <v-icon size="small">mdi-delete</v-icon>
                      刪除會話
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>

          <v-list-item v-if="filteredSessions.length === 0" class="text-center">
            <v-list-item-title class="text-grey">沒有找到會話記錄</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- 主要區域：訊息查看器 -->
      <div class="main-area">
        <div v-if="selectedSessionId && currentSession" class="messages-container">
          <!-- 會話標題 -->
          <div class="session-header liquid-glass">
            <div class="session-info">
              <h2>{{ currentSession.title }}</h2>
              <p class="text-grey">
                {{ getAIServiceName(currentSession.aiServiceId) }} •
                {{ formatDateTime(currentSession.createdAt) }}
              </p>
            </div>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-download"
              @click="exportSession(currentSession.id, 'markdown')"
            >
              匯出對話
            </v-btn>
          </div>

          <!-- 訊息列表 -->
          <div ref="messagesContainer" class="messages-list">
            <div
              v-for="message in currentMessages"
              :key="message.id"
              :class="['message-bubble', message.isUser ? 'user-message' : 'assistant-message']"
            >
              <div class="message-header">
                <v-icon size="small">{{
                  message.isUser ? 'mdi-account' : 'mdi-robot'
                }}</v-icon>
                <span class="message-role">{{
                  message.isUser ? '使用者' : 'AI 助手'
                }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-content" v-html="formatMessageContent(message.content)"></div>
            </div>

            <div v-if="currentMessages.length === 0" class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1">mdi-message-off</v-icon>
              <p class="text-grey mt-4">此會話尚無訊息記錄</p>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <v-icon size="96" color="grey-lighten-2">mdi-history</v-icon>
          <h3 class="mt-4 text-grey">選擇一個會話以查看歷史記錄</h3>
          <p class="text-grey-lighten-1">或使用搜尋功能查找特定訊息</p>
        </div>
      </div>
    </div>

    <!-- 篩選對話框 -->
    <v-dialog v-model="filterDialog" max-width="500">
      <v-card class="liquid-glass-card">
        <v-card-title>進階篩選</v-card-title>
        <v-card-text>
          <v-select
            v-model="filter.aiServiceId"
            :items="aiServiceOptions"
            item-title="text"
            item-value="value"
            label="AI 服務"
            density="compact"
            variant="outlined"
            clearable
            class="mb-3"
          ></v-select>

          <v-text-field
            v-model="filter.dateFrom"
            label="開始日期"
            type="date"
            density="compact"
            variant="outlined"
            class="mb-3"
          ></v-text-field>

          <v-text-field
            v-model="filter.dateTo"
            label="結束日期"
            type="date"
            density="compact"
            variant="outlined"
            class="mb-3"
          ></v-text-field>

          <v-select
            v-model="filter.messageType"
            :items="[
              { text: '全部', value: null },
              { text: '僅使用者訊息', value: true },
              { text: '僅 AI 回應', value: false },
            ]"
            item-title="text"
            item-value="value"
            label="訊息類型"
            density="compact"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="resetFilters">重置</v-btn>
          <v-btn variant="elevated" color="primary" @click="applyFilters">套用</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 統計對話框 -->
    <v-dialog v-model="statsDialog" max-width="600">
      <v-card class="liquid-glass-card">
        <v-card-title>
          <v-icon>mdi-chart-box</v-icon>
          歷史記錄統計
        </v-card-title>
        <v-card-text v-if="stats">
          <v-row>
            <v-col cols="6">
              <v-card class="stat-card">
                <v-card-title class="text-h4">{{ stats.totalSessions }}</v-card-title>
                <v-card-subtitle>總會話數</v-card-subtitle>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card class="stat-card">
                <v-card-title class="text-h4">{{ stats.totalMessages }}</v-card-title>
                <v-card-subtitle>總訊息數</v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>

          <h4 class="mt-4">依 AI 服務分類</h4>
          <v-list>
            <v-list-item
              v-for="(data, serviceId) in stats.byAIService"
              :key="serviceId"
              class="px-0"
            >
              <template #prepend>
                <v-avatar :color="getAIServiceColor(serviceId)" size="32">
                  <v-icon color="white" size="20">{{ getAIServiceIcon(serviceId) }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ getAIServiceName(serviceId) }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ data.sessions }} 會話 • {{ data.messages }} 訊息
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="statsDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useChatStore } from '../../stores/chat';
import { useAIStore } from '../../stores/ai';
import type { ChatSession, ChatMessage } from '../../../shared/types/database';

const chatStore = useChatStore();
const aiStore = useAIStore();

// 狀態
const searchText = ref('');
const selectedAIService = ref<string | null>(null);
const selectedSessionId = ref<string | null>(null);
const filterDialog = ref(false);
const statsDialog = ref(false);
const stats = ref<any>(null);
const messagesContainer = ref<HTMLElement | null>(null);

// 篩選條件
const filter = ref({
  aiServiceId: null as string | null,
  dateFrom: '',
  dateTo: '',
  messageType: null as boolean | null,
});

// 計算屬性
const aiServiceOptions = computed(() => {
  return [
    { text: '全部 AI 服務', value: null },
    ...aiStore.services.map((service) => ({
      text: service.displayName,
      value: service.id,
    })),
  ];
});

const filteredSessions = computed(() => {
  let sessions = chatStore.sessions;

  if (selectedAIService.value) {
    sessions = sessions.filter((s) => s.aiServiceId === selectedAIService.value);
  }

  if (searchText.value) {
    const query = searchText.value.toLowerCase();
    sessions = sessions.filter((s) => s.title.toLowerCase().includes(query));
  }

  return sessions.sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
});

const currentSession = computed(() => {
  return chatStore.sessions.find((s) => s.id === selectedSessionId.value) || null;
});

const currentMessages = computed(() => {
  if (!selectedSessionId.value) return [];
  return chatStore.messages;
});

// 方法
const selectSession = async (sessionId: string) => {
  selectedSessionId.value = sessionId;
  await chatStore.loadSessionHistory(sessionId);
  await nextTick();
  scrollToBottom();
};

const exportSession = async (sessionId: string, format: 'markdown' | 'json') => {
  try {
    let result;
    if (format === 'markdown') {
      result = await window.electronAPI.exportHistoryMarkdown(sessionId);
    } else {
      result = await window.electronAPI.exportHistoryJSON(sessionId);
    }

    if (result.success) {
      // 建立下載連結
      const blob = new Blob([format === 'markdown' ? result.markdown : result.json], {
        type: format === 'markdown' ? 'text/markdown' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to export session:', error);
  }
};

const deleteSession = async (sessionId: string) => {
  if (confirm('確定要刪除此會話嗎？此操作無法復原。')) {
    await chatStore.deleteSession(sessionId);
    if (selectedSessionId.value === sessionId) {
      selectedSessionId.value = null;
    }
  }
};

const debouncedSearch = (() => {
  let timeout: NodeJS.Timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      performSearch();
    }, 300);
  };
})();

const performSearch = async () => {
  if (!searchText.value) {
    await chatStore.loadSessions();
    return;
  }

  // 這裡可以實作更進階的搜尋功能
};

const applyFilters = () => {
  // 應用篩選條件
  filterDialog.value = false;
  performSearch();
};

const resetFilters = () => {
  filter.value = {
    aiServiceId: null,
    dateFrom: '',
    dateTo: '',
    messageType: null,
  };
  selectedAIService.value = null;
  searchText.value = '';
  applyFilters();
};

const showStatsDialog = async () => {
  try {
    const result = await window.electronAPI.getHistoryStats();
    if (result.success) {
      stats.value = result.stats;
      statsDialog.value = true;
    }
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
};

const getMessageCount = (sessionId: string): number => {
  // 這裡可以優化為從 store 取得快取的數量
  return 0;
};

const getAIServiceName = (serviceId: string): string => {
  const service = aiStore.services.find((s) => s.id === serviceId);
  return service?.displayName || serviceId;
};

const getAIServiceColor = (serviceId: string): string => {
  const colors: Record<string, string> = {
    chatgpt: 'green',
    claude: 'orange',
    gemini: 'blue',
    perplexity: 'purple',
    grok: 'grey',
    copilot: 'cyan',
  };
  return colors[serviceId] || 'grey';
};

const getAIServiceIcon = (serviceId: string): string => {
  const icons: Record<string, string> = {
    chatgpt: 'mdi-robot',
    claude: 'mdi-chat',
    gemini: 'mdi-star',
    perplexity: 'mdi-magnify',
    grok: 'mdi-brain',
    copilot: 'mdi-microsoft',
  };
  return icons[serviceId] || 'mdi-robot';
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('zh-TW');
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMessageContent = (content: string): string => {
  // 簡單的 Markdown 風格格式化
  return content
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 生命週期
onMounted(async () => {
  await chatStore.loadSessions();
  await aiStore.loadServices();
});
</script>

<style scoped lang="scss">
.history-browser {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--v-theme-background);
}

.toolbar-glass {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 320px;
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
  }
}

.session-list {
  background: transparent;
}

.session-item {
  margin-bottom: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &.v-list-item--active {
    background: rgba(var(--v-theme-primary), 0.15);
  }
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.session-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .session-info {
    h2 {
      margin: 0 0 8px 0;
    }
  }
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.message-bubble {
  max-width: 80%;
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 12px;
  animation: fadeIn 0.3s;

  &.user-message {
    margin-left: auto;
    background: rgba(var(--v-theme-primary), 0.15);
  }

  &.assistant-message {
    background: rgba(255, 255, 255, 0.05);
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .message-content {
    line-height: 1.6;
    word-wrap: break-word;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
  text-align: center;
}

.liquid-glass-card {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px);
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
