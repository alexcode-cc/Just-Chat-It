<template>
  <div class="ai-webview-container">
    <!-- 載入狀態覆蓋層 -->
    <v-overlay :model-value="isLoading" class="align-center justify-center" contained>
      <div class="text-center">
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
        <p class="mt-4 text-h6">載入中...</p>
        <p v-if="loadProgress > 0" class="text-caption">{{ Math.round(loadProgress * 100) }}%</p>
      </div>
    </v-overlay>

    <!-- 錯誤狀態 -->
    <v-alert v-if="hasError" type="error" class="ma-4" closable @click:close="hasError = false">
      <v-alert-title>載入失敗</v-alert-title>
      <div>{{ errorMessage }}</div>
      <template #append>
        <v-btn variant="outlined" size="small" @click="reload">重試</v-btn>
      </template>
    </v-alert>

    <!-- 導航工具列 -->
    <div v-if="showNavigation" class="navigation-bar liquid-glass">
      <v-btn
        icon
        size="small"
        :disabled="!canGoBack"
        @click="goBack"
        title="後退"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn
        icon
        size="small"
        :disabled="!canGoForward"
        @click="goForward"
        title="前進"
      >
        <v-icon>mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn
        icon
        size="small"
        @click="reload"
        title="重新載入"
      >
        <v-icon>mdi-reload</v-icon>
      </v-btn>
      <v-text-field
        v-model="currentUrl"
        readonly
        density="compact"
        variant="solo"
        hide-details
        class="flex-grow-1 mx-2"
        prepend-inner-icon="mdi-link"
      ></v-text-field>
      <v-btn
        icon
        size="small"
        @click="openInBrowser"
        title="在瀏覽器中開啟"
      >
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </div>

    <!-- WebView 容器 -->
    <div ref="webviewContainer" class="webview-wrapper">
      <!--
        Electron webview 標籤
        注意：需要在 BrowserWindow 中啟用 webviewTag: true
      -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

interface Props {
  url: string;
  serviceId: string;
  sessionId?: string;
  showNavigation?: boolean;
  enableContentCapture?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showNavigation: false,
  enableContentCapture: true,
});

const emit = defineEmits<{
  'load-start': [];
  'load-finish': [url: string];
  'load-error': [error: string];
  'navigation': [url: string];
  'content-change': [content: string];
  'new-window': [url: string];
}>();

