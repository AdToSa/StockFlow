import type {
  TDocumentDefinitions,
  Content,
  TableCell,
} from 'pdfmake/interfaces';

/**
 * Inventory report data structure for PDF generation
 */
export interface InventoryReportTemplateData {
  // Tenant info
  tenant: {
    name: string;
  };
  // Summary
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    activeProducts: number;
  };
  // All products with stock info
  products: Array<{
    name: string;
    sku: string;
    categoryName: string | null;
    stock: number;
    minStock: number;
    costPrice: number;
    salePrice: number;
    stockValue: number;
    status: string;
    isLowStock: boolean;
    isOutOfStock: boolean;
  }>;
  // Low stock alerts
  lowStockProducts: Array<{
    name: string;
    sku: string;
    stock: number;
    minStock: number;
  }>;
  // Out of stock items
  outOfStockProducts: Array<{
    name: string;
    sku: string;
    minStock: number;
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
 * Translates product status to Spanish
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    OUT_OF_STOCK: 'Sin stock',
  };
  return translations[status] || status;
}

/**
 * Creates a PDF document definition for an inventory report
 */
export function createInventoryReportTemplate(
  data: InventoryReportTemplateData,
): TDocumentDefinitions {
  const content: Content[] = [];

  // Header
  content.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: data.tenant.name, style: 'companyName' },
          { text: 'Reporte de Inventario', style: 'reportTitle' },
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
    text: 'RESUMEN DE INVENTARIO',
    style: 'sectionTitle',
  });

  content.push({
    margin: [0, 10, 0, 0],
    columns: [
      {
        width: '33%',
        stack: [
          {
            text: data.summary.totalProducts.toString(),
            style: 'summaryValue',
          },
          { text: 'Total Productos', style: 'summaryLabel' },
        ],
      },
      {
        width: '33%',
        stack: [
          {
            text: formatCurrency(data.summary.totalStockValue),
            style: 'summaryValue',
          },
          { text: 'Valor del Inventario', style: 'summaryLabel' },
        ],
      },
      {
        width: '34%',
        stack: [
          {
            text: data.summary.activeProducts.toString(),
            style: 'summaryValue',
          },
          { text: 'Productos Activos', style: 'summaryLabel' },
        ],
      },
    ],
  });

  // Alert indicators
  content.push({
    margin: [0, 15, 0, 0],
    columns: [
      {
        width: '50%',
        stack: [
          {
            text: `${data.summary.lowStockCount} productos con stock bajo`,
            style: data.summary.lowStockCount > 0 ? 'alertWarning' : 'alertOk',
          },
        ],
      },
      {
        width: '50%',
        stack: [
          {
            text: `${data.summary.outOfStockCount} productos sin stock`,
            style: data.summary.outOfStockCount > 0 ? 'alertDanger' : 'alertOk',
          },
        ],
      },
    ],
  });

  // Low stock alerts section
  if (data.lowStockProducts.length > 0) {
    content.push({
      margin: [0, 25, 0, 0],
      text: 'ALERTAS DE STOCK BAJO',
      style: 'sectionTitleWarning',
    });

    const lowStockTableBody: TableCell[][] = [
      [
        { text: 'Producto', style: 'tableHeader' },
        { text: 'SKU', style: 'tableHeader' },
        { text: 'Stock Actual', style: 'tableHeader', alignment: 'right' },
        { text: 'Stock Minimo', style: 'tableHeader', alignment: 'right' },
        { text: 'Diferencia', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    for (const product of data.lowStockProducts) {
      const difference = product.minStock - product.stock;
      lowStockTableBody.push([
        { text: product.name, style: 'tableCell' },
        { text: product.sku, style: 'tableCell' },
        {
          text: product.stock.toString(),
          style: 'tableCellWarning',
          alignment: 'right',
        },
        {
          text: product.minStock.toString(),
          style: 'tableCell',
          alignment: 'right',
        },
        {
          text: `-${difference}`,
          style: 'tableCellDanger',
          alignment: 'right',
        },
      ]);
    }

    content.push({
      margin: [0, 10, 0, 0],
      table: {
        headerRows: 1,
        widths: ['*', 80, 80, 80, 70],
        body: lowStockTableBody,
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

  // Out of stock section
  if (data.outOfStockProducts.length > 0) {
    content.push({
      margin: [0, 25, 0, 0],
      text: 'PRODUCTOS SIN STOCK',
      style: 'sectionTitleDanger',
    });

    const outOfStockTableBody: TableCell[][] = [
      [
        { text: 'Producto', style: 'tableHeader' },
        { text: 'SKU', style: 'tableHeader' },
        {
          text: 'Stock Minimo Recomendado',
          style: 'tableHeader',
          alignment: 'right',
        },
      ],
    ];

    for (const product of data.outOfStockProducts) {
      outOfStockTableBody.push([
        { text: product.name, style: 'tableCellDanger' },
        { text: product.sku, style: 'tableCell' },
        {
          text: product.minStock.toString(),
          style: 'tableCell',
          alignment: 'right',
        },
      ]);
    }

    content.push({
      margin: [0, 10, 0, 0],
      table: {
        headerRows: 1,
        widths: ['*', 100, 150],
        body: outOfStockTableBody,
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

  // Full inventory list (separate page)
  content.push({
    pageBreak: 'before' as const,
    text: 'LISTADO COMPLETO DE INVENTARIO',
    style: 'sectionTitle',
  });

  const inventoryTableBody: TableCell[][] = [
    [
      { text: 'Producto', style: 'tableHeaderSmall' },
      { text: 'SKU', style: 'tableHeaderSmall' },
      { text: 'Categoria', style: 'tableHeaderSmall' },
      { text: 'Stock', style: 'tableHeaderSmall', alignment: 'right' },
      { text: 'Min', style: 'tableHeaderSmall', alignment: 'right' },
      { text: 'Costo', style: 'tableHeaderSmall', alignment: 'right' },
      { text: 'Valor Stock', style: 'tableHeaderSmall', alignment: 'right' },
      { text: 'Estado', style: 'tableHeaderSmall' },
    ],
  ];

  for (const product of data.products) {
    const stockStyle = product.isOutOfStock
      ? 'tableCellDanger'
      : product.isLowStock
        ? 'tableCellWarning'
        : 'tableCellSmall';

    inventoryTableBody.push([
      { text: product.name, style: 'tableCellSmall' },
      { text: product.sku, style: 'tableCellSmall' },
      {
        text: product.categoryName || 'Sin categoria',
        style: 'tableCellSmall',
      },
      { text: product.stock.toString(), style: stockStyle, alignment: 'right' },
      {
        text: product.minStock.toString(),
        style: 'tableCellSmall',
        alignment: 'right',
      },
      {
        text: formatCurrency(product.costPrice),
        style: 'tableCellSmall',
        alignment: 'right',
      },
      {
        text: formatCurrency(product.stockValue),
        style: 'tableCellSmall',
        alignment: 'right',
      },
      { text: translateStatus(product.status), style: 'tableCellSmall' },
    ]);
  }

  content.push({
    margin: [0, 10, 0, 0],
    table: {
      headerRows: 1,
      widths: ['*', 55, 70, 35, 30, 60, 70, 50],
      body: inventoryTableBody,
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
      sectionTitleWarning: {
        fontSize: 12,
        bold: true,
        color: '#d97706',
        margin: [0, 0, 0, 5],
      },
      sectionTitleDanger: {
        fontSize: 12,
        bold: true,
        color: '#dc2626',
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
      alertWarning: {
        fontSize: 11,
        color: '#d97706',
        bold: true,
      },
      alertDanger: {
        fontSize: 11,
        color: '#dc2626',
        bold: true,
      },
      alertOk: {
        fontSize: 11,
        color: '#16a34a',
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
      tableCellWarning: {
        fontSize: 9,
        color: '#d97706',
        bold: true,
      },
      tableCellDanger: {
        fontSize: 9,
        color: '#dc2626',
        bold: true,
      },
      footer: {
        fontSize: 8,
        color: '#999999',
      },
    },
  };
}
