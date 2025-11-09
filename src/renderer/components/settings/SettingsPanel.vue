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

            <v-row>
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
                  @update:model-value="saveSettings"
                ></v-slider>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.liquidGlass.enableMouseTracking"
                  label="啟用滑鼠追蹤光影"
                  color="primary"
                  @update:model-value="saveSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.liquidGlass.enableRipple"
                  label="啟用波紋效果"
                  color="primary"
                  @update:model-value="saveSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="settings.liquidGlass.enableScrollEffect"
                  label="啟用捲動光影"
                  color="primary"
                  @update:model-value="saveSettings"
                ></v-switch>
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
            <h2 class="mb-4">熱鍵設定</h2>
            <p class="text-grey mb-4">自訂應用程式的快捷鍵（熱鍵設定功能將在後續完善）</p>
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { storeToRefs } from 'pinia';

// 設定 Store
const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);

// 當前選中的設定區塊
const activeSection = ref('general');

// 剪貼簿監控狀態
const clipboardMonitoring = ref(false);
const lastClipboardContent = ref<{ text: string; timestamp: Date; hash: string } | null>(null);

// 設定區塊
const settingSections = [
  { id: 'general', title: '一般設定', icon: 'mdi-cog' },
  { id: 'appearance', title: '外觀設定', icon: 'mdi-palette' },
  { id: 'clipboard', title: '剪貼簿設定', icon: 'mdi-content-paste' },
  { id: 'hotkeys', title: '熱鍵設定', icon: 'mdi-keyboard' },
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
</style>
