import { api } from '~/lib/api';
import type {
  Customer,
  CustomerFilters,
  CustomersResponse,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerStats,
  CustomerType,
} from '~/types/customer';

// Mock data for development
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Juan Carlos Perez',
    email: 'jcperez@email.com',
    phone: '+57 300 123 4567',
    document: '1234567890',
    documentType: 'CC',
    type: 'INDIVIDUAL',
    address: 'Calle 80 #45-12',
    city: 'Bogota',
    notes: 'Cliente frecuente, prefiere pago contra entrega',
    isActive: true,
    totalPurchases: 15,
    totalSpent: 2500000,
    lastPurchaseDate: '2024-01-10T14:30:00Z',
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: '2',
    name: 'Distribuidora ABC S.A.S',
    email: 'compras@distribuidoraabc.com',
    phone: '+57 1 234 5678',
    document: '900123456-7',
    documentType: 'NIT',
    type: 'BUSINESS',
    address: 'Zona Industrial, Bodega 15',
    city: 'Medellin',
    notes: 'Compra al por mayor, credito a 30 dias',
    isActive: true,
    totalPurchases: 45,
    totalSpent: 85000000,
    lastPurchaseDate: '2024-01-09T11:20:00Z',
    createdAt: '2023-03-01T09:00:00Z',
    updatedAt: '2024-01-09T12:00:00Z',
  },
  {
    id: '3',
    name: 'Maria Elena Garcia',
    email: 'mgarcia@gmail.com',
    phone: '+57 310 987 6543',
    document: '52345678',
    documentType: 'CC',
    type: 'INDIVIDUAL',
    address: 'Carrera 15 #98-45, Apto 301',
    city: 'Bogota',
    isActive: true,
    totalPurchases: 8,
    totalSpent: 1200000,
    lastPurchaseDate: '2024-01-05T16:45:00Z',
    createdAt: '2023-09-20T14:00:00Z',
    updatedAt: '2024-01-05T17:00:00Z',
  },
  {
    id: '4',
    name: 'Tech Solutions Ltda',
    email: 'admin@techsolutions.co',
    phone: '+57 2 345 6789',
    document: '800456789-1',
    documentType: 'NIT',
    type: 'BUSINESS',
    address: 'Centro Empresarial, Oficina 502',
    city: 'Cali',
    notes: 'Compras de tecnologia y equipos de computo',
    isActive: true,
    totalPurchases: 23,
    totalSpent: 45000000,
    lastPurchaseDate: '2024-01-08T09:30:00Z',
    createdAt: '2023-05-10T11:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z',
  },
  {
    id: '5',
    name: 'Roberto Andres Martinez',
    email: 'rmartinez@hotmail.com',
    phone: '+57 320 456 7890',
    document: '80123456',
    documentType: 'CC',
    type: 'INDIVIDUAL',
    address: 'Av. Chile #50-20',
    city: 'Bogota',
    isActive: false,
    totalPurchases: 3,
    totalSpent: 450000,
    lastPurchaseDate: '2023-08-15T13:00:00Z',
    createdAt: '2023-07-01T10:00:00Z',
    updatedAt: '2023-12-01T09:00:00Z',
  },
  {
    id: '6',
    name: 'Almacenes El Progreso',
    email: 'ventas@elprogreso.com',
    phone: '+57 4 567 8901',
    document: '900789012-3',
    documentType: 'NIT',
    type: 'BUSINESS',
    address: 'Calle 10 #12-34',
    city: 'Bucaramanga',
    notes: 'Minorista, pedidos semanales',
    isActive: true,
    totalPurchases: 52,
    totalSpent: 32000000,
    lastPurchaseDate: '2024-01-11T08:00:00Z',
    createdAt: '2023-02-15T08:00:00Z',
    updatedAt: '2024-01-11T08:30:00Z',
  },
  {
    id: '7',
    name: 'Ana Sofia Ruiz',
    email: 'anaruiz@outlook.com',
    phone: '+57 315 234 5678',
    document: '1098765432',
    documentType: 'CC',
    type: 'INDIVIDUAL',
    address: 'Transversal 9 #130-50',
    city: 'Barranquilla',
    isActive: true,
    totalPurchases: 6,
    totalSpent: 890000,
    lastPurchaseDate: '2024-01-07T15:20:00Z',
    createdAt: '2023-10-05T12:00:00Z',
    updatedAt: '2024-01-07T16:00:00Z',
  },
  {
    id: '8',
    name: 'Comercializadora Global',
    email: 'info@comercializadoraglobal.co',
    phone: '+57 5 678 9012',
    document: '900234567-8',
    documentType: 'NIT',
    type: 'BUSINESS',
    address: 'Puerto Libre, Bodega 8',
    city: 'Cartagena',
    notes: 'Importador, pagos anticipados',
    isActive: true,
    totalPurchases: 18,
    totalSpent: 120000000,
    lastPurchaseDate: '2024-01-06T10:15:00Z',
    createdAt: '2023-04-20T09:00:00Z',
    updatedAt: '2024-01-06T11:00:00Z',
  },
];

