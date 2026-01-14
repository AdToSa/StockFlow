import { api } from '~/lib/api';
import type { Category } from '~/types/product';

// Mock data for development
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronica',
    description: 'Dispositivos electronicos y tecnologia',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: '2',
    name: 'Accesorios',
    description: 'Accesorios para dispositivos electronicos',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-08T11:20:00Z',
  },
  {
    id: '3',
    name: 'Ropa',
    description: 'Prendas de vestir y moda',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-05T09:00:00Z',
  },
  {
    id: '4',
    name: 'Hogar',
    description: 'Articulos para el hogar',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-03T14:00:00Z',
  },
  {
    id: '5',
    name: 'Deportes',
    description: 'Articulos deportivos y fitness',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-02T16:00:00Z',
  },
  {
    id: '6',
    name: 'Alimentos',
    description: 'Productos alimenticios y bebidas',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
];

// Service
export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    // In production, uncomment this:
    // const { data } = await api.get<Category[]>('/categories');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockCategories;
  },

  async getCategory(id: string): Promise<Category> {
    // In production, uncomment this:
    // const { data } = await api.get<Category>(`/categories/${id}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 200));
    const category = mockCategories.find((c) => c.id === id);
    if (!category) {
      throw new Error('Categoria no encontrada');
    }
    return category;
  },

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    // In production, uncomment this:
    // const { data: newCategory } = await api.post<Category>('/categories', data);
    // return newCategory;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newCategory: Category = {
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCategories.push(newCategory);
    return newCategory;
  },

  async updateCategory(
    id: string,
    data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Category> {
    // In production, uncomment this:
    // const { data: updated } = await api.patch<Category>(`/categories/${id}`, data);
    // return updated;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Categoria no encontrada');
    }
    mockCategories[index] = {
      ...mockCategories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockCategories[index];
  },

  async deleteCategory(id: string): Promise<void> {
    // In production, uncomment this:
    // await api.delete(`/categories/${id}`);

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Categoria no encontrada');
    }
    mockCategories.splice(index, 1);
  },
};