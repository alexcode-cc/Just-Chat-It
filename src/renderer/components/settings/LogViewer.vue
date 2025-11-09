<template>
  <v-container fluid class="log-viewer liquid-glass-panel pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5">日誌查看器</h2>
          <div class="d-flex gap-2">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="loadLogs"
            >
              重新載入
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-download"
              @click="exportLogs"
              :loading="exporting"
            >
              匯出日誌
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-folder-open"
              @click="openLogDirectory"
            >
              開啟日誌資料夾
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- 篩選器 -->
    <v-row>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedLevel"
          :items="logLevels"
          label="日誌等級"
          density="compact"
          variant="outlined"
          @update:model-value="filterLogs"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          label="搜尋日誌"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          clearable
          @update:model-value="filterLogs"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedFile"
          :items="logFiles"
          label="日誌檔案"
          density="compact"
          variant="outlined"
          @update:model-value="loadSelectedFile"
        />
      </v-col>
    </v-row>

    <!-- 統計卡片 -->
    <v-row class="mb-4">
      <v-col cols="12" md="3" v-for="stat in stats" :key="stat.label">
        <v-card class="liquid-glass-card">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
            <div class="text-h6 mt-1">{{ stat.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 日誌列表 -->
    <v-row>
      <v-col cols="12">
        <v-card class="liquid-glass-card">
          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <div class="mt-4">載入日誌中...</div>
            </div>

            <div v-else-if="filteredLogs.length === 0" class="text-center py-8 text-medium-emphasis">
              沒有找到日誌
            </div>

            <v-virtual-scroll
              v-else
              :items="filteredLogs"
              :height="600"
              item-height="80"
            >
              <template #default="{ item }">
                <div
                  class="log-entry pa-3"
                  :class="`log-level-${item.level}`"
                  @click="selectedLog = item"
                >
                  <div class="d-flex align-center mb-1">
                    <v-chip
                      :color="getLevelColor(item.level)"
                      size="x-small"
                      class="mr-2"
                    >
                      {{ item.level.toUpperCase() }}
                    </v-chip>
                    <span class="text-caption text-medium-emphasis">{{ formatTimestamp(item.timestamp) }}</span>
                  </div>
                  <div class="log-message">{{ item.message }}</div>
                  <div v-if="item.error" class="log-error text-caption mt-1">
                    {{ item.error.name }}: {{ item.error.message }}
                  </div>
                </div>
                <v-divider />
              </template>
            </v-virtual-scroll>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 日誌詳情對話框 -->
    <v-dialog v-model="showDetails" max-width="800">
      <v-card v-if="selectedLog">
        <v-card-title class="d-flex align-center">
          <v-chip :color="getLevelColor(selectedLog.level)" size="small" class="mr-2">
            {{ selectedLog.level.toUpperCase() }}
          </v-chip>
          <span>日誌詳情</span>
        </v-card-title>

        <v-card-text>
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis">時間</div>
            <div>{{ formatTimestamp(selectedLog.timestamp) }}</div>
          </div>

          <div class="mb-4">
            <div class="text-caption text-medium-emphasis">訊息</div>
            <div>{{ selectedLog.message }}</div>
          </div>

          <div v-if="selectedLog.context" class="mb-4">
            <div class="text-caption text-medium-emphasis">上下文</div>
            <pre class="context-data">{{ JSON.stringify(selectedLog.context, null, 2) }}</pre>
          </div>

          <div v-if="selectedLog.error" class="mb-4">
            <div class="text-caption text-medium-emphasis">錯誤詳情</div>
            <div><strong>{{ selectedLog.error.name }}:</strong> {{ selectedLog.error.message }}</div>
            <pre v-if="selectedLog.error.stack" class="error-stack mt-2">{{ selectedLog.error.stack }}</pre>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDetails = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { LogEntry } from '../../../main/logging/logger';

const logs = ref<LogEntry[]>([]);
const filteredLogs = ref<LogEntry[]>([]);
const loading = ref(false);
const exporting = ref(false);
const selectedLevel = ref<string>('all');
const searchQuery = ref('');
const selectedFile = ref<string>('');
const logFiles = ref<{ title: string; value: string }[]>([]);
const selectedLog = ref<LogEntry | null>(null);
const showDetails = computed({
  get: () => selectedLog.value !== null,
  set: (val) => {
    if (!val) selectedLog.value = null;
  },
});

const logLevels = [
  { title: '全部', value: 'all' },
  { title: 'DEBUG', value: 'debug' },
  { title: 'INFO', value: 'info' },
  { title: 'WARN', value: 'warn' },
  { title: 'ERROR', value: 'error' },
  { title: 'FATAL', value: 'fatal' },
];

const stats = computed(() => {
  const total = filteredLogs.value.length;
  const errors = filteredLogs.value.filter((l) => l.level === 'error' || l.level === 'fatal').length;
  const warnings = filteredLogs.value.filter((l) => l.level === 'warn').length;
  const infos = filteredLogs.value.filter((l) => l.level === 'info' || l.level === 'debug').length;

  return [
    { label: '總計', value: total },
    { label: '錯誤', value: errors },
    { label: '警告', value: warnings },
    { label: '資訊', value: infos },
  ];
});

function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    debug: 'blue-grey',
    info: 'blue',
    warn: 'orange',
    error: 'red',
    fatal: 'purple',
  };
  return colors[level] || 'grey';
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function filterLogs() {
  let filtered = [...logs.value];

  // 依等級篩選
  if (selectedLevel.value !== 'all') {
    filtered = filtered.filter((log) => log.level === selectedLevel.value);
  }

  // 搜尋
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.message.toLowerCase().includes(query) ||
        JSON.stringify(log.context || {}).toLowerCase().includes(query) ||
        (log.error && JSON.stringify(log.error).toLowerCase().includes(query)),
    );
  }

  filteredLogs.value = filtered;
}

