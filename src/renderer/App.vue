<template>
  <v-app>
    <router-view />
    <ErrorNotificationContainer />
  </v-app>
</template>

<script setup lang="ts">
import ErrorNotificationContainer from './components/common/ErrorNotificationContainer.vue';

// 設定全域錯誤處理
import { onErrorCaptured } from 'vue';
import { useErrorStore } from './stores/error';

const errorStore = useErrorStore();

// 捕獲 Vue 組件錯誤
onErrorCaptured((error, instance, info) => {
  console.error('Vue error captured:', error, info);
  errorStore.handleError(error, `組件錯誤: ${info}`);
  return false; // 阻止錯誤繼續傳播
});

// 捕獲全域未處理的錯誤
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  errorStore.handleError(event.error, '全域錯誤');
});

// 捕獲未處理的 Promise rejection
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  errorStore.handleError(error, '未處理的 Promise 錯誤');
});
</script>

<style lang="scss">
// 全域樣式將在 styles/main.scss 中定義
</style>
