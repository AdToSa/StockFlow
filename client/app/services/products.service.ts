import { api } from '~/lib/api';
import type {
  Product,
  ProductFilters,
  ProductsResponse,
  CreateProductData,
  UpdateProductData,
  LowStockProduct,
} from '~/types/product';

// Mock data for development
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    description: 'Smartphone Apple de ultima generacion con chip A17 Pro',
    sku: 'APL-IP15PM-256',
    barcode: '194253121234',
    price: 5999000,
    cost: 4800000,
    quantity: 25,
    minStock: 10,
    maxStock: 100,
    categoryId: '1',
    category: { id: '1', name: 'Electronica' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
    status: 'ACTIVE',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
  },
  {
    id: '2',
    name: 'MacBook Air M3',
    description: 'Laptop ultradelgada con chip M3 y 8GB RAM',
    sku: 'APL-MBA-M3-256',
    barcode: '194253122345',
    price: 4599000,
    cost: 3600000,
    quantity: 15,
    minStock: 5,
    maxStock: 50,
    categoryId: '1',
    category: { id: '1', name: 'Electronica' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    status: 'ACTIVE',
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-13T11:20:00Z',
  },
  {
    id: '3',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Smartphone Samsung con S Pen integrado',
    sku: 'SAM-GS24U-256',
    barcode: '887276123456',
    price: 4999000,
    cost: 3900000,
    quantity: 8,
    minStock: 10,
    maxStock: 80,
    categoryId: '1',
    category: { id: '1', name: 'Electronica' },
    warehouseId: '2',
    warehouse: { id: '2', name: 'Bodega Sur' },
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'],
    status: 'ACTIVE',
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
  },
  {
    id: '4',
    name: 'AirPods Pro 2',
    description: 'Audifonos inalambricos con cancelacion de ruido activa',
    sku: 'APL-APP2-WHT',
    barcode: '194253123456',
    price: 1099000,
    cost: 850000,
    quantity: 45,
    minStock: 20,
    maxStock: 150,
    categoryId: '2',
    category: { id: '2', name: 'Accesorios' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400'],
    status: 'ACTIVE',
    createdAt: '2024-01-03T11:00:00Z',
    updatedAt: '2024-01-11T09:15:00Z',
  },
  {
    id: '5',
    name: 'iPad Pro 12.9" M2',
    description: 'Tablet profesional con pantalla Liquid Retina XDR',
    sku: 'APL-IPADP-129',
    barcode: '194253124567',
    price: 5299000,
    cost: 4200000,
    quantity: 12,
    minStock: 8,
    maxStock: 40,
    categoryId: '1',
    category: { id: '1', name: 'Electronica' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'],
    status: 'ACTIVE',
    createdAt: '2024-01-02T08:00:00Z',
    updatedAt: '2024-01-10T14:30:00Z',
  },
  {
    id: '6',
    name: 'Monitor Dell 27" 4K',
    description: 'Monitor profesional UltraSharp con USB-C',
    sku: 'DEL-U2723QE',
    barcode: '884116234567',
    price: 2799000,
    cost: 2100000,
    quantity: 3,
    minStock: 5,
    maxStock: 25,
    categoryId: '1',
    category: { id: '1', name: 'Electronica' },
    warehouseId: '2',
    warehouse: { id: '2', name: 'Bodega Sur' },
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'],
    status: 'ACTIVE',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-09T12:00:00Z',
  },
  {
    id: '7',
    name: 'Teclado Logitech MX Keys',
    description: 'Teclado inalambrico con retroiluminacion inteligente',
    sku: 'LOG-MXKEYS',
    barcode: '097855134567',
    price: 549000,
    cost: 380000,
    quantity: 28,
    minStock: 15,
    maxStock: 100,
    categoryId: '2',
    category: { id: '2', name: 'Accesorios' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400'],
    status: 'ACTIVE',
    createdAt: '2023-12-28T09:00:00Z',
    updatedAt: '2024-01-08T11:00:00Z',
  },
  {
    id: '8',
    name: 'Mouse Logitech MX Master 3S',
    description: 'Mouse ergonomico con desplazamiento MagSpeed',
    sku: 'LOG-MXM3S',
    barcode: '097855145678',
    price: 449000,
    cost: 320000,
    quantity: 2,
    minStock: 10,
    maxStock: 80,
    categoryId: '2',
    category: { id: '2', name: 'Accesorios' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
    status: 'ACTIVE',
    createdAt: '2023-12-25T14:00:00Z',
    updatedAt: '2024-01-07T16:30:00Z',
  },
  {
    id: '9',
    name: 'Camiseta Polo Nike',
    description: 'Camiseta deportiva Dri-FIT talla M',
    sku: 'NIK-POLO-M-BLK',
    barcode: '091208156789',
    price: 189000,
    cost: 95000,
    quantity: 0,
    minStock: 20,
    maxStock: 200,
    categoryId: '3',
    category: { id: '3', name: 'Ropa' },
    warehouseId: '2',
    warehouse: { id: '2', name: 'Bodega Sur' },
    status: 'INACTIVE',
    createdAt: '2023-12-20T10:00:00Z',
    updatedAt: '2024-01-05T08:00:00Z',
  },
  {
    id: '10',
    name: 'Cafetera Nespresso Vertuo',
    description: 'Cafetera de capsulas con tecnologia Centrifusion',
    sku: 'NES-VERTUO-BLK',
    barcode: '768894156780',
    price: 899000,
    cost: 650000,
    quantity: 18,
    minStock: 10,
    maxStock: 50,
    categoryId: '4',
    category: { id: '4', name: 'Hogar' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400'],
    status: 'ACTIVE',
    createdAt: '2023-12-15T11:00:00Z',
    updatedAt: '2024-01-04T13:00:00Z',
  },
  {
    id: '11',
    name: 'Sony WH-1000XM5',
    description: 'Audifonos over-ear con la mejor cancelacion de ruido',
    sku: 'SON-WH1000XM5',
    barcode: '027242923459',
    price: 1699000,
    cost: 1300000,
    quantity: 7,
    minStock: 8,
    maxStock: 40,
    categoryId: '2',
    category: { id: '2', name: 'Accesorios' },
    warehouseId: '1',
    warehouse: { id: '1', name: 'Bodega Principal' },
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400'],
    status: 'ACTIVE',
    createdAt: '2023-12-10T09:00:00Z',
    updatedAt: '2024-01-03T10:00:00Z',
  },
  {
    id: '12',
    name: 'Nintendo Switch OLED',
    description: 'Consola de videojuegos con pantalla OLED de 7 pulgadas',
    sku: 'NIN-SWITCH-OLED',
    barcode: '045496453435',
    price: 1799000,
    cost: 1400000,
    quantity: 5,
    minStock: 10,
    maxStock: 30,
    categoryId: '1',
    category: { id: '1', name: 'Electronica' },
    warehouseId: '2',
    warehouse: { id: '2', name: 'Bodega Sur' },
    images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400'],
    status: 'ACTIVE',
    createdAt: '2023-12-05T14:00:00Z',
    updatedAt: '2024-01-02T15:00:00Z',
  },
];

const mockLowStockProducts: LowStockProduct[] = [
  { id: '8', name: 'Mouse Logitech MX Master 3S', sku: 'LOG-MXM3S', currentStock: 2, minStock: 10, warehouse: 'Bodega Principal', warehouseId: '1' },
  { id: '6', name: 'Monitor Dell 27" 4K', sku: 'DEL-U2723QE', currentStock: 3, minStock: 5, warehouse: 'Bodega Sur', warehouseId: '2' },
  { id: '12', name: 'Nintendo Switch OLED', sku: 'NIN-SWITCH-OLED', currentStock: 5, minStock: 10, warehouse: 'Bodega Sur', warehouseId: '2' },
  { id: '11', name: 'Sony WH-1000XM5', sku: 'SON-WH1000XM5', currentStock: 7, minStock: 8, warehouse: 'Bodega Principal', warehouseId: '1' },
  { id: '3', name: 'Samsung Galaxy S24 Ultra', sku: 'SAM-GS24U-256', currentStock: 8, minStock: 10, warehouse: 'Bodega Sur', warehouseId: '2' },
];

// Helper function to filter and paginate products
function filterProducts(products: Product[], filters: ProductFilters): ProductsResponse {
  let filtered = [...products];

  // Search filter
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
    );
  }

  // Category filter
  if (filters.categoryId) {
    filtered = filtered.filter((p) => p.categoryId === filters.categoryId);
  }

  // Warehouse filter
  if (filters.warehouseId) {
    filtered = filtered.filter((p) => p.warehouseId === filters.warehouseId);
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter((p) => p.status === filters.status);
  }

  // Low stock filter
  if (filters.lowStock) {
    filtered = filtered.filter((p) => p.quantity <= p.minStock);
  }

  // Sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof Product];
      const bVal = b[filters.sortBy as keyof Product];
      const order = filters.sortOrder === 'desc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * order;
      }
      return 0;
    });
  }

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
export const productsService = {
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    // In production, uncomment this:
    // const params = new URLSearchParams();
    // Object.entries(filters).forEach(([key, value]) => {
    //   if (value !== undefined && value !== null) {
    //     params.append(key, String(value));
    //   }
    // });
    // const { data } = await api.get<ProductsResponse>(`/products?${params.toString()}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));
    return filterProducts(mockProducts, filters);
  },

  async getProduct(id: string): Promise<Product> {
    // In production, uncomment this:
    // const { data } = await api.get<Product>(`/products/${id}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const product = mockProducts.find((p) => p.id === id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    return product;
  },

  async createProduct(productData: CreateProductData): Promise<Product> {
    // In production, uncomment this:
    // const { data } = await api.post<Product>('/products', productData);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newProduct: Product = {
      id: Math.random().toString(36).substring(2, 9),
      ...productData,
      status: productData.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProducts.unshift(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, productData: UpdateProductData): Promise<Product> {
    // In production, uncomment this:
    // const { data } = await api.patch<Product>(`/products/${id}`, productData);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Producto no encontrado');
    }
    mockProducts[index] = {
      ...mockProducts[index],
      ...productData,
      updatedAt: new Date().toISOString(),
    };
    return mockProducts[index];
  },

  async deleteProduct(id: string): Promise<void> {
    // In production, uncomment this:
    // await api.delete(`/products/${id}`);

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Producto no encontrado');
    }
    mockProducts.splice(index, 1);
  },

  async getLowStockProducts(): Promise<LowStockProduct[]> {
    // In production, uncomment this:
    // const { data } = await api.get<LowStockProduct[]>('/products/low-stock');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockLowStockProducts;
  },
};