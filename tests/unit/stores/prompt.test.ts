import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePromptStore } from '../../../src/renderer/stores/prompt';
import { createTestPrompt } from '../../helpers/test-data-factory';

describe('Prompt Store', () => {
  beforeEach(() => {
    // 建立新的 Pinia 實例
    setActivePinia(createPinia());

    // 重置 mock
    vi.clearAllMocks();
  });

  describe('初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      const store = usePromptStore();

      expect(store.prompts).toEqual([]);
      expect(store.categories).toEqual([]);
      expect(store.recentPrompts).toEqual([]);
      expect(store.favorites).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(null);
    });
  });

  describe('Getters', () => {
    it('getPromptsByCategory 應該根據分類過濾提示詞', () => {
      const store = usePromptStore();

      // 設定測試資料
      store.prompts = [
        createTestPrompt({ id: '1', category: '通用' }),
        createTestPrompt({ id: '2', category: '程式開發' }),
        createTestPrompt({ id: '3', category: '通用' }),
      ];

      const generalPrompts = store.getPromptsByCategory('通用');
      expect(generalPrompts).toHaveLength(2);
      expect(generalPrompts[0].id).toBe('1');
      expect(generalPrompts[1].id).toBe('3');
    });

    it('getPromptById 應該根據ID找到提示詞', () => {
      const store = usePromptStore();

      store.prompts = [
        createTestPrompt({ id: '1', title: 'Prompt 1' }),
        createTestPrompt({ id: '2', title: 'Prompt 2' }),
      ];

      const prompt = store.getPromptById('1');
      expect(prompt).toBeDefined();
      expect(prompt?.title).toBe('Prompt 1');
    });

    it('getPromptById 應該在找不到時返回 undefined', () => {
      const store = usePromptStore();

      store.prompts = [createTestPrompt({ id: '1' })];

      const prompt = store.getPromptById('nonexistent');
      expect(prompt).toBeUndefined();
    });

    it('favoriteCount 應該返回正確的收藏數量', () => {
      const store = usePromptStore();

      store.favorites = [
        createTestPrompt({ id: '1' }),
        createTestPrompt({ id: '2' }),
      ];

      expect(store.favoriteCount).toBe(2);
    });

    it('totalCount 應該返回正確的提示詞總數', () => {
      const store = usePromptStore();

      store.prompts = [
        createTestPrompt({ id: '1' }),
        createTestPrompt({ id: '2' }),
        createTestPrompt({ id: '3' }),
      ];

      expect(store.totalCount).toBe(3);
    });
  });

  describe('Actions', () => {
    describe('loadPrompts', () => {
      it('應該成功載入提示詞', async () => {
        const store = usePromptStore();

        const mockPrompts = [
          createTestPrompt({ id: '1', category: '通用', isFavorite: true, usageCount: 5 }),
          createTestPrompt({ id: '2', category: '程式開發', isFavorite: false, usageCount: 3 }),
          createTestPrompt({ id: '3', category: '通用', isFavorite: true, usageCount: 10 }),
        ];

        window.electronAPI.loadData = vi.fn().mockResolvedValue(mockPrompts);

        await store.loadPrompts();

        expect(store.prompts).toEqual(mockPrompts);
        expect(store.categories).toContain('通用');
        expect(store.categories).toContain('程式開發');
        expect(store.favorites).toHaveLength(2);
        expect(store.recentPrompts.length).toBeGreaterThan(0);
        expect(store.loading).toBe(false);
        expect(store.error).toBe(null);
      });

      it('應該處理載入錯誤', async () => {
        const store = usePromptStore();

        window.electronAPI.loadData = vi.fn().mockRejectedValue(new Error('Database error'));

        await store.loadPrompts();

        expect(store.error).toContain('載入提示詞失敗');
        expect(store.loading).toBe(false);
      });
    });

    describe('savePrompt', () => {
      it('應該成功建立新提示詞', async () => {
        const store = usePromptStore();

        const newPrompt = createTestPrompt({
          id: 'new-1',
          title: 'New Prompt',
          category: '新分類',
        });

        window.electronAPI.saveData = vi.fn().mockResolvedValue(newPrompt);

        const result = await store.savePrompt('New Prompt', 'Content', '新分類', ['tag1']);

        expect(result).toEqual(newPrompt);
        expect(store.prompts[0]).toEqual(newPrompt);
        expect(store.categories).toContain('新分類');
        expect(window.electronAPI.saveData).toHaveBeenCalledWith('prompts', {
          title: 'New Prompt',
          content: 'Content',
          category: '新分類',
          tags: ['tag1'],
        });
      });

      it('應該處理儲存錯誤', async () => {
        const store = usePromptStore();

        window.electronAPI.saveData = vi.fn().mockRejectedValue(new Error('Save error'));

        await expect(store.savePrompt('Title', 'Content')).rejects.toThrow();
        expect(store.error).toContain('儲存提示詞失敗');
      });
    });

    describe('updatePrompt', () => {
      it('應該成功更新提示詞', async () => {
        const store = usePromptStore();

        const prompt = createTestPrompt({ id: '1', title: 'Original' });
        store.prompts = [prompt];

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.updatePrompt('1', { title: 'Updated' });

        expect(store.prompts[0].title).toBe('Updated');
        expect(window.electronAPI.saveData).toHaveBeenCalledWith('prompts', {
          id: '1',
          title: 'Updated',
        });
      });
    });

    describe('toggleFavorite', () => {
      it('應該將提示詞設為收藏', async () => {
        const store = usePromptStore();

        const prompt = createTestPrompt({ id: '1', isFavorite: false });
        store.prompts = [prompt];

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        const result = await store.toggleFavorite('1');

        expect(result).toBe(true);
        expect(store.prompts[0].isFavorite).toBe(true);
        expect(store.favorites).toContainEqual(prompt);
      });

      it('應該取消提示詞收藏', async () => {
        const store = usePromptStore();

        const prompt = createTestPrompt({ id: '1', isFavorite: true });
        store.prompts = [prompt];
        store.favorites = [prompt];

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        const result = await store.toggleFavorite('1');

        expect(result).toBe(false);
        expect(store.prompts[0].isFavorite).toBe(false);
        expect(store.favorites).not.toContainEqual(prompt);
      });

      it('應該處理不存在的提示詞', async () => {
        const store = usePromptStore();

        await expect(store.toggleFavorite('nonexistent')).rejects.toThrow();
        expect(store.error).toContain('切換收藏狀態失敗');
      });
    });

    describe('incrementUsage', () => {
      it('應該增加使用次數', async () => {
        const store = usePromptStore();

        const prompt = createTestPrompt({ id: '1', usageCount: 5 });
        store.prompts = [prompt];

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.incrementUsage('1');

        expect(store.prompts[0].usageCount).toBe(6);
        expect(window.electronAPI.saveData).toHaveBeenCalledWith('prompts', {
          id: '1',
          usageCount: 6,
        });
      });

      it('應該處理不存在的提示詞而不拋出錯誤', async () => {
        const store = usePromptStore();

        await expect(store.incrementUsage('nonexistent')).resolves.toBeUndefined();
      });
    });

    describe('deletePrompt', () => {
      it('應該成功刪除提示詞', async () => {
        const store = usePromptStore();

        const prompt = createTestPrompt({ id: '1', isFavorite: true, usageCount: 5 });
        store.prompts = [prompt];
        store.favorites = [prompt];
        store.recentPrompts = [prompt];

        window.electronAPI.saveData = vi.fn().mockResolvedValue(undefined);

        await store.deletePrompt('1');

        expect(store.prompts).toHaveLength(0);
        expect(store.favorites).toHaveLength(0);
        expect(store.recentPrompts).toHaveLength(0);
        expect(window.electronAPI.saveData).toHaveBeenCalledWith('prompts', {
          id: '1',
          _delete: true,
        });
      });
    });

    describe('updateRecentPrompts', () => {
      it('應該正確更新最近使用列表', () => {
        const store = usePromptStore();

        store.prompts = [
          createTestPrompt({ id: '1', usageCount: 5 }),
          createTestPrompt({ id: '2', usageCount: 10 }),
          createTestPrompt({ id: '3', usageCount: 0 }),
          createTestPrompt({ id: '4', usageCount: 3 }),
        ];

        store.updateRecentPrompts();

        expect(store.recentPrompts).toHaveLength(3);
        expect(store.recentPrompts[0].id).toBe('2'); // 最高使用次數
        expect(store.recentPrompts[1].id).toBe('1');
        expect(store.recentPrompts[2].id).toBe('4');
      });

      it('應該限制最近使用列表在10個以內', () => {
        const store = usePromptStore();

        // 建立15個有使用次數的提示詞
        store.prompts = Array.from({ length: 15 }, (_, i) =>
          createTestPrompt({ id: `${i}`, usageCount: i + 1 })
        );

        store.updateRecentPrompts();

        expect(store.recentPrompts).toHaveLength(10);
      });
    });
  });
});
