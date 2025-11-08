import { AIServiceRepository } from './repositories';
import { DEFAULT_AI_SERVICES } from '../../shared/constants/database';

/**
 * 初始化預設資料
 */
export async function initializeDefaultData(): Promise<void> {
  try {
    const aiServiceRepo = new AIServiceRepository();

    // 檢查是否已有AI服務資料
    const existingServices = aiServiceRepo.findAll();

    if (existingServices.length === 0) {
      // 初始化預設的AI服務
      console.log('Initializing default AI services...');

      for (const serviceConfig of DEFAULT_AI_SERVICES) {
        aiServiceRepo.create({
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
  } catch (error) {
    console.error('Failed to initialize default data:', error);
    throw error;
  }
}
