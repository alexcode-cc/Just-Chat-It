<template>
  <v-card class="prompt-input-area liquid-glass-card">
    <v-card-title>
      <div class="d-flex align-center justify-space-between">
        <span>輸入提示詞</span>
        <v-btn size="small" variant="text" prepend-icon="mdi-book-open" @click="openPromptPicker">
          從提示詞庫選擇
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <!-- 會話標題 -->
      <v-text-field
        v-model="title"
        label="會話標題"
        placeholder="輸入會話標題（選填）"
        variant="outlined"
        density="comfortable"
        class="mb-4"
        hide-details
      ></v-text-field>

      <!-- 提示詞內容 -->
      <v-textarea
        v-model="promptContent"
        label="提示詞內容"
        placeholder="輸入要發送給 AI 的提示詞..."
        variant="outlined"
        rows="8"
        auto-grow
        :rules="[rules.required, rules.minLength]"
        counter
        :maxlength="10000"
      ></v-textarea>

      <!-- 統計資訊 -->
      <div class="d-flex justify-space-between align-center mt-2 text-caption text-grey">
        <span>字元數: {{ characterCount }}</span>
        <span>預估 Token: {{ estimatedTokens }}</span>
      </div>

      <!-- 操作按鈕 -->
      <div class="action-buttons mt-4">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-send"
          :disabled="!canSubmit"
          :loading="loading"
          @click="handleSubmit"
        >
          發送到 {{ selectedCount }} 個 AI
        </v-btn>

        <v-btn variant="outlined" size="large" class="ml-2" @click="handleClear">清空</v-btn>

        <v-spacer></v-spacer>

        <!-- 進階選項 -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn variant="text" icon="mdi-dots-vertical" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item @click="pasteFromClipboard">
              <template #prepend>
                <v-icon>mdi-content-paste</v-icon>
              </template>
              <v-list-item-title>從剪貼簿貼上</v-list-item-title>
            </v-list-item>
            <v-list-item @click="copyToClipboard">
              <template #prepend>
                <v-icon>mdi-content-copy</v-icon>
              </template>
              <v-list-item-title>複製到剪貼簿</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="loadTemplate">
              <template #prepend>
                <v-icon>mdi-file-document</v-icon>
              </template>
              <v-list-item-title>載入模板</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card-text>

    <!-- 提示詞選擇器對話框 -->
    <PromptQuickPicker
      v-model:visible="showPromptPicker"
      @select="handlePromptSelect"
    ></PromptQuickPicker>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCompareStore } from '../../stores/compare';
import PromptQuickPicker from '../prompts/PromptQuickPicker.vue';
import type { Prompt } from '../../../shared/types/database';

interface Props {
  loading?: boolean;
}

interface Emits {
  (e: 'submit', payload: { title: string; promptContent: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

// Stores
const compareStore = useCompareStore();

// 狀態
const title = ref('');
const promptContent = ref('');
const showPromptPicker = ref(false);

// 驗證規則
const rules = {
  required: (v: string) => !!v || '請輸入提示詞內容',
  minLength: (v: string) => v.length >= 10 || '提示詞內容至少需要 10 個字元',
};

// 計算屬性
const characterCount = computed(() => promptContent.value.length);
const estimatedTokens = computed(() => Math.ceil(characterCount.value / 4)); // 粗略估計
const selectedCount = computed(() => compareStore.selectedAIServices.length);
const canSubmit = computed(() => {
  return (
    promptContent.value.length >= 10 &&
    selectedCount.value > 0 &&
    !props.loading
  );
});

/**
 * 打開提示詞選擇器
 */
const openPromptPicker = () => {
  showPromptPicker.value = true;
};

/**
 * 處理提示詞選擇
 */
const handlePromptSelect = (prompt: Prompt) => {
  promptContent.value = prompt.content;
  if (!title.value) {
    title.value = prompt.title;
  }
  showPromptPicker.value = false;
};

/**
 * 處理提交
 */
const handleSubmit = () => {
  if (!canSubmit.value) return;

  const sessionTitle = title.value || `比較 - ${new Date().toLocaleString()}`;

  emit('submit', {
    title: sessionTitle,
    promptContent: promptContent.value,
  });
};

/**
 * 清空內容
 */
const handleClear = () => {
  title.value = '';
  promptContent.value = '';
};

/**
 * 從剪貼簿貼上
 */
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      promptContent.value = text;
    }
  } catch (error) {
    console.error('Failed to paste from clipboard:', error);
  }
};

/**
 * 複製到剪貼簿
 */
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(promptContent.value);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};

/**
 * 載入模板（預留功能）
 */
const loadTemplate = () => {
  // TODO: 實作模板載入功能
  console.log('Load template - to be implemented');
};

// 暴露方法給父組件
defineExpose({
  clear: handleClear,
});
</script>

<style scoped lang="scss">
.prompt-input-area {
  width: 100%;
}

.action-buttons {
  display: flex;
  align-items: center;
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
  .liquid-glass-card {
    background: rgba(0, 0, 0, 0.4) !important;
  }
}
</style>
