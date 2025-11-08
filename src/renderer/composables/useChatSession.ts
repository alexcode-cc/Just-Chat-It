/**
 * 聊天會話管理 Composable
 * 提供會話建立、管理和訊息儲存功能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../stores/chat';
import { useAIStore } from '../stores/ai';
import type { ChatSession, ChatMessage } from '../../shared/types/database';

export function useChatSession(serviceId: string) {
  const chatStore = useChatStore();
  const aiStore = useAIStore();

  // 狀態
  const currentSession = ref<ChatSession | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const isLoadingSession = ref(false);
  const isLoadingMessages = ref(false);
  const autoSaveInterval = ref<NodeJS.Timeout | null>(null);

  // 計算屬性
  const service = computed(() => aiStore.getServiceById(serviceId));
  const sessionId = computed(() => currentSession.value?.id);
  const messageCount = computed(() => messages.value.length);
  const hasMessages = computed(() => messageCount.value > 0);

  /**
   * 初始化會話
   * 如果存在活躍的會話則恢復，否則建立新會話
   */
  const initializeSession = async () => {
    isLoadingSession.value = true;

    try {
      // 檢查是否有活躍的會話
      const sessions = chatStore.getSessionsByService(serviceId);
      const activeSession = sessions.find((s) => s.isActive);

      if (activeSession) {
        // 恢復現有會話
        currentSession.value = activeSession;
        await loadMessages(activeSession.id);
      } else {
        // 建立新會話
        await createNewSession();
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    } finally {
      isLoadingSession.value = false;
    }
  };

  /**
   * 建立新會話
   */
  const createNewSession = async (title?: string) => {
    if (!service.value) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const session = await chatStore.createSession({
      aiServiceId: serviceId,
      title: title || `${service.value.name} 對話 - ${new Date().toLocaleString()}`,
      isActive: true,
    });

    currentSession.value = session;
    messages.value = [];

    return session;
  };

  /**
   * 載入會話的訊息歷史
   */
  const loadMessages = async (sessionId: string) => {
    isLoadingMessages.value = true;

    try {
      const loadedMessages = await chatStore.loadSessionHistory(sessionId);
      messages.value = loadedMessages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error;
    } finally {
      isLoadingMessages.value = false;
    }
  };

  /**
   * 儲存訊息
   */
  const saveMessage = async (
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ) => {
    if (!currentSession.value) {
      await createNewSession();
    }

    const message = await chatStore.saveMessage({
      sessionId: currentSession.value!.id,
      role,
      content,
      metadata,
    });

    messages.value.push(message);

    return message;
  };

  /**
   * 批次儲存訊息
   */
  const saveMessages = async (
    messagesData: Array<{
      role: 'user' | 'assistant';
      content: string;
      metadata?: Record<string, any>;
    }>
  ) => {
    if (!currentSession.value) {
      await createNewSession();
    }

    const savedMessages: ChatMessage[] = [];

    for (const msgData of messagesData) {
      const message = await chatStore.saveMessage({
        sessionId: currentSession.value!.id,
        ...msgData,
      });
      savedMessages.push(message);
    }

    messages.value.push(...savedMessages);

    return savedMessages;
  };

  /**
   * 更新會話標題
   */
  const updateSessionTitle = async (title: string) => {
    if (!currentSession.value) return;

    // 透過 Store 更新
    const sessions = chatStore.sessions.map((s) =>
      s.id === currentSession.value!.id ? { ...s, title } : s
    );

    chatStore.sessions = sessions;
    currentSession.value.title = title;

    // 儲存到資料庫
    await window.electronAPI.saveData('chat_sessions', {
      id: currentSession.value.id,
      title,
    });
  };

  /**
   * 結束會話
   */
  const endSession = async () => {
    if (!currentSession.value) return;

    currentSession.value.isActive = false;

    // 儲存到資料庫
    await window.electronAPI.saveData('chat_sessions', {
      id: currentSession.value.id,
      isActive: false,
    });

    // 停止自動儲存
    stopAutoSave();
  };

  /**
   * 切換到另一個會話
   */
  const switchSession = async (sessionId: string) => {
    // 結束當前會話
    if (currentSession.value) {
      await endSession();
    }

    // 載入新會話
    const session = chatStore.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    currentSession.value = session;
    await loadMessages(sessionId);

    // 標記為活躍
    currentSession.value.isActive = true;
    await window.electronAPI.saveData('chat_sessions', {
      id: sessionId,
      isActive: true,
    });
  };

  /**
   * 刪除會話
   */
  const deleteSession = async (sessionId?: string) => {
    const targetId = sessionId || currentSession.value?.id;
    if (!targetId) return;

    // 從 Store 移除
    chatStore.sessions = chatStore.sessions.filter((s) => s.id !== targetId);

    // 從資料庫刪除
    await window.electronAPI.saveData('chat_sessions', {
      id: targetId,
      _action: 'delete',
    });

    // 如果是當前會話，建立新會話
    if (targetId === currentSession.value?.id) {
      await createNewSession();
    }
  };

  /**
   * 開始自動儲存
   * 定期儲存會話資訊（例如最後訊息時間）
   */
  const startAutoSave = (interval: number = 30000) => {
    if (autoSaveInterval.value) {
      clearInterval(autoSaveInterval.value);
    }

    autoSaveInterval.value = setInterval(async () => {
      if (currentSession.value && hasMessages.value) {
        await window.electronAPI.saveData('chat_sessions', {
          id: currentSession.value.id,
          lastMessageAt: new Date(),
        });
      }
    }, interval);
  };

  /**
   * 停止自動儲存
   */
  const stopAutoSave = () => {
    if (autoSaveInterval.value) {
      clearInterval(autoSaveInterval.value);
      autoSaveInterval.value = null;
    }
  };

  /**
   * 搜尋訊息
   */
  const searchMessages = async (query: string) => {
    if (!currentSession.value) return [];

    return await chatStore.searchMessages(query, serviceId);
  };

  /**
   * 取得會話統計
   */
  const getSessionStats = () => {
    if (!currentSession.value) return null;

    const userMessages = messages.value.filter((m) => m.role === 'user').length;
    const assistantMessages = messages.value.filter((m) => m.role === 'assistant').length;
    const totalCharacters = messages.value.reduce((sum, m) => sum + m.content.length, 0);

    return {
      totalMessages: messages.value.length,
      userMessages,
      assistantMessages,
      totalCharacters,
      createdAt: currentSession.value.createdAt,
      lastMessageAt: currentSession.value.lastMessageAt,
    };
  };

  // 生命週期
  onMounted(async () => {
    await initializeSession();
    startAutoSave();
  });

  onUnmounted(() => {
    stopAutoSave();
    if (currentSession.value) {
      endSession();
    }
  });

  return {
    // 狀態
    currentSession,
    messages,
    isLoadingSession,
    isLoadingMessages,
    service,
    sessionId,
    messageCount,
    hasMessages,

    // 方法
    initializeSession,
    createNewSession,
    loadMessages,
    saveMessage,
    saveMessages,
    updateSessionTitle,
    endSession,
    switchSession,
    deleteSession,
    searchMessages,
    getSessionStats,
    startAutoSave,
    stopAutoSave,
  };
}
