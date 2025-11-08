<template>
  <v-container fluid class="liquid-glass-bg pa-0">
    <div class="window-title-bar">
      <span class="app-title">Just Chat It</span>
      <window-controls />
    </div>

    <v-main class="pa-4">
      <h1 class="text-h4 mb-4">多 AI 聊天桌面</h1>
      <p class="mb-4">基礎架構已建立，準備進行後續功能開發</p>

      <v-card class="liquid-glass mb-4">
        <v-card-title>專案架構完成</v-card-title>
        <v-card-text>
          <ul>
            <li>✅ Electron 主程序架構</li>
            <li>✅ Vue 3 + Vuetify 渲染程序</li>
            <li>✅ TypeScript 配置</li>
            <li>✅ 視窗管理系統</li>
            <li>✅ IPC 通訊機制</li>
            <li>✅ Liquid Glass 視覺效果基礎</li>
          </ul>
        </v-card-text>
      </v-card>

      <v-card class="liquid-glass">
        <v-card-title>後續開發計劃</v-card-title>
        <v-card-text>
          <p>Task 2: 實作核心資料層</p>
          <p>Task 3: 實作 Liquid Glass 視覺系統</p>
          <p>Task 4: 建立多視窗管理系統</p>
        </v-card-text>
      </v-card>
    </v-main>
  </v-container>
</template>

<script setup lang="ts">
import WindowControls from '@/components/common/WindowControls.vue';
</script>

<style lang="scss" scoped>
.liquid-glass-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
}

.window-title-bar {
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  -webkit-app-region: drag;
}

.app-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
}
</style>
