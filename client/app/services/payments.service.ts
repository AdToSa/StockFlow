import type {
  Payment,
  PaymentSummary,
  PaymentFilters,
  PaymentsResponse,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentStats,
  PaymentStatus,
  PaymentMethod,
} from '~/types/payment';

// Helper to get dates relative to "today"
const today = new Date();
const getDateDaysAgo = (days: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Mock data for development
const mockPayments: Payment[] = [
  {
    id: '1',
    paymentNumber: 'PAG-2024-0001',
    invoiceId: '1',
    customerId: '1',
    customerName: 'Juan Carlos Perez',
    invoiceNumber: 'FAC-2024-0001',
    amount: 8446620,
    method: 'BANK_TRANSFER',
    status: 'COMPLETED',
    paymentDate: getDateDaysAgo(3),
    referenceNumber: 'TRF-2024011814301234',
    notes: 'Transferencia Bancolombia',
    createdAt: getDateDaysAgo(3),
    updatedAt: getDateDaysAgo(3),
  },
  {
    id: '2',
    paymentNumber: 'PAG-2024-0002',
    invoiceId: '2',
    customerId: '2',
    customerName: 'Distribuidora ABC S.A.S',
    invoiceNumber: 'FAC-2024-0002',
    amount: 16169025,
    method: 'CREDIT_CARD',
    status: 'PENDING',
    paymentDate: getDateDaysAgo(1),
    referenceNumber: 'CC-4532****8901',
    notes: 'Pago parcial 50% - cuota 1 de 2',
    createdAt: getDateDaysAgo(1),
    updatedAt: getDateDaysAgo(1),
  },
  {
    id: '3',
    paymentNumber: 'PAG-2024-0003',
    invoiceId: '4',
    customerId: '4',
    customerName: 'Tech Solutions Ltda',
    invoiceNumber: 'FAC-2024-0004',
    amount: 5303790,
    method: 'CASH',
    status: 'COMPLETED',
    paymentDate: getDateDaysAgo(5),
    notes: 'Pago en efectivo en oficina',
    createdAt: getDateDaysAgo(5),
    updatedAt: getDateDaysAgo(5),
  },
  {
    id: '4',
    paymentNumber: 'PAG-2024-0004',
    invoiceId: '7',
    customerId: '2',
    customerName: 'Distribuidora ABC S.A.S',
    invoiceNumber: 'FAC-2024-0007',
    amount: 10583215,
    method: 'BANK_TRANSFER',
    status: 'COMPLETED',
    paymentDate: getDateDaysAgo(7),
    referenceNumber: 'TRF-2024011510001567',
    notes: 'Primera cuota navidad',
    createdAt: getDateDaysAgo(7),
    updatedAt: getDateDaysAgo(7),
  },
  {
    id: '5',
    paymentNumber: 'PAG-2024-0005',
    invoiceId: '7',
    customerId: '2',
    customerName: 'Distribuidora ABC S.A.S',
    invoiceNumber: 'FAC-2024-0007',
    amount: 10583215,
    method: 'BANK_TRANSFER',
    status: 'COMPLETED',
    paymentDate: getDateDaysAgo(2),
    referenceNumber: 'TRF-2024011810002345',
    notes: 'Segunda cuota navidad - pago completo',
    createdAt: getDateDaysAgo(2),
    updatedAt: getDateDaysAgo(2),
  },
  {
    id: '6',
    paymentNumber: 'PAG-2024-0006',
    invoiceId: '9',
    customerId: '3',
    customerName: 'Maria Elena Garcia',
    invoiceNumber: 'FAC-2024-0009',
    amount: 1137620,
    method: 'CASH',
    status: 'COMPLETED',
    paymentDate: getDateDaysAgo(4),
    notes: 'Pago en efectivo en tienda',
    createdAt: getDateDaysAgo(4),
    updatedAt: getDateDaysAgo(4),
  },
  {
    id: '7',
    paymentNumber: 'PAG-2024-0007',
    invoiceId: '8',
    customerId: '4',
    customerName: 'Tech Solutions Ltda',
    invoiceNumber: 'FAC-2024-0008',
    amount: 5948810,
    method: 'CREDIT_CARD',
    status: 'FAILED',
    paymentDate: getDateDaysAgo(0),
    referenceNumber: 'CC-5412****7890',
    notes: 'Rechazado - fondos insuficientes',
    createdAt: getDateDaysAgo(0),
    updatedAt: getDateDaysAgo(0),
  },
  {
    id: '8',
    paymentNumber: 'PAG-2024-0008',
    invoiceId: '3',
    customerId: '3',
    customerName: 'Maria Elena Garcia',
    invoiceNumber: 'FAC-2024-0003',
    amount: 1010905,
    method: 'DEBIT_CARD',
    status: 'PENDING',
    paymentDate: getDateDaysAgo(0),
    referenceNumber: 'DC-4000****1234',
    notes: 'Pago parcial factura vencida',
    createdAt: getDateDaysAgo(0),
    updatedAt: getDateDaysAgo(0),
  },
  {
    id: '9',
    paymentNumber: 'PAG-2024-0009',
    invoiceId: '1',
    customerId: '1',
    customerName: 'Juan Carlos Perez',
    invoiceNumber: 'FAC-2024-0001',
    amount: 500000,
    method: 'CASH',
    status: 'REFUNDED',
    paymentDate: getDateDaysAgo(10),
    notes: 'Devolucion parcial por producto defectuoso',
    refundedAt: getDateDaysAgo(8),
    refundAmount: 500000,
    createdAt: getDateDaysAgo(10),
    updatedAt: getDateDaysAgo(8),
  },
  {
    id: '10',
    paymentNumber: 'PAG-2024-0010',
    invoiceId: '10',
    customerId: '5',
    customerName: 'Roberto Andres Martinez',
    invoiceNumber: 'FAC-2024-0010',
    amount: 2736405,
    method: 'CHECK',
    status: 'PENDING',
    paymentDate: getDateDaysAgo(14),
    referenceNumber: 'CHQ-00045678',
    notes: 'Cheque posfechado - pendiente cobro',
    createdAt: getDateDaysAgo(14),
    updatedAt: getDateDaysAgo(14),
  },
  {
    id: '11',
    paymentNumber: 'PAG-2024-0011',
    invoiceId: '2',
    customerId: '2',
    customerName: 'Distribuidora ABC S.A.S',
    invoiceNumber: 'FAC-2024-0002',
    amount: 8084513,
    method: 'BANK_TRANSFER',
    status: 'PROCESSING',
    paymentDate: getDateDaysAgo(0),
    referenceNumber: 'TRF-2024012009003456',
    notes: 'Cuota 2 de 2 - en proceso de verificacion',
    createdAt: getDateDaysAgo(0),
    updatedAt: getDateDaysAgo(0),
  },
  {
    id: '12',
    paymentNumber: 'PAG-2024-0012',
    invoiceId: '5',
    customerId: '5',
    customerName: 'Roberto Andres Martinez',
    invoiceNumber: 'FAC-2024-0005',
    amount: 1069810,
    method: 'CREDIT_CARD',
    status: 'CANCELLED',
    paymentDate: getDateDaysAgo(12),
    referenceNumber: 'CC-4916****5678',
    notes: 'Cancelado - factura anulada',
    createdAt: getDateDaysAgo(12),
    updatedAt: getDateDaysAgo(11),
  },
  {
    id: '13',
    paymentNumber: 'PAG-2024-0013',
    invoiceId: '8',
    customerId: '4',
    customerName: 'Tech Solutions Ltda',
    invoiceNumber: 'FAC-2024-0008',
    amount: 11897620,
    method: 'WIRE_TRANSFER',
    status: 'PENDING',
    paymentDate: getDateDaysAgo(0),
    referenceNumber: 'WIRE-INT-20240120',
    notes: 'Transferencia internacional - pendiente confirmacion',
    createdAt: getDateDaysAgo(0),
    updatedAt: getDateDaysAgo(0),
  },
  {
    id: '14',
    paymentNumber: 'PAG-2024-0014',
    invoiceId: '6',
    customerId: '1',
    customerName: 'Juan Carlos Perez',
    invoiceNumber: 'FAC-2024-0006',
    amount: 2140810,
    method: 'PSE',
    status: 'COMPLETED',
    paymentDate: getDateDaysAgo(1),
    referenceNumber: 'PSE-2024011912345678',
    notes: 'Pago anticipado 50% - borrador confirmado',
    createdAt: getDateDaysAgo(1),
    updatedAt: getDateDaysAgo(1),
  },
];

// Convert Payment to PaymentSummary for list responses
function toPaymentSummary(payment: Payment): PaymentSummary {
  return {
    id: payment.id,
    paymentNumber: payment.paymentNumber,
    invoiceId: payment.invoiceId,
    customerId: payment.customerId,
    customerName: payment.customerName,
    invoiceNumber: payment.invoiceNumber,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    paymentDate: payment.paymentDate,
    referenceNumber: payment.referenceNumber,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

// Helper function to filter payments
function filterPayments(
  payments: Payment[],
  filters: PaymentFilters
): PaymentsResponse {
  let filtered = [...payments];

  // Search filter (payment number, customer name, invoice number, reference)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (payment) =>
        payment.paymentNumber.toLowerCase().includes(searchLower) ||
        payment.customerName?.toLowerCase().includes(searchLower) ||
        payment.invoiceNumber?.toLowerCase().includes(searchLower) ||
        payment.referenceNumber?.toLowerCase().includes(searchLower)
    );
  }

  // Invoice ID filter
  if (filters.invoiceId) {
    filtered = filtered.filter(
      (payment) => payment.invoiceId === filters.invoiceId
    );
  }

  // Customer ID filter
  if (filters.customerId) {
    filtered = filtered.filter(
      (payment) => payment.customerId === filters.customerId
    );
  }

  // Payment method filter
  if (filters.method) {
    filtered = filtered.filter((payment) => payment.method === filters.method);
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter((payment) => payment.status === filters.status);
  }

  // Date range filter (payment date)
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(
      (payment) => new Date(payment.paymentDate) >= startDate
    );
  }
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filtered = filtered.filter(
      (payment) => new Date(payment.paymentDate) <= endDate
    );
  }

  // Amount range filter
  if (filters.minAmount !== undefined) {
    filtered = filtered.filter((payment) => payment.amount >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter((payment) => payment.amount <= filters.maxAmount!);
  }

  // Sorting
  const sortBy = filters.sortBy || 'paymentDate';
  const sortOrder = filters.sortOrder || 'desc';
  filtered.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'paymentNumber':
        aValue = a.paymentNumber;
        bValue = b.paymentNumber;
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'paymentDate':
        aValue = new Date(a.paymentDate).getTime();
        bValue = new Date(b.paymentDate).getTime();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'method':
        aValue = a.method;
        bValue = b.method;
        break;
      case 'customerName':
        aValue = a.customerName || '';
        bValue = b.customerName || '';
        break;
      default:
        aValue = new Date(a.paymentDate).getTime();
        bValue = new Date(b.paymentDate).getTime();
    }

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
    data: paginatedData.map(toPaymentSummary),
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}

