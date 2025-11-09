<template>
  <v-snackbar
    v-model="show"
    :color="color"
    :timeout="-1"
    location="top right"
    class="error-notification"
  >
    <div class="notification-content">
      <div class="notification-header">
        <v-icon :icon="icon" size="small" class="mr-2" />
        <span class="notification-message">{{ notification.message }}</span>
      </div>

      <div v-if="notification.details && showDetails" class="notification-details mt-2">
        <pre>{{ notification.details }}</pre>
      </div>

      <div v-if="notification.details" class="notification-actions mt-2">
        <v-btn
          variant="text"
          size="small"
          @click="showDetails = !showDetails"
        >
          {{ showDetails ? '隱藏詳情' : '顯示詳情' }}
        </v-btn>
      </div>
    </div>

    <template #actions>
      <v-btn
        variant="text"
        icon="mdi-close"
        size="small"
        @click="close"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ErrorNotification } from '../../stores/error';

const props = defineProps<{
  notification: ErrorNotification;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'close': [];
}>();

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const showDetails = ref(false);

const color = computed(() => {
  switch (props.notification.type) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
});

const icon = computed(() => {
  switch (props.notification.type) {
    case 'error':
      return 'mdi-alert-circle';
    case 'warning':
      return 'mdi-alert';
    case 'info':
      return 'mdi-information';
    default:
      return 'mdi-information';
  }
});

function close() {
  show.value = false;
  emit('close');
}

// 監聽 show 變化
watch(show, (newVal) => {
  if (!newVal) {
    showDetails.value = false;
  }
});
</script>

<style scoped lang="scss">
.error-notification {
  :deep(.v-snackbar__wrapper) {
    min-width: 350px;
    max-width: 600px;
  }

  .notification-content {
    width: 100%;

    .notification-header {
      display: flex;
      align-items: center;
      font-weight: 500;
    }

    .notification-message {
      flex: 1;
      word-break: break-word;
    }

    .notification-details {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      padding: 8px;
      max-height: 200px;
      overflow-y: auto;

      pre {
        margin: 0;
        font-size: 0.75rem;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }

    .notification-actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
