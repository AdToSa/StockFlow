import { api } from '~/lib/api';
import type {
  Warehouse,
  WarehouseFilters,
  WarehousesResponse,
  CreateWarehouseData,
  UpdateWarehouseData,
  WarehouseStats,
} from '~/types/warehouse';

// Mock data for development
const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: 'Bodega Principal',
    address: 'Calle 100 #45-67',
    city: 'Bogota',
    phone: '+57 1 234 5678',
    email: 'principal@stockflow.com',
    manager: 'Carlos Rodriguez',
    capacity: 10000,
    currentOccupancy: 7500,
    isActive: true,
    productCount: 156,
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: '2',
    name: 'Bodega Sur',
    address: 'Carrera 50 #12-34',
    city: 'Cali',
    phone: '+57 2 345 6789',
    email: 'sur@stockflow.com',
    manager: 'Maria Lopez',
    capacity: 5000,
    currentOccupancy: 3200,
    isActive: true,
    productCount: 89,
    createdAt: '2023-11-15T09:00:00Z',
    updatedAt: '2024-01-08T11:20:00Z',
  },
  {
    id: '3',
    name: 'Centro de Distribucion Norte',
    address: 'Avenida 68 #89-10',
    city: 'Medellin',
    phone: '+57 4 456 7890',
    email: 'norte@stockflow.com',
    manager: 'Juan Martinez',
    capacity: 8000,
    currentOccupancy: 6800,
    isActive: true,
    productCount: 234,
    createdAt: '2023-12-01T14:00:00Z',
    updatedAt: '2024-01-05T09:00:00Z',
  },
  {
    id: '4',
    name: 'Almacen Costa',
    address: 'Calle 72 #54-21',
    city: 'Barranquilla',
    phone: '+57 5 567 8901',
    email: 'costa@stockflow.com',
    manager: 'Ana Garcia',
    capacity: 3000,
    currentOccupancy: 0,
    isActive: false,
    productCount: 0,
    createdAt: '2023-12-10T11:00:00Z',
    updatedAt: '2024-01-03T14:00:00Z',
  },
  {
    id: '5',
    name: 'Bodega Express',
    address: 'Transversal 40 #15-30',
    city: 'Bucaramanga',
    phone: '+57 7 678 9012',
    email: 'express@stockflow.com',
    manager: 'Pedro Sanchez',
    capacity: 2500,
    currentOccupancy: 1800,
    isActive: true,
    productCount: 67,
    createdAt: '2023-12-20T16:00:00Z',
    updatedAt: '2024-01-09T10:00:00Z',
  },
];

// Helper to filter warehouses
function filterWarehouses(
  warehouses: Warehouse[],
  filters: WarehouseFilters
): WarehousesResponse {
  let filtered = [...warehouses];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(searchLower) ||
        warehouse.address?.toLowerCase().includes(searchLower) ||
        warehouse.city?.toLowerCase().includes(searchLower) ||
        warehouse.manager?.toLowerCase().includes(searchLower)
    );
  }

  // City filter
  if (filters.city) {
    filtered = filtered.filter(
      (warehouse) =>
        warehouse.city?.toLowerCase() === filters.city?.toLowerCase()
    );
  }

  // Active filter
  if (filters.isActive !== undefined) {
    filtered = filtered.filter(
      (warehouse) => warehouse.isActive === filters.isActive
    );
  }

  // Sorting
  const sortBy = filters.sortBy || 'name';
  const sortOrder = filters.sortOrder || 'asc';
  filtered.sort((a, b) => {
    const aValue = a[sortBy as keyof Warehouse] ?? '';
    const bValue = b[sortBy as keyof Warehouse] ?? '';
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filtered.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}

// Service
export const warehousesService = {
  // Get paginated warehouses with filters
  async getWarehousesWithFilters(
    filters: WarehouseFilters = {}
  ): Promise<WarehousesResponse> {
    // In production, uncomment this:
    // const { data } = await api.get<WarehousesResponse>('/warehouses', { params: filters });
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    return filterWarehouses(mockWarehouses, filters);
  },

  // Get active warehouses (for dropdowns)
  async getWarehouses(): Promise<Warehouse[]> {
    // In production, uncomment this:
    // const { data } = await api.get<Warehouse[]>('/warehouses');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockWarehouses.filter((w) => w.isActive);
  },

  // Get all warehouses including inactive
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

  async getWarehouseStats(id: string): Promise<WarehouseStats> {
    // In production, uncomment this:
    // const { data } = await api.get<WarehouseStats>(`/warehouses/${id}/stats`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 200));
    const warehouse = mockWarehouses.find((w) => w.id === id);
    if (!warehouse) {
      throw new Error('Bodega no encontrada');
    }
    return {
      totalProducts: warehouse.productCount || 0,
      lowStockProducts: Math.floor(Math.random() * 10),
      totalValue: Math.floor(Math.random() * 1000000) + 100000,
      utilizationPercentage: warehouse.capacity
        ? Math.round(((warehouse.currentOccupancy || 0) / warehouse.capacity) * 100)
        : 0,
    };
  },

  // Get unique cities (for filter dropdown)
  async getCities(): Promise<string[]> {
    // In production, uncomment this:
    // const { data } = await api.get<string[]>('/warehouses/cities');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 100));
    const cities = new Set(
      mockWarehouses.map((w) => w.city).filter((c): c is string => !!c)
    );
    return Array.from(cities).sort();
  },

  async createWarehouse(data: CreateWarehouseData): Promise<Warehouse> {
    // In production, uncomment this:
    // const { data: newWarehouse } = await api.post<Warehouse>('/warehouses', data);
    // return newWarehouse;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newWarehouse: Warehouse = {
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      isActive: data.isActive ?? true,
      currentOccupancy: 0,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockWarehouses.unshift(newWarehouse);
    return newWarehouse;
  },

  async updateWarehouse(
    id: string,
    data: UpdateWarehouseData
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
    if (mockWarehouses[index].productCount && mockWarehouses[index].productCount > 0) {
      throw new Error('No se puede eliminar una bodega con productos');
    }
    mockWarehouses.splice(index, 1);
  },
};