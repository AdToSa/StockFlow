import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { categoriesService } from './categories.service';
import type { Category } from '~/types/product';

// Note: The categories service currently uses mock data internally
// These tests verify the service's CRUD logic

describe('categoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe('getCategories', () => {
    it('should return an array of categories', async () => {
      const promise = categoriesService.getCategories();
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return categories with required properties', async () => {
      const promise = categoriesService.getCategories();
      vi.advanceTimersByTime(300);
      const result = await promise;

      result.forEach((category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
      });
    });

    it('should include categories like Electronica and Accesorios', async () => {
      const promise = categoriesService.getCategories();
      vi.advanceTimersByTime(300);
      const result = await promise;

      const categoryNames = result.map((c) => c.name);
      expect(categoryNames).toContain('Electronica');
      expect(categoryNames).toContain('Accesorios');
    });
  });

  describe('getCategory', () => {
    it('should return a category by id', async () => {
      const promise = categoriesService.getCategory('1');
      vi.advanceTimersByTime(200);
      const result = await promise;

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.name).toBe('Electronica');
    });

    it('should throw error for non-existent category', async () => {
      const promise = categoriesService.getCategory('non-existent-id');
      vi.advanceTimersByTime(200);

      await expect(promise).rejects.toThrow('Categoria no encontrada');
    });
  });

  describe('createCategory', () => {
    it('should create a new category and return it', async () => {
      const newCategoryData = {
        name: 'Test Category',
        description: 'A test category for testing purposes',
      };

      const promise = categoriesService.createCategory(newCategoryData);
      vi.advanceTimersByTime(400);
      const result = await promise;

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Category');
      expect(result.description).toBe('A test category for testing purposes');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should generate a unique id for the new category', async () => {
      const newCategoryData = {
        name: 'Another Category',
      };

      const promise = categoriesService.createCategory(newCategoryData);
      vi.advanceTimersByTime(400);
      const result = await promise;

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      const updateData = {
        name: 'Updated Electronics',
        description: 'Updated description',
      };

      const promise = categoriesService.updateCategory('1', updateData);
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(result.name).toBe('Updated Electronics');
      expect(result.description).toBe('Updated description');
      expect(result.id).toBe('1');
    });

    it('should update the updatedAt timestamp', async () => {
      const updateData = {
        description: 'New description',
      };

      const promise = categoriesService.updateCategory('2', updateData);
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for non-existent category', async () => {
      const updateData = {
        name: 'New Name',
      };

      const promise = categoriesService.updateCategory('non-existent', updateData);
      vi.advanceTimersByTime(300);

      await expect(promise).rejects.toThrow('Categoria no encontrada');
    });

    it('should only update provided fields', async () => {
      // First get the original category
      const getPromise = categoriesService.getCategory('3');
      vi.advanceTimersByTime(200);
      const original = await getPromise;

      const updateData = {
        name: 'Updated Ropa',
      };

      const updatePromise = categoriesService.updateCategory('3', updateData);
      vi.advanceTimersByTime(300);
      const result = await updatePromise;

      expect(result.name).toBe('Updated Ropa');
      // Original description should be preserved
      expect(result.description).toBe(original.description);
    });
  });

  describe('deleteCategory', () => {
    it('should delete an existing category', async () => {
      // First, create a category to delete
      const createPromise = categoriesService.createCategory({
        name: 'Category to Delete',
        description: 'This will be deleted',
      });
      vi.advanceTimersByTime(400);
      const createdCategory = await createPromise;

      // Now delete it
      const deletePromise = categoriesService.deleteCategory(createdCategory.id);
      vi.advanceTimersByTime(300);

      await expect(deletePromise).resolves.toBeUndefined();
    });

    it('should throw error for non-existent category', async () => {
      const promise = categoriesService.deleteCategory('non-existent');
      vi.advanceTimersByTime(300);

      await expect(promise).rejects.toThrow('Categoria no encontrada');
    });
  });
});