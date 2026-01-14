import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { warehousesService } from './warehouses.service';
import type { Warehouse } from '~/types/product';

// Note: The warehouses service currently uses mock data internally
// These tests verify the service's CRUD logic

describe('warehousesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe('getWarehouses', () => {
    it('should return an array of active warehouses', async () => {
      const promise = warehousesService.getWarehouses();
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should only return active warehouses', async () => {
      const promise = warehousesService.getWarehouses();
      vi.advanceTimersByTime(300);
      const result = await promise;

      result.forEach((warehouse) => {
        expect(warehouse.isActive).toBe(true);
      });
    });

    it('should return warehouses with required properties', async () => {
      const promise = warehousesService.getWarehouses();
      vi.advanceTimersByTime(300);
      const result = await promise;

      result.forEach((warehouse) => {
        expect(warehouse).toHaveProperty('id');
        expect(warehouse).toHaveProperty('name');
        expect(typeof warehouse.id).toBe('string');
        expect(typeof warehouse.name).toBe('string');
      });
    });

    it('should include warehouses like Bodega Principal', async () => {
      const promise = warehousesService.getWarehouses();
      vi.advanceTimersByTime(300);
      const result = await promise;

      const warehouseNames = result.map((w) => w.name);
      expect(warehouseNames).toContain('Bodega Principal');
    });
  });

  describe('getAllWarehouses', () => {
    it('should return all warehouses including inactive ones', async () => {
      const promise = warehousesService.getAllWarehouses();
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(Array.isArray(result)).toBe(true);
      // Should have more warehouses than getWarehouses (which filters inactive)
      const activePromise = warehousesService.getWarehouses();
      vi.advanceTimersByTime(300);
      const activeResult = await activePromise;

      expect(result.length).toBeGreaterThanOrEqual(activeResult.length);
    });

    it('should include both active and inactive warehouses', async () => {
      const promise = warehousesService.getAllWarehouses();
      vi.advanceTimersByTime(300);
      const result = await promise;

      const hasActive = result.some((w) => w.isActive === true);
      const hasInactive = result.some((w) => w.isActive === false);

      expect(hasActive).toBe(true);
      expect(hasInactive).toBe(true);
    });
  });

  describe('getWarehouse', () => {
    it('should return a warehouse by id', async () => {
      const promise = warehousesService.getWarehouse('1');
      vi.advanceTimersByTime(200);
      const result = await promise;

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.name).toBe('Bodega Principal');
    });

    it('should return warehouse with address and city', async () => {
      const promise = warehousesService.getWarehouse('1');
      vi.advanceTimersByTime(200);
      const result = await promise;

      expect(result.address).toBeDefined();
      expect(result.city).toBeDefined();
    });

    it('should throw error for non-existent warehouse', async () => {
      const promise = warehousesService.getWarehouse('non-existent-id');
      vi.advanceTimersByTime(200);

      await expect(promise).rejects.toThrow('Bodega no encontrada');
    });
  });

  describe('createWarehouse', () => {
    it('should create a new warehouse and return it', async () => {
      const newWarehouseData = {
        name: 'Test Warehouse',
        address: 'Test Address 123',
        city: 'Test City',
        isActive: true,
      };

      const promise = warehousesService.createWarehouse(newWarehouseData);
      vi.advanceTimersByTime(400);
      const result = await promise;

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Warehouse');
      expect(result.address).toBe('Test Address 123');
      expect(result.city).toBe('Test City');
      expect(result.isActive).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should generate a unique id for the new warehouse', async () => {
      const newWarehouseData = {
        name: 'Another Warehouse',
        address: 'Another Address',
        city: 'Another City',
        isActive: true,
      };

      const promise = warehousesService.createWarehouse(newWarehouseData);
      vi.advanceTimersByTime(400);
      const result = await promise;

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });
  });

  describe('updateWarehouse', () => {
    it('should update an existing warehouse', async () => {
      const updateData = {
        name: 'Updated Bodega',
        address: 'New Address 456',
      };

      const promise = warehousesService.updateWarehouse('1', updateData);
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(result.name).toBe('Updated Bodega');
      expect(result.address).toBe('New Address 456');
      expect(result.id).toBe('1');
    });

    it('should update the updatedAt timestamp', async () => {
      const updateData = {
        city: 'New City',
      };

      const promise = warehousesService.updateWarehouse('2', updateData);
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for non-existent warehouse', async () => {
      const updateData = {
        name: 'New Name',
      };

      const promise = warehousesService.updateWarehouse('non-existent', updateData);
      vi.advanceTimersByTime(300);

      await expect(promise).rejects.toThrow('Bodega no encontrada');
    });

    it('should allow toggling isActive status', async () => {
      const updateData = {
        isActive: false,
      };

      const promise = warehousesService.updateWarehouse('2', updateData);
      vi.advanceTimersByTime(300);
      const result = await promise;

      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteWarehouse', () => {
    it('should delete an existing warehouse', async () => {
      // First, create a warehouse to delete
      const createPromise = warehousesService.createWarehouse({
        name: 'Warehouse to Delete',
        address: 'Delete Address',
        city: 'Delete City',
        isActive: true,
      });
      vi.advanceTimersByTime(400);
      const createdWarehouse = await createPromise;

      // Now delete it
      const deletePromise = warehousesService.deleteWarehouse(createdWarehouse.id);
      vi.advanceTimersByTime(300);

      await expect(deletePromise).resolves.toBeUndefined();
    });

    it('should throw error for non-existent warehouse', async () => {
      const promise = warehousesService.deleteWarehouse('non-existent');
      vi.advanceTimersByTime(300);

      await expect(promise).rejects.toThrow('Bodega no encontrada');
    });
  });
});