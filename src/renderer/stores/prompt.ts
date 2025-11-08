import { defineStore } from 'pinia';
import type { Prompt } from '../../shared/types/database';

interface PromptStoreState {
  prompts: Prompt[];
  categories: string[];
  recentPrompts: Prompt[];
  favorites: Prompt[];
  loading: boolean;
  error: string | null;
}

export const usePromptStore = defineStore('prompt', {
  state: (): PromptStoreState => ({
    prompts: [],
    categories: [],
    recentPrompts: [],
    favorites: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * 根據分類取得提示詞
     */
    getPromptsByCategory(state) {
      return (category: string): Prompt[] => {
        return state.prompts.filter((prompt) => prompt.category === category);
      };
    },

    /**
     * 根據ID取得提示詞
     */
    getPromptById(state) {
      return (id: string): Prompt | undefined => {
        return state.prompts.find((prompt) => prompt.id === id);
      };
    },

    /**
     * 收藏的提示詞數量
     */
    favoriteCount(state): number {
      return state.favorites.length;
    },

    /**
     * 提示詞總數
     */
    totalCount(state): number {
      return state.prompts.length;
    },
  },

  actions: {
    /**
     * 載入所有提示詞
     */
    async loadPrompts() {
      this.loading = true;
      this.error = null;

      try {
        const prompts = (await window.electronAPI.loadData('prompts')) as Prompt[];
        this.prompts = prompts;

        // 載入分類
        const categories = [...new Set(prompts.map((p) => p.category))];
        this.categories = categories;

        // 載入收藏
        this.favorites = prompts.filter((p) => p.isFavorite);

        // 載入最近使用
        this.recentPrompts = prompts
          .filter((p) => p.usageCount > 0)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 10);
      } catch (error) {
        this.error = `載入提示詞失敗: ${error}`;
        console.error('Failed to load prompts:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 建立新提示詞
     */
    async savePrompt(
      title: string,
      content: string,
      category: string = 'general',
      tags: string[] = []
    ): Promise<Prompt> {
      this.loading = true;
      this.error = null;

      try {
        const prompt = (await window.electronAPI.saveData('prompts', {
          title,
          content,
          category,
          tags,
        })) as Prompt;

        this.prompts.unshift(prompt);

        // 更新分類列表
        if (!this.categories.includes(category)) {
          this.categories.push(category);
        }

        return prompt;
      } catch (error) {
        this.error = `儲存提示詞失敗: ${error}`;
        console.error('Failed to save prompt:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新提示詞
     */
    async updatePrompt(
      id: string,
      updates: Partial<Pick<Prompt, 'title' | 'content' | 'category' | 'tags'>>
    ) {
      try {
        await window.electronAPI.saveData('prompts', {
          id,
          ...updates,
        });

        // 更新本地狀態
        const prompt = this.prompts.find((p) => p.id === id);
        if (prompt) {
          Object.assign(prompt, updates);
        }
      } catch (error) {
        this.error = `更新提示詞失敗: ${error}`;
        console.error('Failed to update prompt:', error);
      }
    },

    /**
     * 搜尋提示詞
     */
    async searchPrompts(query: string): Promise<Prompt[]> {
      this.loading = true;
      this.error = null;

      try {
        const prompts = (await window.electronAPI.loadData('prompts', {
          query,
        })) as Prompt[];

        return prompts;
      } catch (error) {
        this.error = `搜尋提示詞失敗: ${error}`;
        console.error('Failed to search prompts:', error);
        return [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * 切換收藏狀態
     */
    async toggleFavorite(promptId: string): Promise<boolean> {
      try {
        const prompt = this.prompts.find((p) => p.id === promptId);
        if (!prompt) {
          throw new Error(`Prompt with id ${promptId} not found`);
        }

        const newFavoriteState = !prompt.isFavorite;

        await window.electronAPI.saveData('prompts', {
          id: promptId,
          isFavorite: newFavoriteState,
        });

        // 更新本地狀態
        prompt.isFavorite = newFavoriteState;

        // 更新收藏列表
        if (newFavoriteState) {
          this.favorites.push(prompt);
        } else {
          const index = this.favorites.findIndex((p) => p.id === promptId);
          if (index > -1) {
            this.favorites.splice(index, 1);
          }
        }

        return newFavoriteState;
      } catch (error) {
        this.error = `切換收藏狀態失敗: ${error}`;
        console.error('Failed to toggle favorite:', error);
        throw error;
      }
    },

    /**
     * 增加使用次數
     */
    async incrementUsage(promptId: string) {
      try {
        const prompt = this.prompts.find((p) => p.id === promptId);
        if (!prompt) {
          return;
        }

        await window.electronAPI.saveData('prompts', {
          id: promptId,
          usageCount: (prompt.usageCount || 0) + 1,
        });

        // 更新本地狀態
        prompt.usageCount = (prompt.usageCount || 0) + 1;

        // 更新最近使用列表
        this.updateRecentPrompts();
      } catch (error) {
        console.error('Failed to increment usage:', error);
      }
    },

    /**
     * 刪除提示詞
     */
    async deletePrompt(promptId: string) {
      try {
        await window.electronAPI.saveData('prompts', {
          id: promptId,
          _delete: true,
        });

        // 從列表中移除
        const index = this.prompts.findIndex((p) => p.id === promptId);
        if (index > -1) {
          this.prompts.splice(index, 1);
        }

        // 從收藏列表中移除
        const favoriteIndex = this.favorites.findIndex((p) => p.id === promptId);
        if (favoriteIndex > -1) {
          this.favorites.splice(favoriteIndex, 1);
        }

        // 從最近使用列表中移除
        const recentIndex = this.recentPrompts.findIndex((p) => p.id === promptId);
        if (recentIndex > -1) {
          this.recentPrompts.splice(recentIndex, 1);
        }
      } catch (error) {
        this.error = `刪除提示詞失敗: ${error}`;
        console.error('Failed to delete prompt:', error);
      }
    },

    /**
     * 更新最近使用列表
     */
    updateRecentPrompts() {
      this.recentPrompts = this.prompts
        .filter((p) => p.usageCount > 0)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);
    },
  },
});
