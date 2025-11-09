<template>
  <div class="hotkey-input">
    <v-text-field
      :model-value="displayValue"
      :label="label"
      :placeholder="placeholder"
      :error-messages="errorMessage"
      :hint="hint"
      :persistent-hint="!!hint"
      variant="outlined"
      readonly
      @focus="startRecording"
      @blur="stopRecording"
    >
      <template v-slot:append>
        <v-btn
          v-if="modelValue"
          icon="mdi-close"
          size="small"
          variant="text"
          @click.stop="clear"
        />
        <v-btn
          icon="mdi-keyboard"
          size="small"
          variant="text"
          @click.stop="startRecording"
        />
      </template>
    </v-text-field>

    <!-- 錄製提示 -->
    <v-fade-transition>
      <v-alert v-if="isRecording" type="info" variant="tonal" class="mt-2" density="compact">
        <v-icon start>mdi-record-circle-outline</v-icon>
        按下您想要設定的熱鍵組合... (按 ESC 取消)
      </v-alert>
    </v-fade-transition>

    <!-- 衝突警告 -->
    <v-fade-transition>
      <v-alert v-if="conflictWarning" type="warning" variant="tonal" class="mt-2" density="compact">
        <v-icon start>mdi-alert</v-icon>
        {{ conflictWarning }}
      </v-alert>
    </v-fade-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Props
interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  excludeId?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '熱鍵',
  placeholder: '點擊輸入框並按下熱鍵組合',
  hint: '',
  disabled: false,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
}>();

// State
const isRecording = ref(false);
const pressedKeys = ref<Set<string>>(new Set());
const errorMessage = ref('');
const conflictWarning = ref('');

// Computed
const displayValue = computed(() => {
  if (!props.modelValue) return '';
  return formatAccelerator(props.modelValue);
});

/**
 * 格式化加速器為可讀格式
 */
function formatAccelerator(accelerator: string): string {
  if (!accelerator) return '';

  return accelerator
    .split('+')
    .map((key) => {
      // 替換 Electron 的按鍵名稱為更友善的顯示
      const keyMap: Record<string, string> = {
        CommandOrControl: process.platform === 'darwin' ? '⌘' : 'Ctrl',
        Command: '⌘',
        Cmd: '⌘',
        Control: 'Ctrl',
        Ctrl: 'Ctrl',
        Alt: 'Alt',
        Option: '⌥',
        Shift: 'Shift',
        Super: process.platform === 'darwin' ? '⌘' : 'Win',
      };

      return keyMap[key] || key.toUpperCase();
    })
    .join(' + ');
}

/**
 * 開始錄製熱鍵
 */
function startRecording() {
  if (props.disabled) return;

  isRecording.value = true;
  pressedKeys.value.clear();
  errorMessage.value = '';
  conflictWarning.value = '';

  // 添加鍵盤事件監聽器
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

/**
 * 停止錄製熱鍵
 */
function stopRecording() {
  if (!isRecording.value) return;

  isRecording.value = false;
  pressedKeys.value.clear();

  // 移除事件監聽器
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
}

/**
 * 處理按鍵按下
 */
function handleKeyDown(event: KeyboardEvent) {
  if (!isRecording.value) return;

  event.preventDefault();
  event.stopPropagation();

  // ESC 取消錄製
  if (event.key === 'Escape') {
    stopRecording();
    return;
  }

  // 添加按下的鍵
  const key = normalizeKey(event);
  if (key) {
    pressedKeys.value.add(key);
  }

  // 如果有修飾鍵 + 普通鍵，則完成錄製
  const hasModifier = Array.from(pressedKeys.value).some((k) =>
    ['CommandOrControl', 'Control', 'Alt', 'Shift', 'Super'].includes(k)
  );
  const hasNormalKey = Array.from(pressedKeys.value).some(
    (k) => !['CommandOrControl', 'Control', 'Alt', 'Shift', 'Super'].includes(k)
  );

  if (hasModifier && hasNormalKey) {
    const accelerator = buildAccelerator();
    if (accelerator) {
      validateAndEmit(accelerator);
    }
    stopRecording();
  }
}

/**
 * 處理按鍵釋放
 */
function handleKeyUp(event: KeyboardEvent) {
  if (!isRecording.value) return;

  event.preventDefault();
  event.stopPropagation();
}

/**
 * 標準化按鍵名稱
 */
function normalizeKey(event: KeyboardEvent): string {
  // 修飾鍵
  if (event.metaKey || event.key === 'Meta') {
    return process.platform === 'darwin' ? 'Command' : 'Super';
  }
  if (event.ctrlKey || event.key === 'Control') {
    return 'CommandOrControl';
  }
  if (event.altKey || event.key === 'Alt') {
    return 'Alt';
  }
  if (event.shiftKey || event.key === 'Shift') {
    return 'Shift';
  }

  // 普通鍵
  const key = event.key;

  // 功能鍵
  if (key.startsWith('F') && key.length <= 3) {
    const num = parseInt(key.substring(1));
    if (!isNaN(num) && num >= 1 && num <= 24) {
      return key;
    }
  }

  // 特殊鍵
  const specialKeys: Record<string, string> = {
    ' ': 'Space',
    Enter: 'Enter',
    Tab: 'Tab',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Escape: 'Escape',
  };

  if (specialKeys[key]) {
    return specialKeys[key];
  }

  // 字母和數字
  if (/^[a-zA-Z0-9]$/.test(key)) {
    return key.toUpperCase();
  }

  return '';
}

/**
 * 建構加速器字串
 */
function buildAccelerator(): string {
  const keys = Array.from(pressedKeys.value);

  // 按照固定順序排列修飾鍵
  const modifierOrder = ['CommandOrControl', 'Control', 'Alt', 'Shift', 'Super'];
  const modifiers = keys.filter((k) => modifierOrder.includes(k)).sort((a, b) => {
    return modifierOrder.indexOf(a) - modifierOrder.indexOf(b);
  });

  const normalKeys = keys.filter((k) => !modifierOrder.includes(k));

  if (normalKeys.length === 0) {
    return '';
  }

  return [...modifiers, ...normalKeys].join('+');
}

/**
 * 驗證並發送
 */
async function validateAndEmit(accelerator: string) {
  try {
    // 檢查衝突
    const hasConflict = await window.electronAPI.checkHotkeyConflict(
      accelerator,
      props.excludeId
    );

    if (hasConflict) {
      conflictWarning.value = `此熱鍵已被其他功能使用`;
      errorMessage.value = '熱鍵衝突';
      return;
    }

    // 清除錯誤
    errorMessage.value = '';
    conflictWarning.value = '';

    // 發送新值
    emit('update:modelValue', accelerator);
    emit('change', accelerator);
  } catch (error) {
    console.error('Failed to validate hotkey:', error);
    errorMessage.value = '驗證失敗';
  }
}

/**
 * 清除熱鍵
 */
function clear() {
  emit('update:modelValue', '');
  emit('change', '');
  errorMessage.value = '';
  conflictWarning.value = '';
}

// Watch modelValue 變化以清除錯誤
watch(
  () => props.modelValue,
  () => {
    if (props.modelValue) {
      errorMessage.value = '';
    }
  }
);
</script>

<style scoped lang="scss">
.hotkey-input {
  width: 100%;

  :deep(.v-field--focused) {
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.3);
  }

  :deep(.v-field__input) {
    cursor: pointer;
    user-select: none;
  }
}
</style>