// Helper to generate next payment number
function generatePaymentNumber(): string {
  const year = new Date().getFullYear();
  const maxNumber = mockPayments.reduce((max, payment) => {
    const match = payment.paymentNumber.match(/PAG-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  return `PAG-${year}-${String(maxNumber + 1).padStart(4, '0')}`;
}

// Service
export const paymentsService = {
  // Get paginated payments with filters
  async getPayments(filters: PaymentFilters = {}): Promise<PaymentsResponse> {
    // In production, uncomment this:
    // const params = new URLSearchParams();
    // Object.entries(filters).forEach(([key, value]) => {
    //   if (value !== undefined && value !== null) {
    //     params.append(key, String(value));
    //   }
    // });
    // const { data } = await api.get<PaymentsResponse>(`/payments?${params.toString()}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 100));
    return filterPayments(mockPayments, filters);
  },

  // Get single payment by ID
  async getPayment(id: string): Promise<Payment> {
    // In production, uncomment this:
    // const { data } = await api.get<Payment>(`/payments/${id}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 100));
    const payment = mockPayments.find((p) => p.id === id);
    if (!payment) {
      throw new Error('Pago no encontrado');
    }
    return payment;
  },

  // Get payments by invoice ID
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    // In production, uncomment this:
    // const { data } = await api.get<Payment[]>(`/payments/invoice/${invoiceId}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 100));
    return mockPayments.filter((p) => p.invoiceId === invoiceId);
  },

  // Get payments by customer ID
  async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    // In production, uncomment this:
    // const { data } = await api.get<Payment[]>(`/payments/customer/${customerId}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 100));
    return mockPayments.filter((p) => p.customerId === customerId);
  },

  // Get recent payments for dashboard
  async getRecentPayments(limit: number = 5): Promise<Payment[]> {
    // In production, uncomment this:
    // const { data } = await api.get<Payment[]>(`/payments/recent?limit=${limit}`);
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 100));
    return [...mockPayments]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  },

  // Create new payment
  async createPayment(data: CreatePaymentData): Promise<Payment> {
    // In production, uncomment this:
    // const { data: newPayment } = await api.post<Payment>('/payments', data);
    // return newPayment;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 100));

    const paymentNumber = generatePaymentNumber();
    const now = new Date().toISOString();
    const newId = Math.random().toString(36).substring(2, 9);

    const newPayment: Payment = {
      id: newId,
      paymentNumber,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      method: data.method,
      status: data.status || 'PENDING',
      paymentDate: data.paymentDate || now,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    mockPayments.unshift(newPayment);

    // Note: In a real implementation, this would trigger an update to the invoice
    // to check if it's fully paid and update its status accordingly.
    // This logic would typically be handled by the backend.

    return newPayment;
  },

  // Update payment (limited fields)
  async updatePayment(id: string, data: UpdatePaymentData): Promise<Payment> {
    // In production, uncomment this:
    // const { data: updated } = await api.patch<Payment>(`/payments/${id}`, data);
    // return updated;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 100));

    const index = mockPayments.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Pago no encontrado');
    }

    const currentPayment = mockPayments[index];

    // Don't allow updates to refunded or cancelled payments
    if (currentPayment.status === 'REFUNDED' || currentPayment.status === 'CANCELLED') {
      throw new Error('No se puede modificar un pago reembolsado o cancelado');
    }

    // Don't allow updates to completed payments except notes
    if (currentPayment.status === 'COMPLETED') {
      // Only allow updating notes for completed payments
      mockPayments[index] = {
        ...currentPayment,
        notes: data.notes ?? currentPayment.notes,
        updatedAt: new Date().toISOString(),
      };
      return mockPayments[index];
    }

    mockPayments[index] = {
      ...currentPayment,
      amount: data.amount ?? currentPayment.amount,
      method: data.method ?? currentPayment.method,
      paymentDate: data.paymentDate ?? currentPayment.paymentDate,
      referenceNumber: data.referenceNumber ?? currentPayment.referenceNumber,
      notes: data.notes ?? currentPayment.notes,
      updatedAt: new Date().toISOString(),
    };

    return mockPayments[index];
  },

  // Update payment status only
  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
    // In production, uncomment this:
    // const { data } = await api.patch<Payment>(`/payments/${id}/status`, { status });
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 100));

    const index = mockPayments.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Pago no encontrado');
    }

    const currentStatus = mockPayments[index].status;

    // Validate status transitions
    if (currentStatus === 'REFUNDED') {
      throw new Error('No se puede cambiar el estado de un pago reembolsado');
    }
    if (currentStatus === 'CANCELLED') {
      throw new Error('No se puede cambiar el estado de un pago cancelado');
    }
    if (currentStatus === 'COMPLETED' && status !== 'REFUNDED' && status !== 'CANCELLED') {
      throw new Error('Un pago completado solo puede ser reembolsado o cancelado');
    }

    const now = new Date().toISOString();
    mockPayments[index] = {
      ...mockPayments[index],
      status,
      updatedAt: now,
      // If marking as completed, could trigger invoice status update in backend
    };

    return mockPayments[index];
  },

  // Delete payment (only PENDING allowed)
  async deletePayment(id: string): Promise<void> {
    // In production, uncomment this:
    // await api.delete(`/payments/${id}`);

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 100));

    const index = mockPayments.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Pago no encontrado');
    }

    // Only allow deletion of pending payments
    if (mockPayments[index].status !== 'PENDING') {
      throw new Error('Solo se pueden eliminar pagos pendientes');
    }

    mockPayments.splice(index, 1);
  },

  // Process refund (partial or full)
  async refundPayment(id: string, amount?: number): Promise<Payment> {
    // In production, uncomment this:
    // const { data } = await api.post<Payment>(`/payments/${id}/refund`, { amount });
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 100));

    const index = mockPayments.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Pago no encontrado');
    }

    const payment = mockPayments[index];

    // Only completed payments can be refunded
    if (payment.status !== 'COMPLETED') {
      throw new Error('Solo se pueden reembolsar pagos completados');
    }

    const refundAmount = amount ?? payment.amount;

    // Validate refund amount
    if (refundAmount <= 0) {
      throw new Error('El monto de reembolso debe ser mayor a cero');
    }
    if (refundAmount > payment.amount) {
      throw new Error('El monto de reembolso no puede exceder el monto del pago');
    }

    const now = new Date().toISOString();

    if (refundAmount === payment.amount) {
      // Full refund - update the payment status
      mockPayments[index] = {
        ...payment,
        status: 'REFUNDED',
        refundedAt: now,
        refundAmount,
        notes: payment.notes
          ? `${payment.notes} | Reembolso completo procesado`
          : 'Reembolso completo procesado',
        updatedAt: now,
      };
      return mockPayments[index];
    } else {
      // Partial refund - create a new negative payment record
      const refundPaymentNumber = generatePaymentNumber();
      const refundId = Math.random().toString(36).substring(2, 9);

      const refundPayment: Payment = {
        id: refundId,
        paymentNumber: refundPaymentNumber,
        invoiceId: payment.invoiceId,
        customerId: payment.customerId,
        customerName: payment.customerName,
        invoiceNumber: payment.invoiceNumber,
        amount: -refundAmount,
        method: payment.method,
        status: 'REFUNDED',
        paymentDate: now,
        referenceNumber: `REF-${payment.paymentNumber}`,
        notes: `Reembolso parcial del pago ${payment.paymentNumber}`,
        refundedAt: now,
        refundAmount,
        originalPaymentId: payment.id,
        createdAt: now,
        updatedAt: now,
      };

      mockPayments.unshift(refundPayment);

      // Update original payment notes
      mockPayments[index] = {
        ...payment,
        notes: payment.notes
          ? `${payment.notes} | Reembolso parcial: $${refundAmount.toLocaleString()}`
          : `Reembolso parcial: $${refundAmount.toLocaleString()}`,
        updatedAt: now,
      };

      return refundPayment;
    }
  },

  // Get payment statistics
  async getPaymentStats(): Promise<PaymentStats> {
    // In production, uncomment this:
    // const { data } = await api.get<PaymentStats>('/payments/stats');
    // return data;

    // Mock data for development
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 100));

    // Calculate stats
    const completedPayments = mockPayments.filter(
      (p) => p.status === 'COMPLETED' && p.amount > 0
    );
    const pendingPayments = mockPayments.filter((p) => p.status === 'PENDING');
    const failedPayments = mockPayments.filter((p) => p.status === 'FAILED');
    const refundedPayments = mockPayments.filter((p) => p.status === 'REFUNDED');
    const processingPayments = mockPayments.filter((p) => p.status === 'PROCESSING');

    const totalReceived = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = refundedPayments
      .filter((p) => p.refundAmount)
      .reduce((sum, p) => sum + (p.refundAmount || 0), 0);
    const totalProcessing = processingPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalPayments = mockPayments.filter((p) => p.amount > 0).length;

    const averagePaymentValue = totalPayments > 0
      ? Math.round(
          mockPayments
            .filter((p) => p.amount > 0)
            .reduce((sum, p) => sum + p.amount, 0) / totalPayments
        )
      : 0;

    const paymentsByStatus: Record<PaymentStatus, number> = {
      PENDING: pendingPayments.length,
      PROCESSING: processingPayments.length,
      COMPLETED: completedPayments.length,
      FAILED: failedPayments.length,
      REFUNDED: refundedPayments.length,
      CANCELLED: mockPayments.filter((p) => p.status === 'CANCELLED').length,
    };

    const paymentsByMethod: Record<PaymentMethod, number> = {
      CASH: mockPayments.filter((p) => p.method === 'CASH').length,
      CREDIT_CARD: mockPayments.filter((p) => p.method === 'CREDIT_CARD').length,
      DEBIT_CARD: mockPayments.filter((p) => p.method === 'DEBIT_CARD').length,
      BANK_TRANSFER: mockPayments.filter((p) => p.method === 'BANK_TRANSFER').length,
      WIRE_TRANSFER: mockPayments.filter((p) => p.method === 'WIRE_TRANSFER').length,
      CHECK: mockPayments.filter((p) => p.method === 'CHECK').length,
      PSE: mockPayments.filter((p) => p.method === 'PSE').length,
      OTHER: mockPayments.filter((p) => p.method === 'OTHER').length,
    };

    // Get today's payments
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayPayments = mockPayments.filter(
      (p) => new Date(p.paymentDate) >= todayStart && p.amount > 0
    );
    const todayTotal = todayPayments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    // Get this week's payments
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekPayments = mockPayments.filter(
      (p) => new Date(p.paymentDate) >= weekStart && p.amount > 0
    );
    const weekTotal = weekPayments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments,
      totalReceived,
      totalPending,
      totalRefunded,
      totalProcessing,
      averagePaymentValue,
      paymentsByStatus,
      paymentsByMethod,
      todayPayments: todayPayments.length,
      todayTotal,
      weekPayments: weekPayments.length,
      weekTotal,
    };
  },
};
