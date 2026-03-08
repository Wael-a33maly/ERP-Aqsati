// ============================================
// Export Model - نموذج التصدير
// ============================================

export type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json'
export type ExportEntity = 'customers' | 'products' | 'invoices' | 'payments' | 'installments' | 'inventory' | 'returns' | 'users' | 'branches' | 'companies'

// Export Options
export interface ExportOptions {
  format: ExportFormat
  entity: ExportEntity
  filters?: ExportFilters
  columns?: string[]
  includeHeaders?: boolean
  rtl?: boolean
  title?: string
  companyName?: string
}

export interface ExportFilters {
  companyId?: string
  branchId?: string
  status?: string
  startDate?: string
  endDate?: string
  [key: string]: any
}

// Response Types
export interface ExportResponse {
  success: boolean
  data: string
  filename: string
  mimeType: string
}

// Column Mapping
export interface ColumnMapping {
  [key: string]: string
}

export const ArabicColumnNames: ColumnMapping = {
  id: 'المعرف',
  name: 'الاسم',
  nameAr: 'الاسم بالعربية',
  code: 'الكود',
  sku: 'رمز المنتج',
  phone: 'الهاتف',
  phone2: 'الهاتف 2',
  email: 'البريد الإلكتروني',
  address: 'العنوان',
  nationalId: 'الرقم القومي',
  balance: 'الرصيد',
  creditLimit: 'حد الائتمان',
  status: 'الحالة',
  type: 'النوع',
  total: 'الإجمالي',
  subtotal: 'المجموع الفرعي',
  discount: 'الخصم',
  taxRate: 'نسبة الضريبة',
  taxAmount: 'قيمة الضريبة',
  paidAmount: 'المبلغ المدفوع',
  remainingAmount: 'المبلغ المتبقي',
  invoiceNumber: 'رقم الفاتورة',
  invoiceDate: 'تاريخ الفاتورة',
  paymentNumber: 'رقم الدفعة',
  paymentDate: 'تاريخ الدفع',
  method: 'طريقة الدفع',
  amount: 'المبلغ',
  quantity: 'الكمية',
  unitPrice: 'سعر الوحدة',
  costPrice: 'سعر التكلفة',
  sellPrice: 'سعر البيع',
  barcode: 'الباركود',
  description: 'الوصف',
  notes: 'ملاحظات',
  createdAt: 'تاريخ الإنشاء',
  updatedAt: 'تاريخ التحديث',
  dueDate: 'تاريخ الاستحقاق',
  installmentNumber: 'رقم القسط',
  contractNumber: 'رقم العقد',
  Company: 'الشركة',
  Branch: 'الفرع',
  User: 'المستخدم',
  Customer: 'العميل',
  Product: 'المنتج',
  Warehouse: 'المخزن',
  category: 'التصنيف',
  governorate: 'المحافظة',
  city: 'المدينة',
  area: 'المنطقة',
  active: 'نشط',
}

export const ArabicEntityNames: Record<string, string> = {
  customers: 'العملاء',
  products: 'المنتجات',
  invoices: 'الفواتير',
  payments: 'المدفوعات',
  installments: 'الأقساط',
  inventory: 'المخزون',
  returns: 'المرتجعات',
  users: 'المستخدمين',
  branches: 'الفروع',
  companies: 'الشركات',
}
