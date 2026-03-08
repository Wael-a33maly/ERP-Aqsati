import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ===================== TYPES =====================
type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json'

interface ExportOptions {
  format: ExportFormat
  entity: string
  filters?: any
  columns?: string[]
  includeHeaders?: boolean
  rtl?: boolean
  title?: string
  companyName?: string
}

// ===================== MAIN EXPORT FUNCTION =====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const options: ExportOptions = {
      format: body.format || 'csv',
      entity: body.entity,
      filters: body.filters,
      columns: body.columns,
      includeHeaders: body.includeHeaders ?? true,
      rtl: body.rtl ?? true,
      title: body.title,
      companyName: body.companyName,
    }

    // الحصول على البيانات
    const data = await fetchData(options.entity, options.filters)
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد بيانات للتصدير' },
        { status: 400 }
      )
    }

    // تحديد الأعمدة
    const columns = options.columns || Object.keys(data[0])
    
    // التحويل للتنسيق المطلوب
    switch (options.format) {
      case 'excel':
        return await exportToExcel(data, columns, options)
      
      case 'pdf':
        return await exportToPDF(data, columns, options)
      
      case 'csv':
        return await exportToCSV(data, columns, options)
      
      case 'json':
        return await exportToJSON(data, options)
      
      default:
        return NextResponse.json(
          { success: false, error: 'تنسيق غير مدعوم' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء التصدير' },
      { status: 500 }
    )
  }
}