// 狀態
const webviewContainer = ref<HTMLElement | null>(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const loadProgress = ref(0);
const currentUrl = ref(props.url);
const canGoBack = ref(false);
const canGoForward = ref(false);

let webviewElement: Electron.WebviewTag | null = null;
let contentCaptureInterval: NodeJS.Timeout | null = null;

/**
 * 建立並配置 webview 元素
 */
const createWebview = () => {
  if (!webviewContainer.value) return;

  // 建立 webview 元素
  webviewElement = document.createElement('webview') as Electron.WebviewTag;
  webviewElement.src = props.url;
  webviewElement.style.width = '100%';
  webviewElement.style.height = '100%';

  // Webview 屬性
  webviewElement.setAttribute('allowpopups', 'true');
  webviewElement.setAttribute('partition', `persist:${props.serviceId}`);

  // 事件監聽器
  setupWebviewListeners();

  // 加入容器
  webviewContainer.value.appendChild(webviewElement);
};

/**
 * 設定 webview 事件監聽器
 */
const setupWebviewListeners = () => {
  if (!webviewElement) return;

  // 開始載入
  webviewElement.addEventListener('did-start-loading', () => {
    isLoading.value = true;
    hasError.value = false;
    loadProgress.value = 0;
    emit('load-start');
  });

  // 載入完成
  webviewElement.addEventListener('did-finish-load', () => {
    isLoading.value = false;
    loadProgress.value = 1;
    currentUrl.value = webviewElement!.getURL();
    updateNavigationState();
    emit('load-finish', currentUrl.value);

    // 開始內容監控
    if (props.enableContentCapture) {
      startContentCapture();
    }
  });

  // 載入失敗
  webviewElement.addEventListener('did-fail-load', (event: any) => {
    if (event.errorCode === -3) {
      // ERR_ABORTED，通常是用戶取消，忽略
      return;
    }

    isLoading.value = false;
    hasError.value = true;
    errorMessage.value = `錯誤代碼: ${event.errorCode} - ${event.errorDescription}`;
    emit('load-error', errorMessage.value);
  });

  // 導航
  webviewElement.addEventListener('did-navigate', (event: any) => {
    currentUrl.value = event.url;
    updateNavigationState();
    emit('navigation', event.url);
  });

  webviewElement.addEventListener('did-navigate-in-page', (event: any) => {
    currentUrl.value = event.url;
    updateNavigationState();
    emit('navigation', event.url);
  });

  // 新視窗請求
  webviewElement.addEventListener('new-window', (event: any) => {
    emit('new-window', event.url);
    // 可以選擇在預設瀏覽器中開啟
    // window.electronAPI.openExternal(event.url);
  });

  // 載入進度（如果支援）
  // @ts-ignore
  if (webviewElement.addEventListener) {
    // @ts-ignore
    webviewElement.addEventListener('did-get-response-details', (event: any) => {
      // 更新載入進度
    });
  }

  // 控制台訊息（用於除錯）
  webviewElement.addEventListener('console-message', (event: any) => {
    console.log('[WebView Console]', event.message);
  });
};

/**
 * 更新導航狀態
 */
const updateNavigationState = () => {
  if (!webviewElement) return;
  canGoBack.value = webviewElement.canGoBack();
  canGoForward.value = webviewElement.canGoForward();
};

/**
 * 導航控制
 */
const goBack = () => {
  if (webviewElement && canGoBack.value) {
    webviewElement.goBack();
  }
};

const goForward = () => {
  if (webviewElement && canGoForward.value) {
    webviewElement.goForward();
  }
};

const reload = () => {
  if (webviewElement) {
    hasError.value = false;
    errorMessage.value = '';
    webviewElement.reload();
  }
};

const openInBrowser = () => {
  if (currentUrl.value) {
    window.open(currentUrl.value, '_blank');
  }
};

/**
 * 開始內容監控（用於聊天記錄儲存）
 */
const startContentCapture = () => {
  if (contentCaptureInterval) {
    clearInterval(contentCaptureInterval);
  }

  // 每 5 秒檢查一次內容變化
  contentCaptureInterval = setInterval(async () => {
    if (!webviewElement) return;

    try {
      // 執行 JavaScript 擷取頁面內容
      const content = await webviewElement.executeJavaScript(`
        // 這裡需要根據不同 AI 服務的 DOM 結構調整
        // 以下是通用的文字擷取範例
        document.body.innerText;
      `);

      if (content) {
        emit('content-change', content);
      }
    } catch (error) {
      console.error('Failed to capture content:', error);
    }
  }, 5000);
};

/**
 * 停止內容監控
 */
const stopContentCapture = () => {
  if (contentCaptureInterval) {
    clearInterval(contentCaptureInterval);
    contentCaptureInterval = null;
  }
};

/**
 * 執行自訂 JavaScript
 */
const executeJavaScript = async (code: string) => {
  if (!webviewElement) return null;
  return await webviewElement.executeJavaScript(code);
};

/**
 * 插入 CSS
 */
const insertCSS = async (css: string) => {
  if (!webviewElement) return;
  await webviewElement.insertCSS(css);
};

// 暴露方法給父組件
defineExpose({
  goBack,
  goForward,
  reload,
  executeJavaScript,
  insertCSS,
  getWebview: () => webviewElement,
});

// 監聽 URL 變化
watch(() => props.url, (newUrl) => {
  if (webviewElement && newUrl !== currentUrl.value) {
    webviewElement.src = newUrl;
    currentUrl.value = newUrl;
  }
});

// 生命週期
onMounted(async () => {
  await nextTick();
  createWebview();
});

onUnmounted(() => {
  stopContentCapture();

  if (webviewElement && webviewContainer.value) {
    webviewContainer.value.removeChild(webviewElement);
    webviewElement = null;
  }
});
</script>

<style scoped lang="scss">
.ai-webview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--v-theme-background);
}

.navigation-bar {
  display: flex;
  align-items: center;
  padding: 8px;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.webview-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

// Liquid Glass 樣式整合
.liquid-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
}

// 深色主題適配
:global(body.dark-theme) {
  .navigation-bar {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }
}
</style>
