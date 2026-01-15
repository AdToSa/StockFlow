import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, FileText, Plus, Trash2, Package } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Route } from './+types/_app.invoices.new';
import { cn, formatCurrency, generateId } from '~/lib/utils';
import { useCreateInvoice } from '~/hooks/useInvoices';
import { useCustomers } from '~/hooks/useCustomers';
import { useProducts } from '~/hooks/useProducts';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';
import { Select } from '~/components/ui/Select';
import type { InvoiceStatus } from '~/types/invoice';

// Meta for SEO
export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Nueva Factura - StockFlow' },
    { name: 'description', content: 'Crear una nueva factura' },
  ];
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// Line item schema
const lineItemSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, 'Seleccione un producto'),
  description: z.string().min(1, 'La descripcion es requerida'),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  discount: z.number().min(0).max(100),
  tax: z.number().min(0).max(100), // Default IVA in Colombia
});

// Form schema
const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Seleccione un cliente'),
  issueDate: z.string().min(1, 'La fecha de emision es requerida'),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  notes: z.string().max(500, 'Maximo 500 caracteres').optional(),
  items: z.array(lineItemSchema).min(1, 'Debe agregar al menos un item'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type LineItem = z.infer<typeof lineItemSchema>;

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get date 30 days from now
function getDefaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

// Calculate line item totals
function calculateLineItemTotals(item: LineItem) {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = subtotal * (item.discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (item.tax / 100);
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
}

// Calculate invoice totals
function calculateInvoiceTotals(items: LineItem[]) {
  return items.reduce(
    (acc, item) => {
      const { subtotal, discountAmount, taxAmount, total } = calculateLineItemTotals(item);
      return {
        subtotal: acc.subtotal + subtotal,
        discountAmount: acc.discountAmount + discountAmount,
        taxAmount: acc.taxAmount + taxAmount,
        total: acc.total + total,
      };
    },
    { subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 }
  );
}

// Create empty line item
function createEmptyLineItem(): LineItem {
  return {
    id: generateId(),
    productId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    tax: 19,
  };
}

export default function NewInvoicePage() {
  const [saveAsStatus, setSaveAsStatus] = useState<InvoiceStatus>('PENDING');

  // Queries
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 100 });
  const createInvoice = useCreateInvoice();

  // Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      issueDate: getTodayDate(),
      dueDate: getDefaultDueDate(),
      notes: '',
      items: [createEmptyLineItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  // Memoized options
  const customerOptions = useMemo(
    () => [
      { value: '', label: 'Seleccionar cliente...' },
      ...(customersData?.data || [])
        .filter((c) => c.isActive)
        .map((c) => ({ value: c.id, label: c.name })),
    ],
    [customersData]
  );

  const productOptions = useMemo(
    () => [
      { value: '', label: 'Seleccionar producto...' },
      ...(productsData?.data || [])
        .filter((p) => p.status === 'ACTIVE')
        .map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
    ],
    [productsData]
  );

  // Product lookup map
  const productsMap = useMemo(() => {
    const map = new Map<string, { name: string; price: number; description?: string }>();
    (productsData?.data || []).forEach((p) => {
      map.set(p.id, { name: p.name, price: p.price, description: p.description });
    });
    return map;
  }, [productsData]);

  // Handle product selection - auto-fill price and description
  const handleProductChange = useCallback(
    (index: number, productId: string) => {
      const product = productsMap.get(productId);
      if (product) {
        setValue(`items.${index}.productId`, productId);
        setValue(`items.${index}.unitPrice`, product.price);
        setValue(`items.${index}.description`, product.description || product.name);
      }
    },
    [productsMap, setValue]
  );

  // Add new line item
  const handleAddItem = () => {
    append(createEmptyLineItem());
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Calculate totals
  const totals = useMemo(() => calculateInvoiceTotals(watchedItems || []), [watchedItems]);

  // Submit handler
  const onSubmit = (data: InvoiceFormData) => {
    createInvoice.mutate({
      customerId: data.customerId,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      notes: data.notes,
      status: saveAsStatus,
      items: data.items.map((item) => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
      })),
    });
  };

  const handleSaveAsDraft = () => {
    setSaveAsStatus('DRAFT');
  };

  const handleSaveAsPending = () => {
    setSaveAsStatus('PENDING');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-4">
          <Link to="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
              Nueva Factura
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Crea una nueva factura para un cliente
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Dates */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Informacion de la Factura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Cliente *
                    </label>
                    <Controller
                      name="customerId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={customerOptions}
                          value={field.value}
                          onChange={field.onChange}
                          error={!!errors.customerId}
                          disabled={isLoadingCustomers}
                        />
                      )}
                    />
                    {errors.customerId && (
                      <p className="mt-1 text-sm text-error-500">{errors.customerId.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Fecha de Emision *
                      </label>
                      <Input
                        {...register('issueDate')}
                        type="date"
                        error={!!errors.issueDate}
                      />
                      {errors.issueDate && (
                        <p className="mt-1 text-sm text-error-500">{errors.issueDate.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Fecha de Vencimiento *
                      </label>
                      <Input
                        {...register('dueDate')}
                        type="date"
                        error={!!errors.dueDate}
                      />
                      {errors.dueDate && (
                        <p className="mt-1 text-sm text-error-500">{errors.dueDate.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Line Items */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Items de la Factura</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Agregar Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {errors.items?.message && (
                    <p className="mb-4 text-sm text-error-500">{errors.items.message}</p>
                  )}

                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const item = watchedItems?.[index];
                      const itemTotals = item ? calculateLineItemTotals(item) : { subtotal: 0, total: 0 };

                      return (
                        <div
                          key={field.id}
                          className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-4"
                        >
                          {/* Item header */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Item #{index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              disabled={fields.length === 1}
                              className="text-error-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Product selection */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Producto *
                              </label>
                              <Controller
                                name={`items.${index}.productId`}
                                control={control}
                                render={({ field: selectField }) => (
                                  <Select
                                    options={productOptions}
                                    value={selectField.value}
                                    onChange={(value) => handleProductChange(index, value)}
                                    error={!!errors.items?.[index]?.productId}
                                    disabled={isLoadingProducts}
                                  />
                                )}
                              />
                              {errors.items?.[index]?.productId && (
                                <p className="mt-1 text-sm text-error-500">
                                  {errors.items[index]?.productId?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Descripcion *
                              </label>
                              <Input
                                {...register(`items.${index}.description`)}
                                placeholder="Descripcion del item"
                                error={!!errors.items?.[index]?.description}
                              />
                              {errors.items?.[index]?.description && (
                                <p className="mt-1 text-sm text-error-500">
                                  {errors.items[index]?.description?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quantity, Price, Discount, Tax */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Cantidad *
                              </label>
                              <Input
                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                type="number"
                                min="1"
                                step="1"
                                error={!!errors.items?.[index]?.quantity}
                              />
                              {errors.items?.[index]?.quantity && (
                                <p className="mt-1 text-sm text-error-500">
                                  {errors.items[index]?.quantity?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Precio Unit. *
                              </label>
                              <Input
                                {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                type="number"
                                min="0"
                                step="100"
                                error={!!errors.items?.[index]?.unitPrice}
                              />
                              {errors.items?.[index]?.unitPrice && (
                                <p className="mt-1 text-sm text-error-500">
                                  {errors.items[index]?.unitPrice?.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Descuento %
                              </label>
                              <Input
                                {...register(`items.${index}.discount`, { valueAsNumber: true })}
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                error={!!errors.items?.[index]?.discount}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                IVA %
                              </label>
                              <Input
                                {...register(`items.${index}.tax`, { valueAsNumber: true })}
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                error={!!errors.items?.[index]?.tax}
                              />
                            </div>
                          </div>

                          {/* Item totals */}
                          <div className="flex justify-end gap-6 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="text-right">
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">Subtotal</p>
                              <p className="font-medium text-neutral-900 dark:text-white">
                                {formatCurrency(itemTotals.subtotal)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total</p>
                              <p className="font-semibold text-neutral-900 dark:text-white">
                                {formatCurrency(itemTotals.total)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty state */}
                  {fields.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-3" />
                      <p className="text-neutral-500 dark:text-neutral-400">
                        No hay items en la factura
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                        className="mt-3"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar primer item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    {...register('notes')}
                    placeholder="Notas adicionales para la factura (opcional)"
                    rows={4}
                    className={cn(
                      'w-full rounded-lg border border-neutral-300 dark:border-neutral-600',
                      'bg-white dark:bg-neutral-900 px-4 py-2.5',
                      'text-neutral-900 dark:text-white placeholder:text-neutral-400',
                      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
                      'transition-colors resize-none'
                    )}
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-error-500">{errors.notes.message}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totals Summary */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
                    <span className="text-neutral-900 dark:text-white">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Descuento</span>
                    <span className="text-error-500">
                      -{formatCurrency(totals.discountAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">IVA</span>
                    <span className="text-neutral-900 dark:text-white">
                      {formatCurrency(totals.taxAmount)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-white">Total</span>
                      <span className="text-xl font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isSubmitting || (createInvoice.isPending && saveAsStatus === 'PENDING')}
                    onClick={handleSaveAsPending}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Crear Factura
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    isLoading={isSubmitting || (createInvoice.isPending && saveAsStatus === 'DRAFT')}
                    onClick={handleSaveAsDraft}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar como Borrador
                  </Button>
                  <Link to="/invoices" className="block">
                    <Button type="button" variant="ghost" className="w-full">
                      Cancelar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Help Info */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                    Informacion
                  </h4>
                  <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
                    <li>- Las facturas en borrador pueden ser editadas</li>
                    <li>- Las facturas pendientes estan listas para cobro</li>
                    <li>- El IVA por defecto es 19%</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}