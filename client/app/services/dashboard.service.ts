import { api } from '~/lib/api';

// Types
export interface DashboardStats {
  totalSales: number;
  salesGrowth: number;
  totalProducts: number;
  productsGrowth: number;
  totalInvoices: number;
  invoicesGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  overdueInvoicesCount: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  orders: number;
  previousPeriod: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  sales: number;
  quantity: number;
}

export interface RecentInvoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  date: string;
}

export interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  warehouse: string;
}

export type ActivityType = 'sale' | 'product' | 'customer' | 'invoice' | 'stock';

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardCharts {
  salesChart: SalesChartData[];
  categoryDistribution: CategoryDistribution[];
  topProducts: TopProduct[];
}

export interface DashboardData {
  stats: DashboardStats;
  charts: DashboardCharts;
  recentInvoices: RecentInvoice[];
  lowStockAlerts: LowStockAlert[];
  recentActivity: RecentActivity[];
}

// Mock data for development
const mockStats: DashboardStats = {
  totalSales: 125750000,
  salesGrowth: 12.5,
  totalProducts: 1247,
  productsGrowth: 3.2,
  totalInvoices: 856,
  invoicesGrowth: 8.1,
  totalCustomers: 342,
  customersGrowth: 5.7,
  overdueInvoicesCount: 3,
};

const mockSalesChart: SalesChartData[] = [
  { date: '2024-01-01', sales: 4500000, orders: 45, previousPeriod: 4200000 },
  { date: '2024-01-02', sales: 5200000, orders: 52, previousPeriod: 4800000 },
  { date: '2024-01-03', sales: 4800000, orders: 48, previousPeriod: 4500000 },
  { date: '2024-01-04', sales: 6100000, orders: 61, previousPeriod: 5500000 },
  { date: '2024-01-05', sales: 5500000, orders: 55, previousPeriod: 5200000 },
  { date: '2024-01-06', sales: 7200000, orders: 72, previousPeriod: 6500000 },
  { date: '2024-01-07', sales: 6800000, orders: 68, previousPeriod: 6200000 },
  { date: '2024-01-08', sales: 5900000, orders: 59, previousPeriod: 5400000 },
  { date: '2024-01-09', sales: 6400000, orders: 64, previousPeriod: 5800000 },
  { date: '2024-01-10', sales: 7100000, orders: 71, previousPeriod: 6400000 },
  { date: '2024-01-11', sales: 6600000, orders: 66, previousPeriod: 6100000 },
  { date: '2024-01-12', sales: 7800000, orders: 78, previousPeriod: 7000000 },
  { date: '2024-01-13', sales: 8200000, orders: 82, previousPeriod: 7500000 },
  { date: '2024-01-14', sales: 7500000, orders: 75, previousPeriod: 6800000 },
];

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'sale',
    title: 'Nueva venta completada',
    description: 'Venta de $4,500,000 a Tecnologia Global S.A.S',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '2',
    type: 'product',
    title: 'Stock actualizado',
    description: 'iPhone 15 Pro - Stock aumentado a 150 unidades',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '3',
    type: 'customer',
    title: 'Nuevo cliente registrado',
    description: 'Distribuidora del Pacifico S.A.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '4',
    type: 'invoice',
    title: 'Factura pagada',
    description: 'INV-2024-0123 - $6,200,000',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: '5',
    type: 'stock',
    title: 'Alerta de stock bajo',
    description: 'Monitor Dell 27" - Solo 2 unidades disponibles',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '6',
    type: 'sale',
    title: 'Pedido procesado',
    description: 'Pedido #2024-0856 enviado a bodega',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

const mockCategoryDistribution: CategoryDistribution[] = [
  { name: 'Electronica', value: 35, color: '#3B82F6' },
  { name: 'Ropa', value: 25, color: '#10B981' },
  { name: 'Hogar', value: 20, color: '#F59E0B' },
  { name: 'Alimentos', value: 12, color: '#8B5CF6' },
  { name: 'Otros', value: 8, color: '#6B7280' },
];

