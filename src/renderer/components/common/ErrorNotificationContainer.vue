<template>
  <div class="error-notification-container">
    <ErrorNotification
      v-for="notification in errorStore.notifications"
      :key="notification.id"
      :notification="notification"
      :model-value="true"
      @close="errorStore.removeNotification(notification.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { useErrorStore } from '../../stores/error';
import ErrorNotification from './ErrorNotification.vue';

const errorStore = useErrorStore();
</script>

<style scoped lang="scss">
.error-notification-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  pointer-events: none;

  > * {
    pointer-events: all;
  }
}
</style>
