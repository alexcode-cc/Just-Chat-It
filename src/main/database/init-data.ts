import { AIServiceRepository, HotkeySettingsRepository } from './repositories';
import { DEFAULT_AI_SERVICES } from '../../shared/constants/database';
import { HotkeySettings } from '../../shared/types/database';

/**
 * 初始化預設資料
 */
export async function initializeDefaultData(): Promise<void> {
  try {
    const aiServiceRepo = new AIServiceRepository();
    const hotkeyRepo = new HotkeySettingsRepository();

    // 檢查是否已有AI服務資料
    const existingServices = await aiServiceRepo.findAll();

    if (existingServices.length === 0) {
      // 初始化預設的AI服務
      console.log('Initializing default AI services...');

      for (const serviceConfig of DEFAULT_AI_SERVICES) {
        await aiServiceRepo.create({
          id: serviceConfig.id,
          name: serviceConfig.name,
          displayName: serviceConfig.displayName,
          webUrl: serviceConfig.webUrl,
          iconPath: serviceConfig.iconPath,
          hotkey: serviceConfig.hotkey,
          isAvailable: serviceConfig.isAvailable,
        });

        console.log(`Created AI service: ${serviceConfig.displayName}`);
      }

      console.log('Default AI services initialized successfully');
    } else {
      console.log(`Found ${existingServices.length} existing AI services`);
    }

    // 檢查是否已有熱鍵設定
    const existingHotkeys = await hotkeyRepo.findAll();

    if (existingHotkeys.length === 0) {
      // 初始化預設熱鍵設定
      console.log('Initializing default hotkey settings...');

      const defaultHotkeys: HotkeySettings[] = [
        {
          id: 'show-main-panel',
          name: '顯示主控制面板',
          accelerator: 'CommandOrControl+Shift+Space',
          description: '顯示/隱藏主控制面板',
          category: 'system',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'open-chatgpt',
          name: '開啟 ChatGPT',
          accelerator: 'CommandOrControl+Shift+1',
          description: '快速開啟 ChatGPT 聊天視窗',
          category: 'ai-service',
          enabled: true,
          aiServiceId: 'chatgpt',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'open-claude',
          name: '開啟 Claude',
          accelerator: 'CommandOrControl+Shift+2',
          description: '快速開啟 Claude 聊天視窗',
          category: 'ai-service',
          enabled: true,
          aiServiceId: 'claude',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'open-gemini',
          name: '開啟 Gemini',
          accelerator: 'CommandOrControl+Shift+3',
          description: '快速開啟 Gemini 聊天視窗',
          category: 'ai-service',
          enabled: true,
          aiServiceId: 'gemini',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'open-perplexity',
          name: '開啟 Perplexity',
          accelerator: 'CommandOrControl+Shift+4',
          description: '快速開啟 Perplexity 聊天視窗',
          category: 'ai-service',
          enabled: true,
          aiServiceId: 'perplexity',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'open-grok',
          name: '開啟 Grok',
          accelerator: 'CommandOrControl+Shift+5',
          description: '快速開啟 Grok 聊天視窗',
          category: 'ai-service',
          enabled: true,
          aiServiceId: 'grok',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'open-copilot',
          name: '開啟 Copilot',
          accelerator: 'CommandOrControl+Shift+6',
          description: '快速開啟 Copilot 聊天視窗',
          category: 'ai-service',
          enabled: true,
          aiServiceId: 'copilot',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const hotkey of defaultHotkeys) {
        await hotkeyRepo.create(hotkey);
        console.log(`Created hotkey: ${hotkey.name} (${hotkey.accelerator})`);
      }

      console.log('Default hotkey settings initialized successfully');
    } else {
      console.log(`Found ${existingHotkeys.length} existing hotkey settings`);
    }
  } catch (error) {
    console.error('Failed to initialize default data:', error);
    throw error;
  }
}
