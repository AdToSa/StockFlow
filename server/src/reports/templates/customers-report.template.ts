import type {
  TDocumentDefinitions,
  Content,
  TableCell,
} from 'pdfmake/interfaces';

/**
 * Customers report data structure for PDF generation
 */
export interface CustomersReportTemplateData {
  // Tenant info
  tenant: {
    name: string;
  };
  // Summary
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    customersWithPurchases: number;
    totalRevenue: number;
  };
  // Customer list with purchase info
  customers: Array<{
    name: string;
    email: string | null;
    phone: string | null;
    documentType: string;
    documentNumber: string;
    city: string | null;
    status: string;
    totalPurchases: number;
    invoiceCount: number;
    lastPurchaseDate: Date | null;
  }>;
  // Top customers
  topCustomers: Array<{
    name: string;
    documentNumber: string;
    totalPurchases: number;
    invoiceCount: number;
  }>;
  // Generated date
  generatedAt: Date;
}

/**
 * Formats a number as currency (Colombian Pesos)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a date in Spanish locale
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Formats a short date
 */
function formatShortDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

/**
 * Translates customer status to Spanish
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
  };
  return translations[status] || status;
}

/**
 * Creates a PDF document definition for a customers report
 */
export function createCustomersReportTemplate(
  data: CustomersReportTemplateData,
): TDocumentDefinitions {
  const content: Content[] = [];

  // Header
  content.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: data.tenant.name, style: 'companyName' },
          { text: 'Reporte de Clientes', style: 'reportTitle' },
        ],
      },
      {
        width: 'auto',
        alignment: 'right' as const,
        stack: [
          {
            text: `Generado: ${formatDate(data.generatedAt)}`,
            style: 'generatedInfo',
          },
        ],
      },
    ],
  });

  // Divider
  content.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 10,
        x2: 515,
        y2: 10,
        lineWidth: 2,
        lineColor: '#2563eb',
      },
    ],
  });

  // Summary section
  content.push({
    margin: [0, 20, 0, 0],
    text: 'RESUMEN GENERAL',
    style: 'sectionTitle',
  });

  content.push({
    margin: [0, 10, 0, 0],
    columns: [
      {
        width: '25%',
        stack: [
          {
            text: data.summary.totalCustomers.toString(),
            style: 'summaryValue',
          },
          { text: 'Total Clientes', style: 'summaryLabel' },
        ],
      },
      {
        width: '25%',
        stack: [
          {
            text: data.summary.activeCustomers.toString(),
            style: 'summaryValue',
          },
          { text: 'Clientes Activos', style: 'summaryLabel' },
        ],
      },
      {
        width: '25%',
        stack: [
          {
            text: data.summary.customersWithPurchases.toString(),
            style: 'summaryValue',
          },
          { text: 'Con Compras', style: 'summaryLabel' },
        ],
      },
      {
        width: '25%',
        stack: [
          {
            text: formatCurrency(data.summary.totalRevenue),
            style: 'summaryValue',
          },
          { text: 'Ingresos Totales', style: 'summaryLabel' },
        ],
      },
    ],
  });

  // Top customers section
  if (data.topCustomers.length > 0) {
    content.push({
      margin: [0, 30, 0, 0],
      text: 'MEJORES CLIENTES',
      style: 'sectionTitle',
    });

    const topCustomersTableBody: TableCell[][] = [
      [
        { text: '#', style: 'tableHeader', alignment: 'center' },
        { text: 'Cliente', style: 'tableHeader' },
        { text: 'Documento', style: 'tableHeader' },
        { text: 'Facturas', style: 'tableHeader', alignment: 'right' },
        { text: 'Total Compras', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    data.topCustomers.forEach((customer, index) => {
      topCustomersTableBody.push([
        {
          text: (index + 1).toString(),
          style: 'tableCell',
          alignment: 'center',
        },
        { text: customer.name, style: 'tableCell' },
        { text: customer.documentNumber, style: 'tableCell' },
        {
          text: customer.invoiceCount.toString(),
          style: 'tableCell',
          alignment: 'right',
        },
        {
          text: formatCurrency(customer.totalPurchases),
          style: 'tableCellHighlight',
          alignment: 'right',
        },
      ]);
    });

    content.push({
      margin: [0, 10, 0, 0],
      table: {
        headerRows: 1,
        widths: [30, '*', 100, 60, 100],
        body: topCustomersTableBody,
      },
      layout: {
        hLineWidth: (i: number, node: { table: { body: unknown[] } }) => {
          if (i === 0 || i === node.table.body.length) return 1;
          return i === 1 ? 1 : 0.5;
        },
        vLineWidth: () => 0,
        hLineColor: (i: number) => (i === 1 ? '#333333' : '#cccccc'),
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
    });
  }

  // Full customer list (separate page)
  content.push({
    pageBreak: 'before' as const,
    text: 'LISTADO COMPLETO DE CLIENTES',
    style: 'sectionTitle',
  });

  const customersTableBody: TableCell[][] = [
    [
      { text: 'Cliente', style: 'tableHeaderSmall' },
      { text: 'Documento', style: 'tableHeaderSmall' },
      { text: 'Email', style: 'tableHeaderSmall' },
      { text: 'Telefono', style: 'tableHeaderSmall' },
      { text: 'Ciudad', style: 'tableHeaderSmall' },
      { text: 'Facturas', style: 'tableHeaderSmall', alignment: 'right' },
      { text: 'Total Compras', style: 'tableHeaderSmall', alignment: 'right' },
      { text: 'Ultima Compra', style: 'tableHeaderSmall' },
      { text: 'Estado', style: 'tableHeaderSmall' },
    ],
  ];

  for (const customer of data.customers) {
    customersTableBody.push([
      { text: customer.name, style: 'tableCellSmall' },
      {
        text: `${customer.documentType}: ${customer.documentNumber}`,
        style: 'tableCellSmall',
      },
      { text: customer.email || 'N/A', style: 'tableCellSmall' },
      { text: customer.phone || 'N/A', style: 'tableCellSmall' },
      { text: customer.city || 'N/A', style: 'tableCellSmall' },
      {
        text: customer.invoiceCount.toString(),
        style: 'tableCellSmall',
        alignment: 'right',
      },
      {
        text: formatCurrency(customer.totalPurchases),
        style: 'tableCellSmall',
        alignment: 'right',
      },
      {
        text: formatShortDate(customer.lastPurchaseDate),
        style: 'tableCellSmall',
      },
      { text: translateStatus(customer.status), style: 'tableCellSmall' },
    ]);
  }

  content.push({
    margin: [0, 10, 0, 0],
    table: {
      headerRows: 1,
      widths: ['*', 70, 90, 65, 55, 45, 70, 60, 45],
      body: customersTableBody,
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) => {
        if (i === 0 || i === node.table.body.length) return 1;
        return i === 1 ? 1 : 0.5;
      },
      vLineWidth: () => 0,
      hLineColor: (i: number) => (i === 1 ? '#333333' : '#cccccc'),
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  });

  // Footer
  content.push({
    margin: [0, 30, 0, 0],
    text: 'Este reporte fue generado automaticamente por StockFlow',
    style: 'footer',
    alignment: 'center',
  });

  return {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [40, 40, 40, 40],
    content,
    styles: {
      companyName: {
        fontSize: 18,
        bold: true,
        color: '#333333',
      },
      reportTitle: {
        fontSize: 14,
        color: '#2563eb',
        margin: [0, 5, 0, 0],
      },
      generatedInfo: {
        fontSize: 10,
        color: '#666666',
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#333333',
        margin: [0, 0, 0, 5],
      },
      summaryValue: {
        fontSize: 20,
        bold: true,
        color: '#2563eb',
      },
      summaryLabel: {
        fontSize: 10,
        color: '#666666',
        margin: [0, 5, 0, 0],
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#333333',
        fillColor: '#f3f4f6',
      },
      tableHeaderSmall: {
        fontSize: 8,
        bold: true,
        color: '#333333',
        fillColor: '#f3f4f6',
      },
      tableCell: {
        fontSize: 9,
        color: '#333333',
      },
      tableCellSmall: {
        fontSize: 8,
        color: '#333333',
      },
      tableCellHighlight: {
        fontSize: 9,
        color: '#2563eb',
        bold: true,
      },
      footer: {
        fontSize: 8,
        color: '#999999',
      },
    },
  };
}
