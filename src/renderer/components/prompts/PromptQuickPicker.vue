<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="700"
    @keydown.esc="handleClose"
  >
    <v-card class="liquid-glass quick-picker">
      <v-card-title class="pa-4">
        <v-text-field
          ref="searchInputRef"
          v-model="searchQuery"
          placeholder="搜尋提示詞..."
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          @keydown.enter="handleSelect(filteredPrompts[selectedIndex])"
          @keydown.down.prevent="moveSelection(1)"
          @keydown.up.prevent="moveSelection(-1)"
        />
      </v-card-title>

      <v-divider />

      <!-- 快速標籤 -->
      <div class="px-4 py-2">
        <v-chip
          v-for="category in quickCategories"
          :key="category.value"
          size="small"
          :color="selectedQuickCategory === category.value ? 'primary' : 'default'"
          class="mr-2"
          @click="selectedQuickCategory = category.value"
        >
          <v-icon start size="small">{{ category.icon }}</v-icon>
          {{ category.title }}
        </v-chip>
      </div>

      <v-divider />

      <v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto;">
        <v-list v-if="displayPrompts.length > 0" density="compact">
          <v-list-item
            v-for="(prompt, index) in displayPrompts"
            :key="prompt.id"
            :active="index === selectedIndex"
            class="prompt-item"
            @click="handleSelect(prompt)"
            @mouseenter="selectedIndex = index"
          >
            <template #prepend>
              <v-icon :color="getCategoryColor(prompt.category)">
                {{ getCategoryIcon(prompt.category) }}
              </v-icon>
            </template>

            <v-list-item-title>{{ prompt.title }}</v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              {{ truncateContent(prompt.content) }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center gap-2">
                <v-icon v-if="prompt.isFavorite" size="small" color="yellow-darken-2">
                  mdi-star
                </v-icon>
                <v-chip size="x-small" variant="outlined">
                  {{ prompt.usageCount }}
                </v-chip>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <div v-else class="text-center pa-8">
          <v-icon size="48" color="grey">mdi-text-box-search</v-icon>
          <div class="text-body-2 mt-2 text-grey">
            {{ searchQuery ? '找不到符合的提示詞' : '還沒有提示詞' }}
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <div class="text-caption text-grey">
          <kbd>↑</kbd> <kbd>↓</kbd> 選擇 · <kbd>Enter</kbd> 確認 · <kbd>Esc</kbd> 關閉
        </div>
        <v-spacer />
        <v-btn
          variant="text"
          prepend-icon="mdi-cog"
          size="small"
          @click="handleOpenLibrary"
        >
          管理提示詞
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { usePromptStore } from '../../stores/prompt';
import type { Prompt } from '../../../shared/types/database';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  select: [prompt: Prompt];
  openLibrary: [];
}>();

const promptStore = usePromptStore();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const searchQuery = ref('');
const selectedIndex = ref(0);
const selectedQuickCategory = ref<string>('all');
const searchInputRef = ref<any>(null);

// 快速分類
const quickCategories = [
  { title: '全部', value: 'all', icon: 'mdi-format-list-bulleted' },
  { title: '收藏', value: 'favorites', icon: 'mdi-star' },
  { title: '最近', value: 'recent', icon: 'mdi-clock' },
  { title: '程式', value: 'coding', icon: 'mdi-code-tags' },
  { title: '寫作', value: 'writing', icon: 'mdi-pencil' },
];

// 篩選後的提示詞
const filteredPrompts = computed(() => {
  let prompts: Prompt[] = [];

  // 根據快速分類選擇
  if (selectedQuickCategory.value === 'favorites') {
    prompts = [...promptStore.favorites];
  } else if (selectedQuickCategory.value === 'recent') {
    prompts = [...promptStore.recentPrompts];
  } else if (selectedQuickCategory.value === 'all') {
    prompts = [...promptStore.prompts];
  } else {
    // 其他分類
    prompts = promptStore.prompts.filter((p) => p.category === selectedQuickCategory.value);
  }

  // 搜尋篩選
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

// 顯示的提示詞（最多20個）
const displayPrompts = computed(() => {
  return filteredPrompts.value.slice(0, 20);
});

// 監聽對話框開啟，重置狀態並聚焦搜尋框
watch(dialogVisible, async (visible) => {
  if (visible) {
    searchQuery.value = '';
    selectedIndex.value = 0;
    selectedQuickCategory.value = 'all';
    await promptStore.loadPrompts();
    await nextTick();
    searchInputRef.value?.focus();
  }
});

// 監聽篩選結果變化，重置選中索引
watch(displayPrompts, () => {
  selectedIndex.value = 0;
});

/**
 * 移動選擇
 */
const moveSelection = (direction: number) => {
  const newIndex = selectedIndex.value + direction;
  if (newIndex >= 0 && newIndex < displayPrompts.value.length) {
    selectedIndex.value = newIndex;
  }
};

/**
 * 處理選擇
 */
const handleSelect = async (prompt: Prompt) => {
  if (!prompt) return;

  emit('select', prompt);
  await promptStore.incrementUsage(prompt.id);
  dialogVisible.value = false;
};

/**
 * 處理關閉
 */
const handleClose = () => {
  dialogVisible.value = false;
};

/**
 * 開啟提示詞庫
 */
const handleOpenLibrary = () => {
  dialogVisible.value = false;
  emit('openLibrary');
};

/**
 * 截斷內容
 */
const truncateContent = (content: string): string => {
  const maxLength = 80;
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
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

/**
 * 取得分類圖示
 */
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    general: 'mdi-text',
    coding: 'mdi-code-tags',
    writing: 'mdi-pencil',
    analysis: 'mdi-chart-line',
    creative: 'mdi-palette',
    business: 'mdi-briefcase',
    education: 'mdi-school',
    research: 'mdi-flask',
  };
  return icons[category] || 'mdi-text';
};
</script>

<style scoped lang="scss">
.quick-picker {
  background: rgba(var(--v-theme-surface), 0.98);
}

.prompt-item {
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.1);
  }

  &.v-list-item--active {
    background: rgba(var(--v-theme-primary), 0.15);
  }
}

kbd {
  padding: 2px 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 4px;
  background: rgba(var(--v-theme-surface), 0.5);
  font-family: monospace;
  font-size: 0.85em;
}
</style>
