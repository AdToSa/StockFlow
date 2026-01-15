import { api } from '~/lib/api';
import type {
  Category,
  CategoryFilters,
  CategoriesResponse,
  CreateCategoryData,
  UpdateCategoryData,
} from '~/types/category';

// Mock data for development
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronica',
    description: 'Dispositivos electronicos y tecnologia',
    productCount: 45,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: '2',
    name: 'Accesorios',
    description: 'Accesorios para dispositivos electronicos',
    productCount: 32,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-08T11:20:00Z',
  },
  {
    id: '3',
    name: 'Ropa',
    description: 'Prendas de vestir y moda',
    productCount: 78,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-05T09:00:00Z',
  },
  {
    id: '4',
    name: 'Hogar',
    description: 'Articulos para el hogar y decoracion',
    productCount: 56,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-03T14:00:00Z',
  },
  {
    id: '5',
    name: 'Deportes',
    description: 'Articulos deportivos y fitness',
    productCount: 23,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-02T16:00:00Z',
  },
  {
    id: '6',
    name: 'Alimentos',
    description: 'Productos alimenticios y bebidas',
    productCount: 89,
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '7',
    name: 'Belleza',
    description: 'Productos de belleza y cuidado personal',
    productCount: 41,
    createdAt: '2023-11-15T08:00:00Z',
    updatedAt: '2024-01-09T13:00:00Z',
  },
  {
    id: '8',
    name: 'Juguetes',
    description: 'Juguetes y juegos para todas las edades',
    productCount: 67,
    createdAt: '2023-11-20T11:00:00Z',
    updatedAt: '2024-01-07T17:00:00Z',
  },
];

// Helper to filter categories
function filterCategories(
  categories: Category[],
  filters: CategoryFilters
): CategoriesResponse {
  let filtered = [...categories];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (category) =>
        category.name.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
    );
  }

  // Parent filter
  if (filters.parentId) {
    filtered = filtered.filter(
      (category) => category.parentId === filters.parentId
    );
  }

  // Sorting
  const sortBy = filters.sortBy || 'name';
  const sortOrder = filters.sortOrder || 'asc';
  filtered.sort((a, b) => {
    const aValue = a[sortBy as keyof Category] ?? '';
    const bValue = b[sortBy as keyof Category] ?? '';
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
export const categoriesService = {
  // Get paginated categories with filters
  async getCategoriesWithFilters(
    filters: CategoryFilters = {}
  ): Promise<CategoriesResponse> {
    // In production, uncomment this:
    // const { data } = await api.get<CategoriesResponse>('/categories', { params: filters });
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    return filterCategories(mockCategories, filters);
  },

  // Get all categories (for dropdowns)
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

  async createCategory(data: CreateCategoryData): Promise<Category> {
    // In production, uncomment this:
    // const { data: newCategory } = await api.post<Category>('/categories', data);
    // return newCategory;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newCategory: Category = {
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCategories.unshift(newCategory);
    return newCategory;
  },

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
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