<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="800"
    persistent
    @keydown.esc="handleCancel"
  >
    <v-card class="liquid-glass">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <span class="text-h5">{{ isEditMode ? '編輯提示詞' : '新增提示詞' }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="handleCancel"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSave">
          <v-text-field
            v-model="formData.title"
            label="標題"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            prepend-inner-icon="mdi-format-title"
            counter
            maxlength="100"
          />

          <v-textarea
            v-model="formData.content"
            label="提示詞內容"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            prepend-inner-icon="mdi-text"
            rows="8"
            counter
            auto-grow
          />

          <v-select
            v-model="formData.category"
            :items="categoryOptions"
            label="分類"
            variant="outlined"
            class="mb-4"
            prepend-inner-icon="mdi-folder"
          />

          <v-combobox
            v-model="formData.tags"
            label="標籤"
            variant="outlined"
            chips
            multiple
            closable-chips
            prepend-inner-icon="mdi-tag-multiple"
            hint="按 Enter 新增標籤"
            persistent-hint
          />
        </v-form>

        <v-alert
          v-if="error"
          type="error"
          class="mt-4"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          :disabled="!formValid"
          @click="handleSave"
        >
          {{ isEditMode ? '儲存' : '新增' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Prompt } from '../../../shared/types/database';

interface Props {
  modelValue: boolean;
  prompt?: Prompt | null;
}

interface FormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const props = withDefaults(defineProps<Props>(), {
  prompt: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [data: FormData];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const formRef = ref<any>(null);
const formValid = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

const formData = ref<FormData>({
  title: '',
  content: '',
  category: 'general',
  tags: [],
});

const isEditMode = computed(() => props.prompt !== null);

const categoryOptions = [
  { title: '一般', value: 'general' },
  { title: '程式開發', value: 'coding' },
  { title: '寫作', value: 'writing' },
  { title: '分析', value: 'analysis' },
  { title: '創意', value: 'creative' },
  { title: '商業', value: 'business' },
  { title: '教育', value: 'education' },
  { title: '研究', value: 'research' },
];

const rules = {
  required: (value: string) => !!value || '此欄位為必填',
};

// 監聽 prompt 變化，更新表單資料
watch(
  () => props.prompt,
  (newPrompt) => {
    if (newPrompt) {
      formData.value = {
        title: newPrompt.title,
        content: newPrompt.content,
        category: newPrompt.category,
        tags: [...(newPrompt.tags || [])],
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

/**
 * 重置表單
 */
const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    category: 'general',
    tags: [],
  };
  error.value = null;
  if (formRef.value) {
    formRef.value.resetValidation();
  }
};

/**
 * 處理儲存
 */
const handleSave = async () => {
  if (!formRef.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  error.value = null;

  try {
    emit('save', { ...formData.value });
    dialogVisible.value = false;
    resetForm();
  } catch (err) {
    error.value = `儲存失敗: ${err}`;
  } finally {
    saving.value = false;
  }
};

/**
 * 處理取消
 */
const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};
</script>

<style scoped lang="scss">
.v-card {
  background: rgba(var(--v-theme-surface), 0.95);
}

:deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.6);
}
</style>