// ===================== DATA FETCHERS =====================
async function fetchData(entity: string, filters?: any): Promise<any[]> {
  const where = filters ? buildWhereClause(filters) : {}
  
  switch (entity) {
    case 'customers':
      return await db.customer.findMany({
        where,
        include: {
          Company: { select: { name: true } },
          Branch: { select: { name: true } },
          User: { select: { name: true } },
          governorate: { select: { name: true } },
          city: { select: { name: true } },
          area: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' }
      })
    
    case 'products':
      return await db.product.findMany({
        where,
        include: {
          Company: { select: { name: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' }
      })
    
    case 'invoices':
      return await db.invoice.findMany({
        where,
        include: {
          Customer: { select: { name: true, phone: true } },
          Branch: { select: { name: true } },
          User: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' }
      })
    
    case 'payments':
      return await db.payment.findMany({
        where,
        include: {
          Customer: { select: { name: true, phone: true } },
          Invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { createdAt: 'desc' }
      })
    
    case 'installments':
      return await db.installment.findMany({
        where,
        include: {
          InstallmentContract: {
            include: {
              Customer: { select: { name: true } },
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      })
    
    case 'inventory':
      return await db.inventory.findMany({
        where,
        include: {
          Product: { select: { name: true, sku: true } },
          Warehouse: { select: { name: true } },
        }
      })
    
    default:
      return []
  }
}

function buildWhereClause(filters: any): any {
  const where: any = {}
  
  if (filters.companyId) where.companyId = filters.companyId
  if (filters.branchId) where.branchId = filters.branchId
  if (filters.status) where.status = filters.status
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
  }
  
  return where
}

// ===================== EXPORT FUNCTIONS =====================

// تصدير إلى Excel (تنسيق CSV مع BOM للتوافق)
async function exportToExcel(data: any[], columns: string[], options: ExportOptions) {
  // معالجة البيانات حسب الأعمدة المطلوبة
  const processedData = data.map(row => processRow(row, columns))
  
  // إنشاء محتوى CSV مع دعم RTL
  const headers = columns.map(col => getArabicColumnName(col))
  const rows = processedData.map(row => 
    columns.map(col => formatValue(row[col])).join('\t')
  )
  
  // إضافة BOM للتوافق مع Excel
  const BOM = '\uFEFF'
  const csvContent = BOM + [
    headers.join('\t'),
    ...rows
  ].join('\n')
  
  return NextResponse.json({
    success: true,
    data: csvContent,
    filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.xls`,
    mimeType: 'application/vnd.ms-excel; charset=utf-8'
  })
}

// تصدير إلى PDF (HTML للطباعة)
async function exportToPDF(data: any[], columns: string[], options: ExportOptions) {
  const processedData = data.map(row => processRow(row, columns))
  const headers = columns.map(col => getArabicColumnName(col))
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${options.title || getArabicEntityName(options.entity)}</title>
      <style>
        * { font-family: 'Noto Sans Arabic', Arial, sans-serif; }
        body { padding: 20px; direction: rtl; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .report-title { font-size: 18px; color: #666; }
        .report-date { font-size: 12px; color: #999; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #3b82f6; color: white; padding: 12px 8px; text-align: right; font-weight: bold; }
        td { padding: 10px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        tr:hover { background: #f0f0f0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
        .summary { background: #f5f5f5; padding: 15px; margin-top: 20px; border-radius: 8px; }
        .summary-item { display: inline-block; margin: 0 20px; }
        .summary-label { color: #666; font-size: 12px; }
        .summary-value { font-size: 18px; font-weight: bold; color: #3b82f6; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${options.companyName ? `<div class="company-name">${options.companyName}</div>` : ''}
        <div class="report-title">${options.title || getArabicEntityName(options.entity)}</div>
        <div class="report-date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">إجمالي السجلات</div>
          <div class="summary-value">${data.length}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${processedData.map(row => `
            <tr>${columns.map(col => `<td>${formatValueForPDF(row[col])}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>تم إنشاء هذا التقرير بواسطة نظام أقساطي ERP</p>
        <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </div>
    </body>
    </html>
  `
  
  return NextResponse.json({
    success: true,
    data: html,
    filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.html`,
    mimeType: 'text/html; charset=utf-8'
  })
}

// تصدير إلى CSV
async function exportToCSV(data: any[], columns: string[], options: ExportOptions) {
  const processedData = data.map(row => processRow(row, columns))
  const headers = columns.map(col => getArabicColumnName(col))
  const rows = processedData.map(row => 
    columns.map(col => {
      const value = formatValue(row[col])
      // إضافة علامات اقتباس للقيم التي تحتوي على فواصل
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  // إضافة BOM للتوافق
  const BOM = '\uFEFF'
  const csvContent = BOM + [
    options.includeHeaders !== false ? headers.join(',') : '',
    ...rows
  ].join('\n')
  
  return NextResponse.json({
    success: true,
    data: csvContent,
    filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.csv`,
    mimeType: 'text/csv; charset=utf-8'
  })
}

// تصدير إلى JSON
async function exportToJSON(data: any[], options: ExportOptions) {
  const processedData = data.map(row => processRow(row, Object.keys(row)))
  
  return NextResponse.json({
    success: true,
    data: JSON.stringify(processedData, null, 2),
    filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json; charset=utf-8'
  })
}

// ===================== HELPERS =====================

function processRow(row: any, columns: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const col of columns) {
    // التعامل مع الحقول المتداخلة (مثل customer.name)
    if (col.includes('.')) {
      const parts = col.split('.')
      let value = row
      for (const part of parts) {
        value = value?.[part]
      }
      result[col] = value
    } else {
      result[col] = row[col]
    }
  }
  
  return result
}

function getArabicColumnName(col: string): string {
  const names: Record<string, string> = {
    id: 'المعرف',
    name: 'الاسم',
    nameAr: 'الاسم بالعربية',
    code: 'الكود',
    sku: 'رمز المنتج',
    phone: 'الهاتف',
    phone2: 'الهاتف 2',
    customerPhone: 'هاتف العميل',
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
    invoice: 'رقم الفاتورة',
    paymentNumber: 'رقم الدفعة',
    paymentDate: 'تاريخ الدفع',
    method: 'طريقة الدفع',
    amount: 'المبلغ',
    quantity: 'الكمية',
    minQuantity: 'الحد الأدنى',
    maxQuantity: 'الحد الأقصى',
    unitPrice: 'سعر الوحدة',
    costPrice: 'سعر التكلفة',
    sellPrice: 'سعر البيع',
    minPrice: 'الحد الأدنى للسعر',
    salesCommission: 'العمولة',
    barcode: 'الباركود',
    description: 'الوصف',
    notes: 'ملاحظات',
    reference: 'المرجع',
    createdAt: 'تاريخ الإنشاء',
    updatedAt: 'تاريخ التحديث',
    dueDate: 'تاريخ الاستحقاق',
    installmentNumber: 'رقم القسط',
    contractNumber: 'رقم العقد',
    lateFee: 'غرامة التأخير',
    value: 'القيمة',
    Company: 'الشركة',
    Branch: 'الفرع',
    User: 'المستخدم',
    agent: 'المندوب',
    Customer: 'العميل',
    customer: 'العميل',
    Product: 'المنتج',
    product: 'المنتج',
    Warehouse: 'المخزن',
    warehouse: 'المخزن',
    category: 'التصنيف',
    Category: 'التصنيف',
    governorate: 'المحافظة',
    city: 'المدينة',
    area: 'المنطقة',
    paymentType: 'نوع الدفع',
    branch: 'الفرع',
    active: 'نشط',
  }
  
  // التعامل مع الحقول المتداخلة
  if (col.includes('.')) {
    const parts = col.split('.')
    return parts.map(p => names[p] || p).join(' ')
  }
  
  return names[col] || col
}

function getArabicEntityName(entity: string): string {
  const names: Record<string, string> = {
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
  return names[entity] || entity
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toLocaleDateString('ar-EG')
    }
    // استخراج الاسم من الكائنات المتداخلة
    if (value.name) return value.name
    if (value.nameAr) return value.nameAr
    return JSON.stringify(value)
  }
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا'
  if (typeof value === 'number') return value.toLocaleString('ar-EG')
  return String(value)
}

function formatValueForPDF(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toLocaleDateString('ar-EG')
    }
    if (value.name) return value.name
    return '-'
  }
  if (typeof value === 'boolean') {
    return value 
      ? '<span style="color: green;">✓ نعم</span>' 
      : '<span style="color: red;">✗ لا</span>'
  }
  if (typeof value === 'number') {
    return value.toLocaleString('ar-EG')
  }
  return String(value)
}
