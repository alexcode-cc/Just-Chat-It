import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PromptRepository } from '../../../src/main/database/repositories/prompt-repository';
import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync } from 'fs';
import type { Prompt } from '../../../src/shared/types/database';

/**
 * Prompt Repository 整合測試
 * 使用真實的 SQLite 資料庫進行測試
 */
describe('PromptRepository 整合測試', () => {
  let db: Database.Database;
  let repository: PromptRepository;
  const testDbPath = join(__dirname, 'test-prompts.db');

  beforeEach(() => {
    // 建立測試資料庫
    db = new Database(testDbPath);

    // 建立 prompts 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        tags TEXT,
        created_at TEXT NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0
      )
    `);

    repository = new PromptRepository(db);
  });

  afterEach(() => {
    // 關閉資料庫並刪除測試檔案
    db.close();
    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
  });

  describe('create', () => {
    it('應該成功建立新提示詞', () => {
      const prompt = repository.create({
        title: 'Test Prompt',
        content: 'Test content',
        category: '通用',
        tags: ['test', 'example'],
      });

      expect(prompt.id).toBeDefined();
      expect(prompt.title).toBe('Test Prompt');
      expect(prompt.content).toBe('Test content');
      expect(prompt.category).toBe('通用');
      expect(prompt.tags).toEqual(['test', 'example']);
      expect(prompt.usageCount).toBe(0);
      expect(prompt.isFavorite).toBe(false);
      expect(prompt.createdAt).toBeInstanceOf(Date);
    });

    it('應該使用預設分類', () => {
      const prompt = repository.create({
        title: 'Test',
        content: 'Content',
        tags: [],
      });

      expect(prompt.category).toBe('general');
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      // 插入測試資料
      repository.create({
        title: 'Prompt 1',
        content: 'Content 1',
        category: '通用',
        tags: [],
      });

      repository.create({
        title: 'Prompt 2',
        content: 'Content 2',
        category: '程式開發',
        tags: [],
      });

      repository.create({
        title: 'Prompt 3',
        content: 'Content 3',
        category: '通用',
        tags: [],
      });
    });

    it('應該返回所有提示詞', () => {
      const prompts = repository.findAll();

      expect(prompts).toHaveLength(3);
      expect(prompts[0].title).toBe('Prompt 1');
      expect(prompts[1].title).toBe('Prompt 2');
      expect(prompts[2].title).toBe('Prompt 3');
    });
  });

  describe('findById', () => {
    it('應該根據 ID 找到提示詞', () => {
      const created = repository.create({
        title: 'Test Prompt',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      const found = repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Test Prompt');
    });

    it('應該在找不到時返回 null', () => {
      const found = repository.findById('nonexistent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByCategory', () => {
    beforeEach(() => {
      repository.create({
        title: 'General 1',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      repository.create({
        title: 'Code 1',
        content: 'Content',
        category: '程式開發',
        tags: [],
      });

      repository.create({
        title: 'General 2',
        content: 'Content',
        category: '通用',
        tags: [],
      });
    });

    it('應該返回特定分類的提示詞', () => {
      const generalPrompts = repository.findByCategory('通用');

      expect(generalPrompts).toHaveLength(2);
      expect(generalPrompts[0].category).toBe('通用');
      expect(generalPrompts[1].category).toBe('通用');
    });

    it('應該在分類不存在時返回空陣列', () => {
      const prompts = repository.findByCategory('不存在的分類');

      expect(prompts).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('應該成功更新提示詞', () => {
      const created = repository.create({
        title: 'Original Title',
        content: 'Original Content',
        category: '通用',
        tags: [],
      });

      const updated = repository.update(created.id, {
        title: 'Updated Title',
        content: 'Updated Content',
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.content).toBe('Updated Content');
      expect(updated?.category).toBe('通用'); // 未更新的欄位保持不變
    });

    it('應該在 ID 不存在時返回 null', () => {
      const result = repository.update('nonexistent-id', {
        title: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('應該成功刪除提示詞', () => {
      const created = repository.create({
        title: 'To Delete',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      const success = repository.delete(created.id);

      expect(success).toBe(true);

      const found = repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('應該在 ID 不存在時返回 false', () => {
      const success = repository.delete('nonexistent-id');

      expect(success).toBe(false);
    });
  });

  describe('incrementUsageCount', () => {
    it('應該增加使用次數', () => {
      const created = repository.create({
        title: 'Test',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      expect(created.usageCount).toBe(0);

      repository.incrementUsageCount(created.id);

      const updated = repository.findById(created.id);
      expect(updated?.usageCount).toBe(1);

      repository.incrementUsageCount(created.id);

      const updated2 = repository.findById(created.id);
      expect(updated2?.usageCount).toBe(2);
    });
  });

  describe('toggleFavorite', () => {
    it('應該切換收藏狀態', () => {
      const created = repository.create({
        title: 'Test',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      expect(created.isFavorite).toBe(false);

      repository.toggleFavorite(created.id);

      const updated1 = repository.findById(created.id);
      expect(updated1?.isFavorite).toBe(true);

      repository.toggleFavorite(created.id);

      const updated2 = repository.findById(created.id);
      expect(updated2?.isFavorite).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      repository.create({
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript programming',
        category: '程式開發',
        tags: ['js', 'programming'],
      });

      repository.create({
        title: 'Python Guide',
        content: 'Python programming basics',
        category: '程式開發',
        tags: ['python', 'programming'],
      });

      repository.create({
        title: 'Writing Tips',
        content: 'Improve your writing skills',
        category: '寫作',
        tags: ['writing'],
      });
    });

    it('應該根據標題搜尋', () => {
      const results = repository.search('JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
    });

    it('應該根據內容搜尋', () => {
      const results = repository.search('programming');

      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('應該不區分大小寫', () => {
      const results = repository.search('javascript');

      expect(results).toHaveLength(1);
    });

    it('應該在沒有結果時返回空陣列', () => {
      const results = repository.search('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('getFavorites', () => {
    beforeEach(() => {
      const prompt1 = repository.create({
        title: 'Favorite 1',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      const prompt2 = repository.create({
        title: 'Not Favorite',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      const prompt3 = repository.create({
        title: 'Favorite 2',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      repository.toggleFavorite(prompt1.id);
      repository.toggleFavorite(prompt3.id);
    });

    it('應該返回所有收藏的提示詞', () => {
      const favorites = repository.getFavorites();

      expect(favorites).toHaveLength(2);
      expect(favorites.every((p) => p.isFavorite)).toBe(true);
    });
  });

  describe('getCategories', () => {
    beforeEach(() => {
      repository.create({
        title: 'Test 1',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      repository.create({
        title: 'Test 2',
        content: 'Content',
        category: '程式開發',
        tags: [],
      });

      repository.create({
        title: 'Test 3',
        content: 'Content',
        category: '通用',
        tags: [],
      });

      repository.create({
        title: 'Test 4',
        content: 'Content',
        category: '寫作',
        tags: [],
      });
    });

    it('應該返回所有不重複的分類', () => {
      const categories = repository.getCategories();

      expect(categories).toHaveLength(3);
      expect(categories).toContain('通用');
      expect(categories).toContain('程式開發');
      expect(categories).toContain('寫作');
    });
  });
});
