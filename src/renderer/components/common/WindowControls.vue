<template>
  <div class="window-controls">
    <v-btn icon size="small" variant="text" @click="minimizeWindow" class="control-btn">
      <v-icon size="16">mdi-minus</v-icon>
    </v-btn>
    <v-btn icon size="small" variant="text" @click="maximizeWindow" class="control-btn">
      <v-icon size="16">mdi-square-outline</v-icon>
    </v-btn>
    <v-btn icon size="small" variant="text" @click="closeWindow" class="control-btn close-btn">
      <v-icon size="16">mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const minimizeWindow = () => {
  window.electronAPI?.minimizeWindow();
};

const maximizeWindow = () => {
  window.electronAPI?.maximizeWindow();
};

const closeWindow = () => {
  window.electronAPI?.closeWindow();
};
</script>

<style lang="scss" scoped>
.window-controls {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;

  &.close-btn:hover {
    background-color: #ff5f57 !important;
    color: white !important;
  }
}
</style>
