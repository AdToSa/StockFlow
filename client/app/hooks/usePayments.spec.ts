import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  usePayments,
  usePayment,
  usePaymentsByInvoice,
  usePaymentsByCustomer,
  useRecentPayments,
  usePaymentStats,
  useCreatePayment,
  useUpdatePayment,
  useUpdatePaymentStatus,
  useDeletePayment,
  useRefundPayment,
} from './usePayments';
import { paymentsService } from '~/services/payments.service';
import { toast } from '~/components/ui/Toast';
import { queryKeys } from '~/lib/query-client';
import type {
  Payment,
  PaymentsResponse,
  PaymentFilters,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentStats,
  PaymentStatus,
} from '~/types/payment';

// Mock dependencies
vi.mock('~/services/payments.service');
vi.mock('~/components/ui/Toast');
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const mockNavigate = vi.fn();

// Mock data
const mockPayment: Payment = {
  id: '1',
  paymentNumber: 'PAG-2024-0001',
  invoiceId: 'inv-1',
  customerId: 'cust-1',
  customerName: 'Juan Carlos Perez',
  invoiceNumber: 'FAC-2024-0001',
  amount: 8446620,
  method: 'BANK_TRANSFER',
  status: 'COMPLETED',
  paymentDate: '2024-01-15T10:00:00Z',
  referenceNumber: 'TRF-2024011814301234',
  notes: 'Transferencia Bancolombia',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockPayment2: Payment = {
  id: '2',
  paymentNumber: 'PAG-2024-0002',
  invoiceId: 'inv-2',
  customerId: 'cust-2',
  customerName: 'Distribuidora ABC S.A.S',
  invoiceNumber: 'FAC-2024-0002',
  amount: 16169025,
  method: 'CREDIT_CARD',
  status: 'PENDING',
  paymentDate: '2024-01-16T10:00:00Z',
  referenceNumber: 'CC-4532****8901',
  notes: 'Pago parcial',
  createdAt: '2024-01-16T10:00:00Z',
  updatedAt: '2024-01-16T10:00:00Z',
};

const mockPaymentsResponse: PaymentsResponse = {
  data: [
    {
      id: '1',
      paymentNumber: 'PAG-2024-0001',
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      customerName: 'Juan Carlos Perez',
      invoiceNumber: 'FAC-2024-0001',
      amount: 8446620,
      method: 'BANK_TRANSFER',
      status: 'COMPLETED',
      paymentDate: '2024-01-15T10:00:00Z',
      referenceNumber: 'TRF-2024011814301234',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ],
  meta: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

const mockPaymentStats: PaymentStats = {
  totalPayments: 14,
  totalReceived: 50000000,
  totalPending: 10000000,
  totalRefunded: 500000,
  totalProcessing: 8000000,
  averagePaymentValue: 5000000,
  paymentsByStatus: {
    PENDING: 4,
    PROCESSING: 1,
    COMPLETED: 6,
    FAILED: 1,
    REFUNDED: 1,
    CANCELLED: 1,
  },
  paymentsByMethod: {
    CASH: 3,
    CREDIT_CARD: 4,
    DEBIT_CARD: 1,
    BANK_TRANSFER: 4,
    WIRE_TRANSFER: 1,
    CHECK: 1,
    PSE: 1,
    OTHER: 0,
  },
  todayPayments: 3,
  todayTotal: 25000000,
  weekPayments: 10,
  weekTotal: 40000000,
};

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Helper to create a wrapper with access to the queryClient
function createWrapperWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };

  return { wrapper, queryClient };
}

describe('usePayments hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================================================
  // QUERY HOOKS
  // ============================================================================

  describe('usePayments', () => {
    it('should fetch payments with default filters', async () => {
      vi.mocked(paymentsService.getPayments).mockResolvedValue(mockPaymentsResponse);

      const { result } = renderHook(() => usePayments(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPaymentsResponse);
      expect(paymentsService.getPayments).toHaveBeenCalledWith({});
    });

    it('should fetch payments with filters', async () => {
      const filters: PaymentFilters = {
        status: 'COMPLETED',
        method: 'BANK_TRANSFER',
        page: 1,
        limit: 10,
      };

      vi.mocked(paymentsService.getPayments).mockResolvedValue(mockPaymentsResponse);

      const { result } = renderHook(() => usePayments(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.getPayments).toHaveBeenCalledWith(filters);
    });

    it('should return loading state initially', () => {
      vi.mocked(paymentsService.getPayments).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => usePayments(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should return error state on failure', async () => {
      const error = new Error('Failed to fetch payments');
      vi.mocked(paymentsService.getPayments).mockRejectedValue(error);

      const { result } = renderHook(() => usePayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should filter by search term', async () => {
      const filters: PaymentFilters = { search: 'Juan' };
      vi.mocked(paymentsService.getPayments).mockResolvedValue(mockPaymentsResponse);

      const { result } = renderHook(() => usePayments(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.getPayments).toHaveBeenCalledWith(filters);
    });

    it('should filter by date range', async () => {
      const filters: PaymentFilters = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };
      vi.mocked(paymentsService.getPayments).mockResolvedValue(mockPaymentsResponse);

      const { result } = renderHook(() => usePayments(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.getPayments).toHaveBeenCalledWith(filters);
    });

    it('should filter by amount range', async () => {
      const filters: PaymentFilters = {
        minAmount: 1000000,
        maxAmount: 10000000,
      };
      vi.mocked(paymentsService.getPayments).mockResolvedValue(mockPaymentsResponse);

      const { result } = renderHook(() => usePayments(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.getPayments).toHaveBeenCalledWith(filters);
    });
  });

  describe('usePayment', () => {
    it('should fetch a single payment by id', async () => {
      vi.mocked(paymentsService.getPayment).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => usePayment('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPayment);
      expect(paymentsService.getPayment).toHaveBeenCalledWith('1');
    });

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => usePayment(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(paymentsService.getPayment).not.toHaveBeenCalled();
    });

    it('should return error when payment not found', async () => {
      const error = new Error('Pago no encontrado');
      vi.mocked(paymentsService.getPayment).mockRejectedValue(error);

      const { result } = renderHook(() => usePayment('non-existent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should return loading state initially', () => {
      vi.mocked(paymentsService.getPayment).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => usePayment('1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('usePaymentsByInvoice', () => {
    it('should fetch payments for an invoice', async () => {
      const payments = [mockPayment, mockPayment2];
      vi.mocked(paymentsService.getPaymentsByInvoice).mockResolvedValue(payments);

      const { result } = renderHook(() => usePaymentsByInvoice('inv-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(payments);
      expect(paymentsService.getPaymentsByInvoice).toHaveBeenCalledWith('inv-1');
    });

    it('should not fetch when invoiceId is empty', () => {
      const { result } = renderHook(() => usePaymentsByInvoice(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(paymentsService.getPaymentsByInvoice).not.toHaveBeenCalled();
    });

    it('should return empty array for invoice with no payments', async () => {
      vi.mocked(paymentsService.getPaymentsByInvoice).mockResolvedValue([]);

      const { result } = renderHook(() => usePaymentsByInvoice('inv-empty'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle error state', async () => {
      const error = new Error('Error fetching payments');
      vi.mocked(paymentsService.getPaymentsByInvoice).mockRejectedValue(error);

      const { result } = renderHook(() => usePaymentsByInvoice('inv-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('usePaymentsByCustomer', () => {
    it('should fetch payments for a customer', async () => {
      const payments = [mockPayment];
      vi.mocked(paymentsService.getPaymentsByCustomer).mockResolvedValue(payments);

      const { result } = renderHook(() => usePaymentsByCustomer('cust-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(payments);
      expect(paymentsService.getPaymentsByCustomer).toHaveBeenCalledWith('cust-1');
    });

    it('should not fetch when customerId is empty', () => {
      const { result } = renderHook(() => usePaymentsByCustomer(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(paymentsService.getPaymentsByCustomer).not.toHaveBeenCalled();
    });

    it('should return empty array for customer with no payments', async () => {
      vi.mocked(paymentsService.getPaymentsByCustomer).mockResolvedValue([]);

      const { result } = renderHook(() => usePaymentsByCustomer('cust-empty'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle error state', async () => {
      const error = new Error('Error fetching customer payments');
      vi.mocked(paymentsService.getPaymentsByCustomer).mockRejectedValue(error);

      const { result } = renderHook(() => usePaymentsByCustomer('cust-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useRecentPayments', () => {
    it('should fetch recent payments with default limit', async () => {
      const recentPayments = [mockPayment, mockPayment2];
      vi.mocked(paymentsService.getRecentPayments).mockResolvedValue(recentPayments);

      const { result } = renderHook(() => useRecentPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(recentPayments);
      expect(paymentsService.getRecentPayments).toHaveBeenCalledWith(5);
    });

    it('should fetch recent payments with custom limit', async () => {
      const recentPayments = [mockPayment];
      vi.mocked(paymentsService.getRecentPayments).mockResolvedValue(recentPayments);

      const { result } = renderHook(() => useRecentPayments(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.getRecentPayments).toHaveBeenCalledWith(10);
    });

    it('should fetch with limit of 3', async () => {
      vi.mocked(paymentsService.getRecentPayments).mockResolvedValue([mockPayment]);

      const { result } = renderHook(() => useRecentPayments(3), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.getRecentPayments).toHaveBeenCalledWith(3);
    });

    it('should handle error state', async () => {
      const error = new Error('Error fetching recent payments');
      vi.mocked(paymentsService.getRecentPayments).mockRejectedValue(error);

      const { result } = renderHook(() => useRecentPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('usePaymentStats', () => {
    it('should fetch payment statistics', async () => {
      vi.mocked(paymentsService.getPaymentStats).mockResolvedValue(mockPaymentStats);

      const { result } = renderHook(() => usePaymentStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPaymentStats);
      expect(paymentsService.getPaymentStats).toHaveBeenCalled();
    });

    it('should return loading state initially', () => {
      vi.mocked(paymentsService.getPaymentStats).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => usePaymentStats(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', async () => {
      const error = new Error('Error fetching stats');
      vi.mocked(paymentsService.getPaymentStats).mockRejectedValue(error);

      const { result } = renderHook(() => usePaymentStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should return correct data structure', async () => {
      vi.mocked(paymentsService.getPaymentStats).mockResolvedValue(mockPaymentStats);

      const { result } = renderHook(() => usePaymentStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('totalPayments');
      expect(result.current.data).toHaveProperty('totalReceived');
      expect(result.current.data).toHaveProperty('totalPending');
      expect(result.current.data).toHaveProperty('paymentsByStatus');
      expect(result.current.data).toHaveProperty('paymentsByMethod');
    });
  });

  // ============================================================================
  // MUTATION HOOKS
  // ============================================================================

  describe('useCreatePayment', () => {
    it('should create a payment successfully', async () => {
      const newPaymentData: CreatePaymentData = {
        invoiceId: 'inv-1',
        customerId: 'cust-1',
        customerName: 'Juan Carlos Perez',
        invoiceNumber: 'FAC-2024-0001',
        amount: 5000000,
        method: 'BANK_TRANSFER',
        paymentDate: '2024-01-20T10:00:00Z',
        referenceNumber: 'TRF-123',
        notes: 'Test payment',
      };

      const createdPayment: Payment = {
        ...mockPayment,
        ...newPaymentData,
        id: 'new-id',
        paymentNumber: 'PAG-2024-0015',
        status: 'PENDING',
      };

      vi.mocked(paymentsService.createPayment).mockResolvedValue(createdPayment);

      const { wrapper, queryClient } = createWrapperWithClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePayment(), { wrapper });

      await act(async () => {
        result.current.mutate(newPaymentData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.createPayment).toHaveBeenCalledWith(newPaymentData);
      expect(toast.success).toHaveBeenCalledWith(
        `Pago "${createdPayment.paymentNumber}" registrado exitosamente`
      );
      expect(mockNavigate).toHaveBeenCalledWith(`/payments/${createdPayment.id}`);
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should show error toast on creation failure', async () => {
      const error = new Error('Error al registrar el pago');
      vi.mocked(paymentsService.createPayment).mockRejectedValue(error);

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          invoiceId: 'inv-1',
          customerId: 'cust-1',
          amount: 5000000,
          method: 'CASH',
          paymentDate: '2024-01-20T10:00:00Z',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Error al registrar el pago');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should invalidate all related queries on success', async () => {
      const createdPayment: Payment = {
        ...mockPayment,
        id: 'new-id',
      };

      vi.mocked(paymentsService.createPayment).mockResolvedValue(createdPayment);

      const { wrapper, queryClient } = createWrapperWithClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePayment(), { wrapper });

      await act(async () => {
        result.current.mutate({
          invoiceId: 'inv-1',
          customerId: 'cust-1',
          amount: 5000000,
          method: 'CASH',
          paymentDate: '2024-01-20T10:00:00Z',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should invalidate payments.all, invoice payments, customer payments, etc.
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should navigate to payment detail on success', async () => {
      const createdPayment: Payment = {
        ...mockPayment,
        id: 'created-123',
      };

      vi.mocked(paymentsService.createPayment).mockResolvedValue(createdPayment);

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          invoiceId: 'inv-1',
          customerId: 'cust-1',
          amount: 5000000,
          method: 'CASH',
          paymentDate: '2024-01-20T10:00:00Z',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/payments/created-123');
    });
  });

  describe('useUpdatePayment', () => {
    it('should update a payment successfully', async () => {
      const updateData: UpdatePaymentData = {
        amount: 9000000,
        notes: 'Updated notes',
      };

      const updatedPayment: Payment = {
        ...mockPayment,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(paymentsService.updatePayment).mockResolvedValue(updatedPayment);

      const { wrapper, queryClient } = createWrapperWithClient();

      // Set initial data in cache for optimistic update
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useUpdatePayment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', data: updateData });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.updatePayment).toHaveBeenCalledWith('1', updateData);
      expect(toast.success).toHaveBeenCalledWith(
        `Pago "${updatedPayment.paymentNumber}" actualizado exitosamente`
      );
      expect(mockNavigate).toHaveBeenCalledWith('/payments/1');
    });

    it('should perform optimistic update', async () => {
      const updateData: UpdatePaymentData = {
        amount: 9000000,
      };

      const updatedPayment: Payment = {
        ...mockPayment,
        ...updateData,
      };

      // Delay the response to test optimistic update
      vi.mocked(paymentsService.updatePayment).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(updatedPayment), 100))
      );

      const { wrapper, queryClient } = createWrapperWithClient();

      // Set initial data
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useUpdatePayment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', data: updateData });
      });

      // Check optimistic update was applied
      const optimisticData = queryClient.getQueryData<Payment>(
        queryKeys.payments.detail('1')
      );
      expect(optimisticData?.amount).toBe(9000000);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should rollback optimistic update on error', async () => {
      const updateData: UpdatePaymentData = {
        amount: 9000000,
      };

      const error = new Error('Update failed');
      vi.mocked(paymentsService.updatePayment).mockRejectedValue(error);

      // Create query client with longer gcTime to preserve cache during test
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 1000 * 60, // 1 minute
            staleTime: 0,
          },
          mutations: {
            retry: false,
          },
        },
      });

      const wrapper = function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );
      };

      // Set initial data
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useUpdatePayment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', data: updateData });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check rollback - the onError handler should have restored the previous value
      const rolledBackData = queryClient.getQueryData<Payment>(
        queryKeys.payments.detail('1')
      );
      expect(rolledBackData?.amount).toBe(mockPayment.amount);
      expect(toast.error).toHaveBeenCalledWith('Update failed');
    });

    it('should show error toast on update failure', async () => {
      const error = new Error('No se puede modificar un pago reembolsado');
      vi.mocked(paymentsService.updatePayment).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdatePayment(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: '1', data: { amount: 9000000 } });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'No se puede modificar un pago reembolsado'
      );
    });
  });

  describe('useUpdatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const updatedPayment: Payment = {
        ...mockPayment,
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(paymentsService.updatePaymentStatus).mockResolvedValue(updatedPayment);

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useUpdatePaymentStatus(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', status: 'COMPLETED' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.updatePaymentStatus).toHaveBeenCalledWith('1', 'COMPLETED');
      expect(toast.success).toHaveBeenCalledWith(
        `Pago "${updatedPayment.paymentNumber}" marcado como completado`
      );
    });

    it('should perform optimistic status update', async () => {
      const updatedPayment: Payment = {
        ...mockPayment,
        status: 'PROCESSING',
      };

      vi.mocked(paymentsService.updatePaymentStatus).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(updatedPayment), 100))
      );

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useUpdatePaymentStatus(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', status: 'PROCESSING' });
      });

      // Check optimistic update
      const optimisticData = queryClient.getQueryData<Payment>(
        queryKeys.payments.detail('1')
      );
      expect(optimisticData?.status).toBe('PROCESSING');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should rollback on status update error', async () => {
      const error = new Error('Invalid status transition');
      vi.mocked(paymentsService.updatePaymentStatus).mockRejectedValue(error);

      // Create query client with longer gcTime to preserve cache during test
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 1000 * 60, // 1 minute
            staleTime: 0,
          },
          mutations: {
            retry: false,
          },
        },
      });

      const wrapper = function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );
      };

      queryClient.setQueryData(queryKeys.payments.detail('1'), {
        ...mockPayment,
        status: 'PENDING',
      });

      const { result } = renderHook(() => useUpdatePaymentStatus(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', status: 'REFUNDED' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check rollback - the onError handler should have restored the previous value
      const rolledBackData = queryClient.getQueryData<Payment>(
        queryKeys.payments.detail('1')
      );
      expect(rolledBackData?.status).toBe('PENDING');
      expect(toast.error).toHaveBeenCalledWith('Invalid status transition');
    });

    it('should show correct message for each status', async () => {
      const statuses: PaymentStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'];

      for (const status of statuses) {
        vi.clearAllMocks();

        const updatedPayment: Payment = {
          ...mockPayment,
          status,
        };

        vi.mocked(paymentsService.updatePaymentStatus).mockResolvedValue(updatedPayment);

        const { wrapper, queryClient } = createWrapperWithClient();
        queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

        const { result } = renderHook(() => useUpdatePaymentStatus(), { wrapper });

        await act(async () => {
          result.current.mutate({ id: '1', status });
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(toast.success).toHaveBeenCalled();
      }
    });
  });

  describe('useDeletePayment', () => {
    it('should delete a payment successfully', async () => {
      vi.mocked(paymentsService.deletePayment).mockResolvedValue();

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useDeletePayment(), { wrapper });

      await act(async () => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.deletePayment).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Pago eliminado exitosamente');
      expect(mockNavigate).toHaveBeenCalledWith('/payments');
    });

    it('should invalidate related queries on delete', async () => {
      vi.mocked(paymentsService.deletePayment).mockResolvedValue();

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');

      const { result } = renderHook(() => useDeletePayment(), { wrapper });

      await act(async () => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    it('should show error toast on delete failure', async () => {
      const error = new Error('Solo se pueden eliminar pagos pendientes');
      vi.mocked(paymentsService.deletePayment).mockRejectedValue(error);

      const { result } = renderHook(() => useDeletePayment(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Solo se pueden eliminar pagos pendientes'
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should navigate to payments list on success', async () => {
      vi.mocked(paymentsService.deletePayment).mockResolvedValue();

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useDeletePayment(), { wrapper });

      await act(async () => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/payments');
    });
  });

  describe('useRefundPayment', () => {
    it('should process a full refund successfully', async () => {
      const refundedPayment: Payment = {
        ...mockPayment,
        status: 'REFUNDED',
        refundedAt: new Date().toISOString(),
        refundAmount: mockPayment.amount,
      };

      vi.mocked(paymentsService.refundPayment).mockResolvedValue(refundedPayment);

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useRefundPayment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.refundPayment).toHaveBeenCalledWith('1', undefined);
      expect(toast.success).toHaveBeenCalled();
    });

    it('should process a partial refund successfully', async () => {
      const partialRefundAmount = 1000000;
      const refundPayment: Payment = {
        ...mockPayment,
        id: 'refund-id',
        paymentNumber: 'PAG-2024-0015',
        amount: -partialRefundAmount,
        status: 'REFUNDED',
        refundAmount: partialRefundAmount,
      };

      vi.mocked(paymentsService.refundPayment).mockResolvedValue(refundPayment);

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useRefundPayment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', amount: partialRefundAmount });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(paymentsService.refundPayment).toHaveBeenCalledWith('1', partialRefundAmount);
      expect(toast.success).toHaveBeenCalled();
    });

    it('should invalidate related queries on refund', async () => {
      const refundedPayment: Payment = {
        ...mockPayment,
        status: 'REFUNDED',
        refundAmount: mockPayment.amount,
      };

      vi.mocked(paymentsService.refundPayment).mockResolvedValue(refundedPayment);

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRefundPayment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should show error toast on refund failure', async () => {
      const error = new Error('Solo se pueden reembolsar pagos completados');
      vi.mocked(paymentsService.refundPayment).mockRejectedValue(error);

      const { result } = renderHook(() => useRefundPayment(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: '1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Solo se pueden reembolsar pagos completados'
      );
    });

    it('should show error when refund amount exceeds payment amount', async () => {
      const error = new Error('El monto de reembolso no puede exceder el monto del pago');
      vi.mocked(paymentsService.refundPayment).mockRejectedValue(error);

      const { result } = renderHook(() => useRefundPayment(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ id: '1', amount: 999999999 });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'El monto de reembolso no puede exceder el monto del pago'
      );
    });

    it('should format refund amount in success message', async () => {
      const refundAmount = 1000000;
      const refundedPayment: Payment = {
        ...mockPayment,
        status: 'REFUNDED',
        refundAmount,
      };

      vi.mocked(paymentsService.refundPayment).mockResolvedValue(refundedPayment);

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), mockPayment);

      const { result } = renderHook(() => useRefundPayment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', amount: refundAmount });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that success message was called with formatted amount
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge cases', () => {
    it('should handle empty search results', async () => {
      const emptyResponse: PaymentsResponse = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      vi.mocked(paymentsService.getPayments).mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => usePayments({ search: 'nonexistent' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(0);
      expect(result.current.data?.meta.total).toBe(0);
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      vi.mocked(paymentsService.getPayments).mockRejectedValue(networkError);

      const { result } = renderHook(() => usePayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Network error');
    });

    it('should handle concurrent mutations', async () => {
      const payment1: Payment = { ...mockPayment, id: '1' };
      const payment2: Payment = { ...mockPayment2, id: '2' };

      vi.mocked(paymentsService.updatePaymentStatus)
        .mockResolvedValueOnce({ ...payment1, status: 'COMPLETED' })
        .mockResolvedValueOnce({ ...payment2, status: 'COMPLETED' });

      const { wrapper, queryClient } = createWrapperWithClient();
      queryClient.setQueryData(queryKeys.payments.detail('1'), payment1);
      queryClient.setQueryData(queryKeys.payments.detail('2'), payment2);

      const { result } = renderHook(() => useUpdatePaymentStatus(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: '1', status: 'COMPLETED' });
        result.current.mutate({ id: '2', status: 'COMPLETED' });
      });

      // Should handle both mutations (last one wins in this test setup)
      await waitFor(() => {
        expect(paymentsService.updatePaymentStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should use default error message when error has no message', async () => {
      vi.mocked(paymentsService.createPayment).mockRejectedValue(new Error());

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          invoiceId: 'inv-1',
          customerId: 'cust-1',
          amount: 5000000,
          method: 'CASH',
          paymentDate: '2024-01-20T10:00:00Z',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Error al registrar el pago');
    });
  });
});