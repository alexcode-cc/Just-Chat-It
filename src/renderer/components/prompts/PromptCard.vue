<template>
  <v-card
    class="prompt-card liquid-glass"
    :class="{ 'favorite': prompt.isFavorite }"
    elevation="0"
    @click="$emit('click', prompt)"
  >
    <v-card-title class="d-flex justify-space-between align-start pa-4">
      <div class="flex-grow-1">
        <div class="text-h6">{{ prompt.title }}</div>
        <v-chip
          size="x-small"
          class="mt-2"
          :color="getCategoryColor(prompt.category)"
        >
          {{ prompt.category }}
        </v-chip>
      </div>

      <div class="d-flex gap-2">
        <v-btn
          icon="mdi-star"
          size="small"
          variant="text"
          :color="prompt.isFavorite ? 'yellow-darken-2' : 'grey'"
          @click.stop="$emit('toggleFavorite', prompt.id)"
        />
        <v-btn
          icon="mdi-pencil"
          size="small"
          variant="text"
          @click.stop="$emit('edit', prompt)"
        />
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click.stop="$emit('delete', prompt.id)"
        />
      </div>
    </v-card-title>

    <v-card-text class="pa-4 pt-0">
      <div class="prompt-content text-body-2">
        {{ truncateContent(prompt.content) }}
      </div>

      <div v-if="prompt.tags && prompt.tags.length > 0" class="mt-3 d-flex flex-wrap gap-2">
        <v-chip
          v-for="tag in prompt.tags"
          :key="tag"
          size="x-small"
          variant="outlined"
        >
          {{ tag }}
        </v-chip>
      </div>

      <v-divider class="my-3" />

      <div class="d-flex justify-space-between align-center text-caption text-grey">
        <div class="d-flex align-center gap-1">
          <v-icon size="small">mdi-eye</v-icon>
          <span>使用 {{ prompt.usageCount }} 次</span>
        </div>
        <div>
          {{ formatDate(prompt.createdAt) }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { type Prompt } from '../../../shared/types/database';

interface Props {
  prompt: Prompt;
  maxContentLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxContentLength: 150,
});

defineEmits<{
  click: [prompt: Prompt];
  edit: [prompt: Prompt];
  delete: [promptId: string];
  toggleFavorite: [promptId: string];
}>();

/**
 * 截斷內容
 */
const truncateContent = (content: string): string => {
  if (content.length <= props.maxContentLength) {
    return content;
  }
  return content.substring(0, props.maxContentLength) + '...';
};

/**
 * 格式化日期
 */
const formatDate = (date: Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} 週前`;
  } else {
    return d.toLocaleDateString('zh-TW');
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
.prompt-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--v-theme-primary), 0.3);
  }

  &.favorite {
    border-color: rgba(255, 193, 7, 0.3);
  }
}

.prompt-content {
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.7);
  min-height: 60px;
}
</style>
