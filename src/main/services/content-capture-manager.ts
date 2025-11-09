/**
 * 內容擷取管理器
 * 管理 WebView 內容監控和解析
 */

import { BrowserWindow } from 'electron';
import { ChatMessageRepository, ChatSessionRepository } from '../database/repositories/chat-repository';
import type { ChatMessage } from '../../shared/types/database';

/**
 * 擷取的訊息介面
 */
export interface CapturedMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    aiService?: string;
    messageId?: string;
    html?: string;
  };
}

/**
 * AI 服務內容選擇器配置
 */
const AI_SERVICE_SELECTORS: Record<
  string,
  {
    messageContainer: string;
    messageSelector: string;
    userMessageClass?: string;
    assistantMessageClass?: string;
    contentSelector?: string;
  }
> = {
  chatgpt: {
    messageContainer: '[role="presentation"]',
    messageSelector: '[data-message-author-role]',
    userMessageClass: '[data-message-author-role="user"]',
    assistantMessageClass: '[data-message-author-role="assistant"]',
    contentSelector: '.markdown',
  },
  claude: {
    messageContainer: '.conversation',
    messageSelector: '[data-is-streaming], .message',
    userMessageClass: '.user-message, [data-role="user"]',
    assistantMessageClass: '.assistant-message, [data-role="assistant"]',
    contentSelector: '.message-content',
  },
  gemini: {
    messageContainer: '.conversation-container',
    messageSelector: '.message',
    userMessageClass: '.user-message',
    assistantMessageClass: '.model-message',
    contentSelector: '.message-content',
  },
  perplexity: {
    messageContainer: '.thread',
    messageSelector: '.message',
    userMessageClass: '.user',
    assistantMessageClass: '.assistant',
  },
  grok: {
    messageContainer: 'main',
    messageSelector: '[data-testid*="message"]',
  },
  copilot: {
    messageContainer: '.conversation',
    messageSelector: '.message',
  },
};

/**
 * 內容擷取管理器類別
 */
export class ContentCaptureManager {
  private messageRepo: ChatMessageRepository;
  private sessionRepo: ChatSessionRepository;
  private captureIntervals: Map<string, NodeJS.Timeout>;
  private lastCapturedContent: Map<string, string>;

  constructor() {
    this.messageRepo = new ChatMessageRepository();
    this.sessionRepo = new ChatSessionRepository();
    this.captureIntervals = new Map();
    this.lastCapturedContent = new Map();
  }

  /**
   * 開始監控 WebView 內容
   */
  public startCapture(
    windowId: string,
    aiServiceId: string,
    sessionId: string,
    intervalMs: number = 5000
  ): void {
    // 如果已經在監控，先停止
    this.stopCapture(windowId);

    const interval = setInterval(() => {
      this.captureContent(windowId, aiServiceId, sessionId);
    }, intervalMs);

    this.captureIntervals.set(windowId, interval);
    console.log(`[ContentCapture] Started capture for window ${windowId}, service ${aiServiceId}`);
  }

  /**
   * 停止監控
   */
  public stopCapture(windowId: string): void {
    const interval = this.captureIntervals.get(windowId);
    if (interval) {
      clearInterval(interval);
      this.captureIntervals.delete(windowId);
      this.lastCapturedContent.delete(windowId);
      console.log(`[ContentCapture] Stopped capture for window ${windowId}`);
    }
  }

