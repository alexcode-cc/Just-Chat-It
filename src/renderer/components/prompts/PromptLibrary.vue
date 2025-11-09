<template>
  <div class="prompt-library fill-height">
    <!-- 頂部工具列 -->
    <div class="toolbar liquid-glass pa-4">
      <v-row align="center">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            placeholder="搜尋提示詞..."
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedCategory"
            :items="categoryFilterOptions"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-filter"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2" class="text-right">
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="handleCreate"
          >
            新增提示詞
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- 統計資訊 -->
    <div class="stats pa-4">
      <v-row>
        <v-col cols="6" md="3">
          <v-card class="liquid-glass text-center pa-4" elevation="0">
            <div class="text-h4">{{ promptStore.totalCount }}</div>
            <div class="text-caption text-grey">總提示詞數</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="liquid-glass text-center pa-4" elevation="0">
            <div class="text-h4">{{ promptStore.favoriteCount }}</div>
            <div class="text-caption text-grey">收藏數</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="liquid-glass text-center pa-4" elevation="0">
            <div class="text-h4">{{ promptStore.categories.length }}</div>
            <div class="text-caption text-grey">分類數</div>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card class="liquid-glass text-center pa-4" elevation="0">
            <div class="text-h4">{{ promptStore.recentPrompts.length }}</div>
            <div class="text-caption text-grey">最近使用</div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 標籤頁 -->
    <v-tabs v-model="currentTab" class="px-4">
      <v-tab value="all">
        <v-icon start>mdi-format-list-bulleted</v-icon>
        全部
      </v-tab>
      <v-tab value="favorites">
        <v-icon start>mdi-star</v-icon>
        收藏
      </v-tab>
      <v-tab value="recent">
        <v-icon start>mdi-clock</v-icon>
        最近使用
      </v-tab>
    </v-tabs>

    <v-divider />

    <!-- 內容區域 -->
    <div class="content-area pa-4">
      <v-window v-model="currentTab">
        <!-- 全部提示詞 -->
        <v-window-item value="all">
          <div v-if="filteredPrompts.length === 0" class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-text-box-outline</v-icon>
            <div class="text-h6 mt-4 text-grey">
              {{ searchQuery ? '找不到符合的提示詞' : '還沒有提示詞，開始新增吧！' }}
            </div>
          </div>
          <v-row v-else>
            <v-col
              v-for="prompt in filteredPrompts"
              :key="prompt.id"
              cols="12"
              md="6"
              lg="4"
            >
              <PromptCard
                :prompt="prompt"
                @click="handlePreview"
                @edit="handleEdit"
                @delete="handleDelete"
                @toggle-favorite="handleToggleFavorite"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- 收藏的提示詞 -->
        <v-window-item value="favorites">
          <div v-if="promptStore.favorites.length === 0" class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-star-outline</v-icon>
            <div class="text-h6 mt-4 text-grey">還沒有收藏的提示詞</div>
          </div>
          <v-row v-else>
            <v-col
              v-for="prompt in promptStore.favorites"
              :key="prompt.id"
              cols="12"
              md="6"
              lg="4"
            >
              <PromptCard
                :prompt="prompt"
                @click="handlePreview"
                @edit="handleEdit"
                @delete="handleDelete"
                @toggle-favorite="handleToggleFavorite"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- 最近使用的提示詞 -->
        <v-window-item value="recent">
          <div v-if="promptStore.recentPrompts.length === 0" class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-clock-outline</v-icon>
            <div class="text-h6 mt-4 text-grey">還沒有使用過提示詞</div>
          </div>
          <v-row v-else>
            <v-col
              v-for="prompt in promptStore.recentPrompts"
              :key="prompt.id"
              cols="12"
              md="6"
              lg="4"
            >
              <PromptCard
                :prompt="prompt"
                @click="handlePreview"
                @edit="handleEdit"
                @delete="handleDelete"
                @toggle-favorite="handleToggleFavorite"
              />
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </div>

    <!-- 編輯對話框 -->
    <PromptEditor
      v-model="editorVisible"
      :prompt="selectedPrompt"
      @save="handleSave"
    />

    <!-- 預覽對話框 -->
    <v-dialog v-model="previewVisible" max-width="800">
      <v-card v-if="selectedPrompt" class="liquid-glass">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h5">{{ selectedPrompt.title }}</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="previewVisible = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="mb-4">
            <v-chip size="small" :color="getCategoryColor(selectedPrompt.category)">
              {{ selectedPrompt.category }}
            </v-chip>
            <v-chip
              v-for="tag in selectedPrompt.tags"
              :key="tag"
              size="small"
              variant="outlined"
              class="ml-2"
            >
              {{ tag }}
            </v-chip>
          </div>
          <div class="text-body-1" style="white-space: pre-wrap;">{{ selectedPrompt.content }}</div>
          <v-divider class="my-4" />
          <div class="d-flex justify-space-between text-caption text-grey">
            <span>使用次數: {{ selectedPrompt.usageCount }}</span>
            <span>建立時間: {{ new Date(selectedPrompt.createdAt).toLocaleString('zh-TW') }}</span>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="primary"
            prepend-icon="mdi-content-copy"
            @click="handleCopy"
          >
            複製內容
          </v-btn>
          <v-btn
            variant="text"
            @click="previewVisible = false"
          >
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除確認對話框 -->
    <v-dialog v-model="deleteConfirmVisible" max-width="500">
      <v-card class="liquid-glass">
        <v-card-title class="pa-4">確認刪除</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          確定要刪除提示詞「{{ deleteTarget?.title }}」嗎？此操作無法復原。
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteConfirmVisible = false">取消</v-btn>
          <v-btn color="error" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 載入中 -->
    <v-overlay v-model="promptStore.loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>

    <!-- 錯誤提示 -->
    <v-snackbar v-model="showError" color="error" timeout="3000">
      {{ promptStore.error }}
    </v-snackbar>

    <!-- 成功提示 -->
    <v-snackbar v-model="showSuccess" color="success" timeout="2000">
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePromptStore } from '../../stores/prompt';
import type { Prompt } from '../../../shared/types/database';
import PromptCard from './PromptCard.vue';
import PromptEditor from './PromptEditor.vue';