// Helper to filter customers
function filterCustomers(
  customers: Customer[],
  filters: CustomerFilters
): CustomersResponse {
  let filtered = [...customers];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.document?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(filters.search!)
    );
  }

  // Type filter
  if (filters.type) {
    filtered = filtered.filter((customer) => customer.type === filters.type);
  }

  // City filter
  if (filters.city) {
    filtered = filtered.filter(
      (customer) =>
        customer.city?.toLowerCase() === filters.city?.toLowerCase()
    );
  }

  // Active filter
  if (filters.isActive !== undefined) {
    filtered = filtered.filter(
      (customer) => customer.isActive === filters.isActive
    );
  }

  // Sorting
  const sortBy = filters.sortBy || 'name';
  const sortOrder = filters.sortOrder || 'asc';
  filtered.sort((a, b) => {
    const aValue = a[sortBy as keyof Customer] ?? '';
    const bValue = b[sortBy as keyof Customer] ?? '';
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
export const customersService = {
  // Get paginated customers with filters
  async getCustomers(filters: CustomerFilters = {}): Promise<CustomersResponse> {
    // In production, uncomment this:
    // const { data } = await api.get<CustomersResponse>('/customers', { params: filters });
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    return filterCustomers(mockCustomers, filters);
  },

  async getCustomer(id: string): Promise<Customer> {
    // In production, uncomment this:
    // const { data } = await api.get<Customer>(`/customers/${id}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 200));
    const customer = mockCustomers.find((c) => c.id === id);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }
    return customer;
  },

  async getCustomerStats(id: string): Promise<CustomerStats> {
    // In production, uncomment this:
    // const { data } = await api.get<CustomerStats>(`/customers/${id}/stats`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 200));
    const customer = mockCustomers.find((c) => c.id === id);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }
    return {
      totalInvoices: customer.totalPurchases || 0,
      totalSpent: customer.totalSpent || 0,
      averageOrderValue: customer.totalPurchases
        ? Math.round((customer.totalSpent || 0) / customer.totalPurchases)
        : 0,
      lastPurchaseDate: customer.lastPurchaseDate || null,
    };
  },

  // Get unique cities (for filter dropdown)
  async getCities(): Promise<string[]> {
    // In production, uncomment this:
    // const { data } = await api.get<string[]>('/customers/cities');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 100));
    const cities = new Set(
      mockCustomers.map((c) => c.city).filter((c): c is string => !!c)
    );
    return Array.from(cities).sort();
  },

  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    // In production, uncomment this:
    // const { data: newCustomer } = await api.post<Customer>('/customers', data);
    // return newCustomer;

    // Validate email uniqueness
    const existingEmail = mockCustomers.find(
      (c) => c.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existingEmail) {
      throw new Error('Ya existe un cliente con este correo electronico');
    }

    // Validate document uniqueness
    if (data.document) {
      const existingDocument = mockCustomers.find(
        (c) => c.document === data.document
      );
      if (existingDocument) {
        throw new Error('Ya existe un cliente con este documento');
      }
    }

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newCustomer: Customer = {
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      isActive: data.isActive ?? true,
      totalPurchases: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCustomers.unshift(newCustomer);
    return newCustomer;
  },

  async updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
    // In production, uncomment this:
    // const { data: updated } = await api.patch<Customer>(`/customers/${id}`, data);
    // return updated;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockCustomers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }

    // Validate email uniqueness if changed
    if (data.email && data.email !== mockCustomers[index].email) {
      const existingEmail = mockCustomers.find(
        (c) => c.email.toLowerCase() === data.email!.toLowerCase() && c.id !== id
      );
      if (existingEmail) {
        throw new Error('Ya existe un cliente con este correo electronico');
      }
    }

    mockCustomers[index] = {
      ...mockCustomers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockCustomers[index];
  },

  async deleteCustomer(id: string): Promise<void> {
    // In production, uncomment this:
    // await api.delete(`/customers/${id}`);

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockCustomers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Cliente no encontrado');
    }
    if (mockCustomers[index].totalPurchases && mockCustomers[index].totalPurchases > 0) {
      throw new Error('No se puede eliminar un cliente con facturas asociadas');
    }
    mockCustomers.splice(index, 1);
  },
};