  /**
   * 擷取內容
   */
  private async captureContent(
    windowId: string,
    aiServiceId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const window = BrowserWindow.fromId(parseInt(windowId));
      if (!window) return;

      const webContents = window.webContents;
      if (!webContents) return;

      // 取得 AI 服務的選擇器配置
      const selectors = AI_SERVICE_SELECTORS[aiServiceId] || this.getDefaultSelectors();

      // 執行 JavaScript 擷取對話內容
      const captureScript = this.buildCaptureScript(selectors);
      const messages = (await webContents.executeJavaScript(captureScript)) as CapturedMessage[];

      if (!messages || messages.length === 0) return;

      // 檢查是否有新內容
      const contentHash = this.hashMessages(messages);
      const lastHash = this.lastCapturedContent.get(windowId);

      if (contentHash === lastHash) {
        // 內容沒有變化，不需要儲存
        return;
      }

      // 更新最後擷取的內容 hash
      this.lastCapturedContent.set(windowId, contentHash);

      // 儲存新訊息
      await this.saveNewMessages(sessionId, messages, aiServiceId);

      // 更新會話時間
      this.sessionRepo.touch(sessionId);

      console.log(
        `[ContentCapture] Captured ${messages.length} messages for session ${sessionId}`
      );
    } catch (error) {
      console.error(`[ContentCapture] Failed to capture content for ${windowId}:`, error);
    }
  }

  /**
   * 建立內容擷取腳本
   */
  private buildCaptureScript(selectors: any): string {
    return `
      (function() {
        try {
          const messages = [];
          const messageElements = document.querySelectorAll('${selectors.messageSelector}');

          messageElements.forEach((element, index) => {
            const isUser = element.matches('${selectors.userMessageClass || '.user'}') ||
                          element.getAttribute('data-message-author-role') === 'user' ||
                          element.classList.contains('user-message');

            let content = '';

            // 嘗試使用特定的內容選擇器
            if ('${selectors.contentSelector}') {
              const contentEl = element.querySelector('${selectors.contentSelector}');
              content = contentEl ? contentEl.innerText : element.innerText;
            } else {
              content = element.innerText;
            }

            // 清理內容
            content = content.trim();

            if (content.length > 0) {
              messages.push({
                content: content,
                isUser: isUser,
                timestamp: new Date().toISOString(),
                metadata: {
                  messageId: element.id || 'msg-' + index,
                  html: element.innerHTML.substring(0, 500) // 限制 HTML 長度
                }
              });
            }
          });

          return messages;
        } catch (error) {
          console.error('Content capture error:', error);
          return [];
        }
      })();
    `;
  }

  /**
   * 預設選擇器
   */
  private getDefaultSelectors() {
    return {
      messageContainer: 'main, .conversation, .thread',
      messageSelector: '[role="article"], .message, [data-testid*="message"]',
      userMessageClass: '.user, .user-message, [data-role="user"]',
      assistantMessageClass: '.assistant, .assistant-message, [data-role="assistant"]',
    };
  }

  /**
   * 儲存新訊息
   */
  private async saveNewMessages(
    sessionId: string,
    capturedMessages: CapturedMessage[],
    aiServiceId: string
  ): Promise<void> {
    // 取得現有訊息
    const existingMessages = this.messageRepo.findBySession(sessionId);
    const existingContents = new Set(existingMessages.map((m) => this.normalizeContent(m.content)));

    // 只儲存新訊息
    for (const msg of capturedMessages) {
      const normalizedContent = this.normalizeContent(msg.content);

      if (!existingContents.has(normalizedContent)) {
        this.messageRepo.createMessage(sessionId, msg.content, msg.isUser, {
          aiService: aiServiceId,
          capturedAt: new Date().toISOString(),
          ...msg.metadata,
        });

        existingContents.add(normalizedContent);
      }
    }
  }

  /**
   * 正規化內容（用於比較）
   */
  private normalizeContent(content: string): string {
    return content.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * 計算訊息的 hash
   */
  private hashMessages(messages: CapturedMessage[]): string {
    const contentStr = messages.map((m) => m.content).join('||');
    // 簡單的 hash 函數
    let hash = 0;
    for (let i = 0; i < contentStr.length; i++) {
      const char = contentStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * 手動觸發一次內容擷取
   */
  public async captureSingleSnapshot(
    windowId: string,
    aiServiceId: string,
    sessionId: string
  ): Promise<CapturedMessage[]> {
    try {
      const window = BrowserWindow.fromId(parseInt(windowId));
      if (!window) return [];

      const webContents = window.webContents;
      if (!webContents) return [];

      const selectors = AI_SERVICE_SELECTORS[aiServiceId] || this.getDefaultSelectors();
      const captureScript = this.buildCaptureScript(selectors);
      const messages = (await webContents.executeJavaScript(captureScript)) as CapturedMessage[];

      if (messages && messages.length > 0) {
        await this.saveNewMessages(sessionId, messages, aiServiceId);
        this.sessionRepo.touch(sessionId);
      }

      return messages;
    } catch (error) {
      console.error('[ContentCapture] Failed to capture snapshot:', error);
      return [];
    }
  }

  /**
   * 清理所有監控
   */
  public cleanup(): void {
    for (const [windowId] of this.captureIntervals) {
      this.stopCapture(windowId);
    }
  }
}

// 單例實例
export const contentCaptureManager = new ContentCaptureManager();