const mockTopProducts: TopProduct[] = [
  { id: '1', name: 'iPhone 15 Pro', category: 'Electronica', sales: 45000000, quantity: 150 },
  { id: '2', name: 'MacBook Air M3', category: 'Electronica', sales: 38000000, quantity: 95 },
  { id: '3', name: 'AirPods Pro', category: 'Electronica', sales: 22000000, quantity: 220 },
  { id: '4', name: 'Samsung Galaxy S24', category: 'Electronica', sales: 18500000, quantity: 85 },
  { id: '5', name: 'iPad Air', category: 'Electronica', sales: 15200000, quantity: 76 },
];

const mockRecentInvoices: RecentInvoice[] = [
  { id: '1', number: 'INV-2024-0125', customer: 'Tecnologia Global S.A.S', amount: 4500000, status: 'PAID', date: '2024-01-14' },
  { id: '2', number: 'INV-2024-0124', customer: 'Comercial Andina Ltda', amount: 2800000, status: 'PENDING', date: '2024-01-14' },
  { id: '3', number: 'INV-2024-0123', customer: 'Distribuidora Norte', amount: 6200000, status: 'PAID', date: '2024-01-13' },
  { id: '4', number: 'INV-2024-0122', customer: 'Importaciones del Valle', amount: 1500000, status: 'OVERDUE', date: '2024-01-10' },
  { id: '5', number: 'INV-2024-0121', customer: 'Suministros Express', amount: 3200000, status: 'PAID', date: '2024-01-10' },
];

const mockLowStockAlerts: LowStockAlert[] = [
  { id: '1', name: 'Laptop HP Pavilion', sku: 'HP-PAV-001', currentStock: 5, minStock: 10, warehouse: 'Bodega Principal' },
  { id: '2', name: 'Mouse Logitech MX', sku: 'LOG-MX-002', currentStock: 8, minStock: 15, warehouse: 'Bodega Principal' },
  { id: '3', name: 'Teclado Mecanico', sku: 'TEC-MEC-003', currentStock: 3, minStock: 10, warehouse: 'Bodega Sur' },
  { id: '4', name: 'Monitor Dell 27"', sku: 'DELL-27-004', currentStock: 2, minStock: 8, warehouse: 'Bodega Principal' },
];

// Service
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    // In production, uncomment this:
    // const { data } = await api.get<DashboardStats>('/dashboard/stats');
    // return data;

    // Mock data for development
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockStats;
  },

  async getCharts(): Promise<DashboardCharts> {
    // In production, uncomment this:
    // const { data } = await api.get<DashboardCharts>('/dashboard/charts');
    // return data;

    // Mock data for development
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
      salesChart: mockSalesChart,
      categoryDistribution: mockCategoryDistribution,
      topProducts: mockTopProducts,
    };
  },

  async getRecentInvoices(): Promise<RecentInvoice[]> {
    // In production, uncomment this:
    // const { data } = await api.get<RecentInvoice[]>('/dashboard/recent-invoices');
    // return data;

    // Mock data for development
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockRecentInvoices;
  },

  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    // In production, uncomment this:
    // const { data } = await api.get<LowStockAlert[]>('/dashboard/low-stock-alerts');
    // return data;

    // Mock data for development
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockLowStockAlerts;
  },

  async getRecentActivity(): Promise<RecentActivity[]> {
    // In production, uncomment this:
    // const { data } = await api.get<RecentActivity[]>('/dashboard/recent-activity');
    // return data;

    // Mock data for development
    await new Promise(resolve => setTimeout(resolve, 450));
    return mockRecentActivity;
  },

  async getAll(): Promise<DashboardData> {
    const [stats, charts, recentInvoices, lowStockAlerts, recentActivity] = await Promise.all([
      this.getStats(),
      this.getCharts(),
      this.getRecentInvoices(),
      this.getLowStockAlerts(),
      this.getRecentActivity(),
    ]);

    return { stats, charts, recentInvoices, lowStockAlerts, recentActivity };
  },
};