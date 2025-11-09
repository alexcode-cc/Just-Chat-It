<template>
  <v-container fluid class="settings-panel pa-6">
    <v-row>
      <!-- 左側選單 -->
      <v-col cols="12" md="3">
        <v-card class="liquid-glass-card">
          <v-list>
            <v-list-item
              v-for="section in settingSections"
              :key="section.id"
              :value="section.id"
              :active="activeSection === section.id"
              @click="activeSection = section.id"
            >
              <template v-slot:prepend>
                <v-icon>{{ section.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ section.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- 右側設定內容 -->
      <v-col cols="12" md="9">
        <v-card class="liquid-glass-card pa-6">
          <!-- 一般設定 -->
          <div v-if="activeSection === 'general'">
            <h2 class="mb-4">一般設定</h2>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="settings.theme"
                  :items="themeOptions"
                  label="主題"
                  variant="outlined"
                  @update:model-value="handleThemeChange"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="settings.language"
                  :items="languageOptions"
                  label="語言"
                  variant="outlined"
                  @update:model-value="saveSettings"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.showTrayIcon"
                  label="顯示系統托盤圖示"
                  color="primary"
                  @update:model-value="saveSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.minimizeToTray"
                  label="關閉視窗時最小化到托盤"
                  color="primary"
                  @update:model-value="saveSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.windowAlwaysOnTop"
                  label="視窗永遠置頂"
                  color="primary"
                  @update:model-value="saveSettings"
                ></v-switch>
              </v-col>
            </v-row>
          </div>

          <!-- 外觀設定 -->
          <div v-if="activeSection === 'appearance'">
            <h2 class="mb-4">外觀設定</h2>

            <!-- 預設方案 -->
            <v-row class="mb-4">
              <v-col cols="12">
                <h3 class="text-subtitle-1 mb-3">預設方案</h3>
                <div class="d-flex gap-3 flex-wrap">
                  <v-card
                    v-for="preset in liquidGlassPresets"
                    :key="preset.name"
                    class="preset-card"
                    :class="{ active: isPresetActive(preset) }"
                    @click="applyPreset(preset)"
                  >
                    <v-card-text class="pa-3">
                      <div class="font-weight-medium mb-1">{{ preset.name }}</div>
                      <div class="text-caption text-grey">{{ preset.description }}</div>
                    </v-card-text>
                  </v-card>
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <!-- 自訂設定 -->
            <v-row>
              <v-col cols="12">
                <h3 class="text-subtitle-1 mb-3">自訂設定</h3>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.liquidGlass.enabled"
                  label="啟用 Liquid Glass 效果"
                  color="primary"
                  @update:model-value="saveSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <label class="text-subtitle-2 mb-2 d-block"
                  >效果強度 ({{ settings.liquidGlass.intensity }}%)</label
                >
                <v-slider
                  v-model="settings.liquidGlass.intensity"
                  :min="0"
                  :max="100"
                  :step="5"
                  thumb-label
                  color="primary"
                  :disabled="!settings.liquidGlass.enabled"
                  @update:model-value="saveSettings"
                ></v-slider>
              </v-col>

              <v-col cols="12">
                <label class="text-subtitle-2 mb-2 d-block"
                  >透明度 ({{ settings.liquidGlass.opacity }}%)</label
                >
                <v-slider
                  v-model="settings.liquidGlass.opacity"
                  :min="0"
                  :max="100"
                  :step="5"
                  thumb-label
                  color="primary"
                  :disabled="!settings.liquidGlass.enabled"
                  @update:model-value="saveSettings"
                ></v-slider>
              </v-col>

              <v-col cols="12">
                <label class="text-subtitle-2 mb-2 d-block"
                  >模糊程度 ({{ settings.liquidGlass.blurAmount }}%)</label
                >
                <v-slider
                  v-model="settings.liquidGlass.blurAmount"
                  :min="0"
                  :max="100"
                  :step="5"
                  thumb-label
                  color="primary"
                  :disabled="!settings.liquidGlass.enabled"
                  @update:model-value="saveSettings"
                ></v-slider>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-2"></v-divider>
                <h4 class="text-subtitle-2 mb-3 mt-4">進階效果</h4>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="settings.liquidGlass.enableMouseTracking"
                  label="啟用滑鼠追蹤光影"
                  color="primary"
                  :disabled="!settings.liquidGlass.enabled"
                  @update:model-value="saveSettings"
                ></v-switch>
                <p class="text-caption text-grey mt-n2">滑鼠移動時產生動態光影效果</p>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="settings.liquidGlass.enableRipple"
                  label="啟用波紋效果"
                  color="primary"
                  :disabled="!settings.liquidGlass.enabled"
                  @update:model-value="saveSettings"
                ></v-switch>
                <p class="text-caption text-grey mt-n2">點擊時產生水波紋動畫</p>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="settings.liquidGlass.enableScrollEffect"
                  label="啟用捲動光影"
                  color="primary"
                  :disabled="!settings.liquidGlass.enabled"
                  @update:model-value="saveSettings"
                ></v-switch>
                <p class="text-caption text-grey mt-n2">捲動時產生流動光影效果</p>
              </v-col>
            </v-row>
          </div>

          <!-- 剪貼簿設定 -->
          <div v-if="activeSection === 'clipboard'">
            <h2 class="mb-4">剪貼簿設定</h2>

            <v-row>
              <v-col cols="12">
                <v-alert type="info" variant="tonal" class="mb-4">
                  剪貼簿智能整合功能可以在使用熱鍵啟動應用時，自動檢測並填入剪貼簿內容。
                </v-alert>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.clipboard.enabled"
                  label="啟用剪貼簿檢查"
                  color="primary"
                  hide-details
                  @update:model-value="handleClipboardSettingChange"
                >
                  <template v-slot:append>
                    <v-chip
                      :color="clipboardMonitoring ? 'success' : 'grey'"
                      size="small"
                      variant="flat"
                    >
                      {{ clipboardMonitoring ? '監控中' : '未啟用' }}
                    </v-chip>
                  </template>
                </v-switch>
                <p class="text-caption text-grey mt-2">
                  啟用後，當您使用熱鍵啟動應用時，系統會自動檢查剪貼簿內容並填入聊天輸入框。
                </p>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.clipboard.autoFocus"
                  label="自動聚焦輸入框"
                  color="primary"
                  :disabled="!settings.clipboard.enabled"
                  @update:model-value="handleClipboardSettingChange"
                ></v-switch>
                <p class="text-caption text-grey mt-2">
                  填入剪貼簿內容後，自動將焦點移到輸入框，讓您可以立即開始輸入或修改。
                </p>
              </v-col>

              <v-col cols="12" class="mt-4">
                <v-divider class="mb-4"></v-divider>
                <h3 class="mb-3">剪貼簿狀態</h3>
                <div class="d-flex align-center mb-2">
                  <v-icon class="mr-2" :color="clipboardMonitoring ? 'success' : 'grey'">
                    {{ clipboardMonitoring ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                  <span> 剪貼簿監控：{{ clipboardMonitoring ? '運行中' : '已停用' }} </span>
                </div>
                <div v-if="lastClipboardContent" class="mt-3">
                  <p class="text-caption text-grey mb-2">最後檢測到的內容：</p>
                  <v-sheet class="pa-3 rounded" color="surface-variant">
                    <code class="text-caption">{{
                      lastClipboardContent.text.substring(0, 100) +
                      (lastClipboardContent.text.length > 100 ? '...' : '')
                    }}</code>
                  </v-sheet>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- 熱鍵設定 -->
          <div v-if="activeSection === 'hotkeys'">
            <HotkeyEditor />
          </div>

          <!-- 進階設定 -->
          <div v-if="activeSection === 'advanced'">
            <h2 class="mb-4">進階設定</h2>

            <v-row>
              <!-- 設定備份與還原 -->
              <v-col cols="12">
                <h3 class="text-subtitle-1 mb-3">設定備份與還原</h3>
                <v-alert type="info" variant="tonal" class="mb-4">
                  您可以匯出目前的設定進行備份，或匯入先前儲存的設定檔案。
                </v-alert>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="liquid-glass-card pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="primary" size="large" class="mr-3">mdi-export</v-icon>
                    <div>
                      <div class="font-weight-medium">匯出設定</div>
                      <div class="text-caption text-grey">下載目前的設定檔案</div>
                    </div>
                  </div>
                  <v-btn
                    block
                    variant="flat"
                    color="primary"
                    @click="exportSettings"
                  >
                    <v-icon start>mdi-download</v-icon>
                    匯出設定
                  </v-btn>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="liquid-glass-card pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="primary" size="large" class="mr-3">mdi-import</v-icon>
                    <div>
                      <div class="font-weight-medium">匯入設定</div>
                      <div class="text-caption text-grey">從檔案還原設定</div>
                    </div>
                  </div>
                  <v-btn
                    block
                    variant="flat"
                    color="primary"
                    @click="triggerImport"
                  >
                    <v-icon start>mdi-upload</v-icon>
                    匯入設定
                  </v-btn>
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".json"
                    style="display: none"
                    @change="importSettings"
                  />
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
              </v-col>

              <!-- 重置設定 -->
              <v-col cols="12">
                <h3 class="text-subtitle-1 mb-3">重置設定</h3>
                <v-alert type="warning" variant="tonal" class="mb-4">
                  將所有設定還原為預設值。此操作無法復原。
                </v-alert>
              </v-col>

              <v-col cols="12">
                <v-card class="liquid-glass-card pa-4">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="warning" size="large" class="mr-3">mdi-restore</v-icon>
                    <div>
                      <div class="font-weight-medium">重置所有設定</div>
                      <div class="text-caption text-grey">還原為預設設定值</div>
                    </div>
                  </div>
                  <v-btn
                    block
                    variant="flat"
                    color="warning"
                    @click="confirmResetSettings"
                  >
                    <v-icon start>mdi-alert</v-icon>
                    重置所有設定
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 關於 -->
          <div v-if="activeSection === 'about'">
            <h2 class="mb-4">關於</h2>
            <v-row>
              <v-col cols="12">
                <div class="text-center">
                  <h3 class="mb-2">Just Chat It</h3>
                  <p class="text-grey mb-4">讓我們開始聊天吧</p>
                  <p class="text-caption">版本 1.0.0 MVP</p>
                  <p class="text-caption mt-2">© 2024 Just Chat It. All rights reserved.</p>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 重置確認對話框 -->
    <v-dialog v-model="showResetConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          確認重置所有設定
        </v-card-title>
        <v-card-text>
          <p class="mb-2">您確定要將所有設定重置為預設值嗎？</p>
          <p class="text-warning">此操作將無法復原，建議先匯出目前的設定作為備份。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showResetConfirmDialog = false">取消</v-btn>
          <v-btn color="warning" variant="flat" @click="resetSettings">確認重置</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { storeToRefs } from 'pinia';
import HotkeyEditor from './HotkeyEditor.vue';

// 設定 Store
const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);

// 當前選中的設定區塊
const activeSection = ref('general');

// 剪貼簿監控狀態
const clipboardMonitoring = ref(false);
const lastClipboardContent = ref<{ text: string; timestamp: Date; hash: string } | null>(null);

// 匯入檔案引用
const fileInput = ref<HTMLInputElement | null>(null);

// 確認對話框狀態
const showResetConfirmDialog = ref(false);

// 設定區塊
const settingSections = [
  { id: 'general', title: '一般設定', icon: 'mdi-cog' },
  { id: 'appearance', title: '外觀設定', icon: 'mdi-palette' },
  { id: 'clipboard', title: '剪貼簿設定', icon: 'mdi-content-paste' },
  { id: 'hotkeys', title: '熱鍵設定', icon: 'mdi-keyboard' },
  { id: 'advanced', title: '進階設定', icon: 'mdi-cog-outline' },
  { id: 'about', title: '關於', icon: 'mdi-information' },
];

// 主題選項
const themeOptions = [
  { title: 'Liquid Glass 亮色', value: 'liquidGlassLight' },
  { title: 'Liquid Glass 深色', value: 'liquidGlassDark' },
];

// 語言選項
const languageOptions = [
  { title: '繁體中文', value: 'zh-TW' },
  { title: '简体中文', value: 'zh-CN' },
  { title: 'English', value: 'en-US' },
];

// Liquid Glass 預設方案
const liquidGlassPresets = [
  {
    name: '標準',
    description: '平衡的視覺效果',
    settings: {
      enabled: true,
      intensity: 70,
      opacity: 10,
      blurAmount: 80,
      enableMouseTracking: true,
      enableRipple: true,
      enableScrollEffect: true,
    },
  },
  {
    name: '柔和',
    description: '較低的透明度和效果',
    settings: {
      enabled: true,
      intensity: 50,
      opacity: 5,
      blurAmount: 60,
      enableMouseTracking: false,
      enableRipple: true,
      enableScrollEffect: false,
    },
  },
  {
    name: '強烈',
    description: '高強度視覺效果',
    settings: {
      enabled: true,
      intensity: 90,
      opacity: 15,
      blurAmount: 95,
      enableMouseTracking: true,
      enableRipple: true,
      enableScrollEffect: true,
    },
  },
  {
    name: '極簡',
    description: '最小化效果',
    settings: {
      enabled: true,
      intensity: 30,
      opacity: 3,
      blurAmount: 40,
      enableMouseTracking: false,
      enableRipple: false,
      enableScrollEffect: false,
    },
  },
  {
    name: '關閉',
    description: '停用所有效果',
    settings: {
      enabled: false,
      intensity: 0,
      opacity: 0,
      blurAmount: 0,
      enableMouseTracking: false,
      enableRipple: false,
      enableScrollEffect: false,
    },
  },
];

/**
 * 儲存設定
 */
const saveSettings = async () => {
  try {
    await settingsStore.saveSettings();
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

/**
 * 處理主題變更
 */
const handleThemeChange = async (theme: string) => {
  try {
    await settingsStore.setTheme(theme as 'liquidGlassLight' | 'liquidGlassDark');
  } catch (error) {
    console.error('Failed to change theme:', error);
  }
};

/**
 * 處理剪貼簿設定變更
 */
const handleClipboardSettingChange = async () => {
  try {
    // 更新設定到主程序
    await window.electronAPI.updateClipboardSettings(settings.value.clipboard);

    // 儲存設定
    await saveSettings();

    // 更新監控狀態
    await updateClipboardStatus();
  } catch (error) {
    console.error('Failed to update clipboard settings:', error);
  }
};

/**
 * 更新剪貼簿狀態
 */
const updateClipboardStatus = async () => {
  try {
    clipboardMonitoring.value = await window.electronAPI.isClipboardMonitoring();
    lastClipboardContent.value = await window.electronAPI.getLastClipboardContent();
  } catch (error) {
    console.error('Failed to update clipboard status:', error);
  }
};

/**
 * 檢查是否為當前啟用的預設方案
 */
const isPresetActive = (preset: typeof liquidGlassPresets[0]): boolean => {
  const current = settings.value.liquidGlass;
  const presetSettings = preset.settings;

  return (
    current.enabled === presetSettings.enabled &&
    current.intensity === presetSettings.intensity &&
    current.opacity === presetSettings.opacity &&
    current.blurAmount === presetSettings.blurAmount &&
    current.enableMouseTracking === presetSettings.enableMouseTracking &&
    current.enableRipple === presetSettings.enableRipple &&
    current.enableScrollEffect === presetSettings.enableScrollEffect
  );
};

/**
 * 應用預設方案
 */
const applyPreset = async (preset: typeof liquidGlassPresets[0]) => {
  try {
    await settingsStore.updateLiquidGlassSettings(preset.settings);
  } catch (error) {
    console.error('Failed to apply preset:', error);
  }
};

/**
 * 匯出設定
 */
const exportSettings = () => {
  try {
    const settingsJson = settingsStore.exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `just-chat-it-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export settings:', error);
    alert('匯出設定失敗');
  }
};

/**
 * 觸發匯入檔案選擇
 */
const triggerImport = () => {
  fileInput.value?.click();
};

/**
 * 匯入設定
 */
const importSettings = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await settingsStore.importSettings(content);
        alert('匯入設定成功');
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('匯入設定失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
      }
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('Failed to read file:', error);
    alert('讀取檔案失敗');
  }

  // 重置檔案輸入
  target.value = '';
};

/**
 * 確認重置設定
 */
const confirmResetSettings = () => {
  showResetConfirmDialog.value = true;
};

/**
 * 重置設定
 */
const resetSettings = async () => {
  try {
    await settingsStore.resetSettings();
    showResetConfirmDialog.value = false;
    alert('已重置所有設定為預設值');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    alert('重置設定失敗');
  }
};

// 載入設定
onMounted(async () => {
  await settingsStore.loadSettings();
  await updateClipboardStatus();

  // 定期更新剪貼簿狀態
  setInterval(updateClipboardStatus, 5000);
});
</script>

<style scoped lang="scss">
.settings-panel {
  height: 100%;
  overflow-y: auto;
}

.liquid-glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

.v-list-item {
  border-radius: 8px;
  margin: 4px 8px;

  &.v-list-item--active {
    background: rgba(var(--v-theme-primary), 0.2);
  }
}

code {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.preset-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  min-width: 150px;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.15);
  }
}

.gap-3 {
  gap: 12px;
}
</style>
