import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dashboardService } from './dashboard.service';
import type {
  DashboardStats,
  DashboardCharts,
  RecentInvoice,
  LowStockAlert,
} from './dashboard.service';

describe('dashboardService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getStats', () => {
    it('should return dashboard stats after delay', async () => {
      const promise = dashboardService.getStats();

      // Fast-forward the timer
      vi.advanceTimersByTime(500);

      const result = await promise;

      expect(result).toHaveProperty('totalSales');
      expect(result).toHaveProperty('salesGrowth');
      expect(result).toHaveProperty('totalProducts');
      expect(result).toHaveProperty('productsGrowth');
      expect(result).toHaveProperty('totalInvoices');
      expect(result).toHaveProperty('invoicesGrowth');
      expect(result).toHaveProperty('totalCustomers');
      expect(result).toHaveProperty('customersGrowth');
    });

    it('should return correct mock data values', async () => {
      const promise = dashboardService.getStats();
      vi.advanceTimersByTime(500);

      const result = await promise;

      expect(result.totalSales).toBe(125750000);
      expect(result.salesGrowth).toBe(12.5);
      expect(result.totalProducts).toBe(1247);
      expect(result.productsGrowth).toBe(3.2);
      expect(result.totalInvoices).toBe(856);
      expect(result.invoicesGrowth).toBe(8.1);
      expect(result.totalCustomers).toBe(342);
      expect(result.customersGrowth).toBe(5.7);
    });

    it('should return data with correct types', async () => {
      const promise = dashboardService.getStats();
      vi.advanceTimersByTime(500);

      const result: DashboardStats = await promise;

      expect(typeof result.totalSales).toBe('number');
      expect(typeof result.salesGrowth).toBe('number');
      expect(typeof result.totalProducts).toBe('number');
      expect(typeof result.productsGrowth).toBe('number');
    });
  });

  describe('getCharts', () => {
    it('should return chart data after delay', async () => {
      const promise = dashboardService.getCharts();

      // Fast-forward the timer
      vi.advanceTimersByTime(700);

      const result = await promise;

      expect(result).toHaveProperty('salesChart');
      expect(result).toHaveProperty('categoryDistribution');
      expect(result).toHaveProperty('topProducts');
    });

    it('should return salesChart as array with correct structure', async () => {
      const promise = dashboardService.getCharts();
      vi.advanceTimersByTime(700);

      const result = await promise;

      expect(Array.isArray(result.salesChart)).toBe(true);
      expect(result.salesChart.length).toBeGreaterThan(0);

      const firstItem = result.salesChart[0];
      expect(firstItem).toHaveProperty('date');
      expect(firstItem).toHaveProperty('sales');
      expect(firstItem).toHaveProperty('orders');
    });

    it('should return categoryDistribution with colors', async () => {
      const promise = dashboardService.getCharts();
      vi.advanceTimersByTime(700);

      const result = await promise;

      expect(Array.isArray(result.categoryDistribution)).toBe(true);
      result.categoryDistribution.forEach((category) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('value');
        expect(category).toHaveProperty('color');
        expect(category.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should return topProducts with required fields', async () => {
      const promise = dashboardService.getCharts();
      vi.advanceTimersByTime(700);

      const result = await promise;

      expect(Array.isArray(result.topProducts)).toBe(true);
      result.topProducts.forEach((product) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('sales');
        expect(product).toHaveProperty('quantity');
      });
    });
  });

  describe('getRecentInvoices', () => {
    it('should return recent invoices after delay', async () => {
      const promise = dashboardService.getRecentInvoices();

      vi.advanceTimersByTime(600);

      const result = await promise;

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return invoices with correct structure', async () => {
      const promise = dashboardService.getRecentInvoices();
      vi.advanceTimersByTime(600);

      const result: RecentInvoice[] = await promise;

      result.forEach((invoice) => {
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('number');
        expect(invoice).toHaveProperty('customer');
        expect(invoice).toHaveProperty('amount');
        expect(invoice).toHaveProperty('status');
        expect(invoice).toHaveProperty('date');
      });
    });

    it('should have valid invoice statuses', async () => {
      const promise = dashboardService.getRecentInvoices();
      vi.advanceTimersByTime(600);

      const result = await promise;
      const validStatuses = ['PAID', 'PENDING', 'OVERDUE', 'CANCELLED'];

      result.forEach((invoice) => {
        expect(validStatuses).toContain(invoice.status);
      });
    });
  });

  describe('getLowStockAlerts', () => {
    it('should return low stock alerts after delay', async () => {
      const promise = dashboardService.getLowStockAlerts();

      vi.advanceTimersByTime(400);

      const result = await promise;

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return alerts with correct structure', async () => {
      const promise = dashboardService.getLowStockAlerts();
      vi.advanceTimersByTime(400);

      const result: LowStockAlert[] = await promise;

      result.forEach((alert) => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('name');
        expect(alert).toHaveProperty('sku');
        expect(alert).toHaveProperty('currentStock');
        expect(alert).toHaveProperty('minStock');
        expect(alert).toHaveProperty('warehouse');
      });
    });

    it('should have currentStock less than minStock for all alerts', async () => {
      const promise = dashboardService.getLowStockAlerts();
      vi.advanceTimersByTime(400);

      const result = await promise;

      result.forEach((alert) => {
        expect(alert.currentStock).toBeLessThan(alert.minStock);
      });
    });
  });

  describe('getAll', () => {
    it('should return all dashboard data', async () => {
      const promise = dashboardService.getAll();

      // Advance time enough for all requests (longest is 700ms)
      vi.advanceTimersByTime(700);

      const result = await promise;

      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('charts');
      expect(result).toHaveProperty('recentInvoices');
      expect(result).toHaveProperty('lowStockAlerts');
    });

    it('should fetch all data in parallel', async () => {
      const startTime = Date.now();
      const promise = dashboardService.getAll();

      // The longest request is 700ms, so all should complete by then
      vi.advanceTimersByTime(700);

      const result = await promise;

      // All data should be available
      expect(result.stats).toBeDefined();
      expect(result.charts).toBeDefined();
      expect(result.recentInvoices).toBeDefined();
      expect(result.lowStockAlerts).toBeDefined();
    });

    it('should return correctly typed data', async () => {
      const promise = dashboardService.getAll();
      vi.advanceTimersByTime(700);

      const result = await promise;

      // Stats
      expect(typeof result.stats.totalSales).toBe('number');

      // Charts
      expect(Array.isArray(result.charts.salesChart)).toBe(true);
      expect(Array.isArray(result.charts.categoryDistribution)).toBe(true);
      expect(Array.isArray(result.charts.topProducts)).toBe(true);

      // Invoices
      expect(Array.isArray(result.recentInvoices)).toBe(true);

      // Alerts
      expect(Array.isArray(result.lowStockAlerts)).toBe(true);
    });
  });
});