const promptStore = usePromptStore();

// 狀態
const searchQuery = ref('');
const selectedCategory = ref('all');
const currentTab = ref('all');
const editorVisible = ref(false);
const previewVisible = ref(false);
const deleteConfirmVisible = ref(false);
const selectedPrompt = ref<Prompt | null>(null);
const deleteTarget = ref<Prompt | null>(null);
const showError = ref(false);
const showSuccess = ref(false);
const successMessage = ref('');

// 分類篩選選項
const categoryFilterOptions = computed(() => [
  { title: '全部分類', value: 'all' },
  ...promptStore.categories.map((cat) => ({
    title: cat,
    value: cat,
  })),
]);

// 篩選後的提示詞
const filteredPrompts = computed(() => {
  let prompts = [...promptStore.prompts];

  // 按分類篩選
  if (selectedCategory.value !== 'all') {
    prompts = prompts.filter((p) => p.category === selectedCategory.value);
  }

  // 按搜尋關鍵字篩選
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    prompts = prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return prompts;
});

// 監聽錯誤狀態
watch(
  () => promptStore.error,
  (error) => {
    if (error) {
      showError.value = true;
    }
  }
);

// 載入提示詞
onMounted(async () => {
  await promptStore.loadPrompts();
});

/**
 * 處理新增
 */
const handleCreate = () => {
  selectedPrompt.value = null;
  editorVisible.value = true;
};

/**
 * 處理編輯
 */
const handleEdit = (prompt: Prompt) => {
  selectedPrompt.value = prompt;
  editorVisible.value = true;
};

/**
 * 處理儲存
 */
const handleSave = async (data: any) => {
  try {
    if (selectedPrompt.value) {
      // 更新
      await promptStore.updatePrompt(selectedPrompt.value.id, data);
      successMessage.value = '提示詞已更新';
    } else {
      // 新增
      await promptStore.savePrompt(data.title, data.content, data.category, data.tags);
      successMessage.value = '提示詞已新增';
    }
    showSuccess.value = true;
    editorVisible.value = false;
  } catch (error) {
    console.error('Save prompt failed:', error);
  }
};

/**
 * 處理刪除
 */
const handleDelete = (promptId: string) => {
  deleteTarget.value = promptStore.prompts.find((p) => p.id === promptId) || null;
  deleteConfirmVisible.value = true;
};

/**
 * 確認刪除
 */
const confirmDelete = async () => {
  if (!deleteTarget.value) return;

  try {
    await promptStore.deletePrompt(deleteTarget.value.id);
    successMessage.value = '提示詞已刪除';
    showSuccess.value = true;
    deleteConfirmVisible.value = false;
  } catch (error) {
    console.error('Delete prompt failed:', error);
  }
};

/**
 * 處理收藏切換
 */
const handleToggleFavorite = async (promptId: string) => {
  try {
    await promptStore.toggleFavorite(promptId);
  } catch (error) {
    console.error('Toggle favorite failed:', error);
  }
};

/**
 * 處理預覽
 */
const handlePreview = (prompt: Prompt) => {
  selectedPrompt.value = prompt;
  previewVisible.value = true;
};

/**
 * 處理複製
 */
const handleCopy = async () => {
  if (!selectedPrompt.value) return;

  try {
    await navigator.clipboard.writeText(selectedPrompt.value.content);
    await promptStore.incrementUsage(selectedPrompt.value.id);
    successMessage.value = '已複製到剪貼簿';
    showSuccess.value = true;
    previewVisible.value = false;
  } catch (error) {
    console.error('Copy failed:', error);
  }
};

/**
 * 取得分類顏色
 */
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    general: 'blue',
    coding: 'green',
    writing: 'purple',
    analysis: 'orange',
    creative: 'pink',
    business: 'indigo',
    education: 'teal',
    research: 'deep-purple',
  };
  return colors[category] || 'grey';
};
</script>

<style scoped lang="scss">
.prompt-library {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.stats {
  background: rgba(var(--v-theme-surface), 0.3);
}

.content-area {
  flex: 1;
  overflow-y: auto;
}

:deep(.v-tabs) {
  background: rgba(var(--v-theme-surface), 0.3);
}
</style>
