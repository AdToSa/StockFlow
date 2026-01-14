import { api } from '~/lib/api';
import type { Warehouse } from '~/types/product';

// Mock data for development
const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: 'Bodega Principal',
    address: 'Calle 100 #45-67',
    city: 'Bogota',
    isActive: true,
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: '2',
    name: 'Bodega Sur',
    address: 'Carrera 50 #12-34',
    city: 'Cali',
    isActive: true,
    createdAt: '2023-11-15T09:00:00Z',
    updatedAt: '2024-01-08T11:20:00Z',
  },
  {
    id: '3',
    name: 'Centro de Distribucion Norte',
    address: 'Avenida 68 #89-10',
    city: 'Medellin',
    isActive: true,
    createdAt: '2023-12-01T14:00:00Z',
    updatedAt: '2024-01-05T09:00:00Z',
  },
  {
    id: '4',
    name: 'Almacen Costa',
    address: 'Calle 72 #54-21',
    city: 'Barranquilla',
    isActive: false,
    createdAt: '2023-12-10T11:00:00Z',
    updatedAt: '2024-01-03T14:00:00Z',
  },
];

// Service
export const warehousesService = {
  async getWarehouses(): Promise<Warehouse[]> {
    // In production, uncomment this:
    // const { data } = await api.get<Warehouse[]>('/warehouses');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockWarehouses.filter((w) => w.isActive);
  },

  async getAllWarehouses(): Promise<Warehouse[]> {
    // In production, uncomment this:
    // const { data } = await api.get<Warehouse[]>('/warehouses?all=true');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockWarehouses;
  },

  async getWarehouse(id: string): Promise<Warehouse> {
    // In production, uncomment this:
    // const { data } = await api.get<Warehouse>(`/warehouses/${id}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 200));
    const warehouse = mockWarehouses.find((w) => w.id === id);
    if (!warehouse) {
      throw new Error('Bodega no encontrada');
    }
    return warehouse;
  },

  async createWarehouse(data: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
    // In production, uncomment this:
    // const { data: newWarehouse } = await api.post<Warehouse>('/warehouses', data);
    // return newWarehouse;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newWarehouse: Warehouse = {
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockWarehouses.push(newWarehouse);
    return newWarehouse;
  },

  async updateWarehouse(
    id: string,
    data: Partial<Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Warehouse> {
    // In production, uncomment this:
    // const { data: updated } = await api.patch<Warehouse>(`/warehouses/${id}`, data);
    // return updated;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockWarehouses.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new Error('Bodega no encontrada');
    }
    mockWarehouses[index] = {
      ...mockWarehouses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockWarehouses[index];
  },

  async deleteWarehouse(id: string): Promise<void> {
    // In production, uncomment this:
    // await api.delete(`/warehouses/${id}`);

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockWarehouses.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new Error('Bodega no encontrada');
    }
    mockWarehouses.splice(index, 1);
  },
};