<template>
  <div class="hotkey-editor">
    <!-- 標題和操作欄 -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3>熱鍵設定</h3>
        <p class="text-caption text-grey mt-1">
          自訂應用程式的快捷鍵。建議使用組合鍵（如 Ctrl+Shift+字母）以避免與系統快捷鍵衝突。
        </p>
      </div>
      <div class="d-flex gap-2">
        <v-btn variant="outlined" @click="loadHotkeys" :loading="loading">
          <v-icon start>mdi-refresh</v-icon>
          重新載入
        </v-btn>
        <v-btn
          variant="outlined"
          color="warning"
          @click="confirmReset"
          :disabled="loading"
        >
          <v-icon start>mdi-restore</v-icon>
          重置為預設
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          @click="saveHotkeys"
          :loading="saving"
          :disabled="!hasChanges"
        >
          <v-icon start>mdi-content-save</v-icon>
          儲存變更
        </v-btn>
      </div>
    </div>

    <!-- 載入中 -->
    <v-progress-linear v-if="loading" indeterminate class="mb-4"></v-progress-linear>

    <!-- 錯誤訊息 -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- 成功訊息 -->
    <v-alert v-if="success" type="success" variant="tonal" class="mb-4" closable @click:close="success = ''">
      {{ success }}
    </v-alert>

    <!-- 熱鍵列表 -->
    <div v-if="!loading">
      <!-- 系統熱鍵 -->
      <v-card class="liquid-glass-card mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-application-cog</v-icon>
          系統熱鍵
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              v-for="hotkey in systemHotkeys"
              :key="hotkey.id"
              cols="12"
              md="6"
            >
              <div class="hotkey-item">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="hotkey.enabled"
                      color="primary"
                      density="compact"
                      hide-details
                      @update:model-value="markAsChanged(hotkey.id)"
                    />
                    <span class="ml-2 font-weight-medium">{{ hotkey.name }}</span>
                  </div>
                </div>
                <HotkeyInput
                  v-model="hotkey.accelerator"
                  :label="hotkey.description"
                  :exclude-id="hotkey.id"
                  :disabled="!hotkey.enabled"
                  @change="markAsChanged(hotkey.id)"
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- AI 服務熱鍵 -->
      <v-card class="liquid-glass-card">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-robot</v-icon>
          AI 服務熱鍵
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              v-for="hotkey in aiServiceHotkeys"
              :key="hotkey.id"
              cols="12"
              md="6"
            >
              <div class="hotkey-item">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <v-switch
                      v-model="hotkey.enabled"
                      color="primary"
                      density="compact"
                      hide-details
                      @update:model-value="markAsChanged(hotkey.id)"
                    />
                    <span class="ml-2 font-weight-medium">{{ hotkey.name }}</span>
                  </div>
                </div>
                <HotkeyInput
                  v-model="hotkey.accelerator"
                  :label="hotkey.description"
                  :exclude-id="hotkey.id"
                  :disabled="!hotkey.enabled"
                  @change="markAsChanged(hotkey.id)"
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>

    <!-- 重置確認對話框 -->
    <v-dialog v-model="showResetDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          確認重置
        </v-card-title>
        <v-card-text>
          確定要將所有熱鍵重置為預設設定嗎？此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showResetDialog = false">取消</v-btn>
          <v-btn color="warning" variant="flat" @click="resetHotkeys">確認重置</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import HotkeyInput from './HotkeyInput.vue';

// 熱鍵設定介面
interface HotkeySettings {
  id: string;
  name: string;
  accelerator: string;
  description: string;
  category: 'system' | 'ai-service' | 'custom';
  enabled: boolean;
  aiServiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// State
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');
const hotkeys = ref<HotkeySettings[]>([]);
const changedIds = ref<Set<string>>(new Set());
const showResetDialog = ref(false);

// Computed
const systemHotkeys = computed(() => {
  return hotkeys.value.filter((h) => h.category === 'system');
});

const aiServiceHotkeys = computed(() => {
  return hotkeys.value.filter((h) => h.category === 'ai-service');
});

const hasChanges = computed(() => {
  return changedIds.value.size > 0;
});

/**
 * 載入熱鍵設定
 */
async function loadHotkeys() {
  loading.value = true;
  error.value = '';

  try {
    const allHotkeys = await window.electronAPI.getAllHotkeys();
    hotkeys.value = allHotkeys;
    changedIds.value.clear();
  } catch (err) {
    error.value = '載入熱鍵設定失敗';
    console.error('Failed to load hotkeys:', err);
  } finally {
    loading.value = false;
  }
}

/**
 * 標記為已變更
 */
function markAsChanged(id: string) {
  changedIds.value.add(id);
}

/**
 * 儲存熱鍵設定
 */
async function saveHotkeys() {
  if (!hasChanges.value) return;

  saving.value = true;
  error.value = '';
  success.value = '';

  try {
    // 只更新有變更的熱鍵
    const changedHotkeys = hotkeys.value.filter((h) => changedIds.value.has(h.id));

    // 批次更新
    await window.electronAPI.batchUpdateHotkeys(
      changedHotkeys.map((h) => ({
        id: h.id,
        accelerator: h.accelerator,
        enabled: h.enabled,
      }))
    );

    success.value = `成功更新 ${changedHotkeys.length} 個熱鍵設定`;
    changedIds.value.clear();

    // 3秒後清除成功訊息
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err) {
    error.value = '儲存熱鍵設定失敗';
    console.error('Failed to save hotkeys:', err);
  } finally {
    saving.value = false;
  }
}

/**
 * 確認重置
 */
function confirmReset() {
  showResetDialog.value = true;
}

/**
 * 重置熱鍵為預設值
 */
async function resetHotkeys() {
  showResetDialog.value = false;
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await window.electronAPI.resetHotkeysToDefaults();
    await loadHotkeys();
    success.value = '已重置所有熱鍵為預設設定';

    // 3秒後清除成功訊息
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err) {
    error.value = '重置熱鍵設定失敗';
    console.error('Failed to reset hotkeys:', err);
  } finally {
    loading.value = false;
  }
}

// 載入熱鍵設定
onMounted(() => {
  loadHotkeys();
});
</script>

<style scoped lang="scss">
.hotkey-editor {
  .liquid-glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .hotkey-item {
    padding: 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-2px);
    }
  }

  .gap-2 {
    gap: 8px;
  }
}
</style>