async function loadLogs() {
  loading.value = true;
  try {
    // 先載入日誌檔案列表
    const files = await window.electronAPI.getLogFiles();
    logFiles.value = files.map((file: string) => ({
      title: file.split('/').pop() || file,
      value: file,
    }));

    // 如果沒有選擇檔案，選擇最新的
    if (!selectedFile.value && logFiles.value.length > 0) {
      selectedFile.value = logFiles.value[0].value;
    }

    // 載入日誌
    if (selectedFile.value) {
      await loadSelectedFile();
    }
  } catch (error) {
    console.error('Failed to load logs:', error);
  } finally {
    loading.value = false;
  }
}

async function loadSelectedFile() {
  if (!selectedFile.value) return;

  loading.value = true;
  try {
    const entries = await window.electronAPI.readLogFile(selectedFile.value);
    logs.value = entries;
    filterLogs();
  } catch (error) {
    console.error('Failed to read log file:', error);
  } finally {
    loading.value = false;
  }
}

async function exportLogs() {
  exporting.value = true;
  try {
    const exportPath = await window.electronAPI.exportLogs();
    alert(`日誌已匯出到: ${exportPath}`);
  } catch (error) {
    console.error('Failed to export logs:', error);
    alert('匯出日誌失敗');
  } finally {
    exporting.value = false;
  }
}

async function openLogDirectory() {
  try {
    await window.electronAPI.openLogDirectory();
  } catch (error) {
    console.error('Failed to open log directory:', error);
  }
}

onMounted(() => {
  loadLogs();
});

watch(selectedLevel, filterLogs);
watch(searchQuery, filterLogs);
</script>

<style scoped lang="scss">
.log-viewer {
  .log-entry {
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(var(--v-theme-on-surface), 0.04);
    }

    .log-message {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .log-error {
      color: rgb(var(--v-theme-error));
    }

    &.log-level-error,
    &.log-level-fatal {
      border-left: 3px solid rgb(var(--v-theme-error));
    }

    &.log-level-warn {
      border-left: 3px solid rgb(var(--v-theme-warning));
    }
  }

  .context-data,
  .error-stack {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    padding: 12px;
    font-size: 0.75rem;
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>
