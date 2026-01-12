import type {
  TDocumentDefinitions,
  Content,
  TableCell,
} from 'pdfmake/interfaces';

/**
 * Sales report data structure for PDF generation
 */
export interface SalesReportTemplateData {
  // Tenant info
  tenant: {
    name: string;
  };
  // Report period
  period: {
    fromDate: Date;
    toDate: Date;
  };
  // Summary
  summary: {
    totalSales: number;
    invoiceCount: number;
    averageInvoice: number;
    paidInvoices: number;
    unpaidInvoices: number;
  };
  // Sales by category
  categoryBreakdown: Array<{
    categoryName: string;
    totalSales: number;
    invoiceCount: number;
    percentage: number;
  }>;
  // Top selling products
  topProducts: Array<{
    productName: string;
    productSku: string;
    quantitySold: number;
    totalRevenue: number;
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
function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

/**
 * Creates a PDF document definition for a sales report
 */
export function createSalesReportTemplate(
  data: SalesReportTemplateData,
): TDocumentDefinitions {
  const content: Content[] = [];

  // Header
  content.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: data.tenant.name, style: 'companyName' },
          { text: 'Reporte de Ventas', style: 'reportTitle' },
        ],
      },
      {
        width: 'auto',
        alignment: 'right' as const,
        stack: [
          {
            text: `Periodo: ${formatShortDate(data.period.fromDate)} - ${formatShortDate(data.period.toDate)}`,
            style: 'periodInfo',
          },
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
        width: '33%',
        stack: [
          {
            text: formatCurrency(data.summary.totalSales),
            style: 'summaryValue',
          },
          { text: 'Total Ventas', style: 'summaryLabel' },
        ],
      },
      {
        width: '33%',
        stack: [
          {
            text: data.summary.invoiceCount.toString(),
            style: 'summaryValue',
          },
          { text: 'Facturas Emitidas', style: 'summaryLabel' },
        ],
      },
      {
        width: '34%',
        stack: [
          {
            text: formatCurrency(data.summary.averageInvoice),
            style: 'summaryValue',
          },
          { text: 'Promedio por Factura', style: 'summaryLabel' },
        ],
      },
    ],
  });

  content.push({
    margin: [0, 10, 0, 0],
    columns: [
      {
        width: '50%',
        stack: [
          {
            text: `${data.summary.paidInvoices} facturas pagadas`,
            style: 'summaryDetail',
          },
        ],
      },
      {
        width: '50%',
        stack: [
          {
            text: `${data.summary.unpaidInvoices} facturas pendientes`,
            style: 'summaryDetail',
          },
        ],
      },
    ],
  });

  // Category breakdown section
  if (data.categoryBreakdown.length > 0) {
    content.push({
      margin: [0, 30, 0, 0],
      text: 'VENTAS POR CATEGORIA',
      style: 'sectionTitle',
    });

    const categoryTableBody: TableCell[][] = [
      [
        { text: 'Categoria', style: 'tableHeader' },
        { text: 'Facturas', style: 'tableHeader', alignment: 'right' },
        { text: 'Total Ventas', style: 'tableHeader', alignment: 'right' },
        { text: '% del Total', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    for (const category of data.categoryBreakdown) {
      categoryTableBody.push([
        { text: category.categoryName, style: 'tableCell' },
        {
          text: category.invoiceCount.toString(),
          style: 'tableCell',
          alignment: 'right',
        },
        {
          text: formatCurrency(category.totalSales),
          style: 'tableCell',
          alignment: 'right',
        },
        {
          text: `${category.percentage.toFixed(1)}%`,
          style: 'tableCell',
          alignment: 'right',
        },
      ]);
    }

    content.push({
      margin: [0, 10, 0, 0],
      table: {
        headerRows: 1,
        widths: ['*', 80, 100, 80],
        body: categoryTableBody,
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

  // Top selling products section
  if (data.topProducts.length > 0) {
    content.push({
      margin: [0, 30, 0, 0],
      text: 'PRODUCTOS MAS VENDIDOS',
      style: 'sectionTitle',
    });

    const productsTableBody: TableCell[][] = [
      [
        { text: '#', style: 'tableHeader', alignment: 'center' },
        { text: 'Producto', style: 'tableHeader' },
        { text: 'SKU', style: 'tableHeader' },
        { text: 'Cantidad', style: 'tableHeader', alignment: 'right' },
        { text: 'Ingresos', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    data.topProducts.forEach((product, index) => {
      productsTableBody.push([
        {
          text: (index + 1).toString(),
          style: 'tableCell',
          alignment: 'center',
        },
        { text: product.productName, style: 'tableCell' },
        { text: product.productSku, style: 'tableCell' },
        {
          text: product.quantitySold.toString(),
          style: 'tableCell',
          alignment: 'right',
        },
        {
          text: formatCurrency(product.totalRevenue),
          style: 'tableCell',
          alignment: 'right',
        },
      ]);
    });

    content.push({
      margin: [0, 10, 0, 0],
      table: {
        headerRows: 1,
        widths: [30, '*', 80, 60, 100],
        body: productsTableBody,
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

  // Footer
  content.push({
    margin: [0, 40, 0, 0],
    text: 'Este reporte fue generado automaticamente por StockFlow',
    style: 'footer',
    alignment: 'center',
  });

  return {
    pageSize: 'LETTER',
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
      periodInfo: {
        fontSize: 11,
        color: '#333333',
      },
      generatedInfo: {
        fontSize: 9,
        color: '#666666',
        margin: [0, 5, 0, 0],
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#333333',
        margin: [0, 0, 0, 5],
      },
      summaryValue: {
        fontSize: 24,
        bold: true,
        color: '#2563eb',
      },
      summaryLabel: {
        fontSize: 10,
        color: '#666666',
        margin: [0, 5, 0, 0],
      },
      summaryDetail: {
        fontSize: 10,
        color: '#666666',
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#333333',
        fillColor: '#f3f4f6',
      },
      tableCell: {
        fontSize: 9,
        color: '#333333',
      },
      footer: {
        fontSize: 8,
        color: '#999999',
      },
    },
  };
}
