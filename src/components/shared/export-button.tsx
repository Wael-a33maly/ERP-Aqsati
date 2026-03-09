'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  File,
  Loader2,
  CheckCircle,
  XCircle,
  Columns,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'

// ===================== TYPES =====================
type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json'

interface ExportButtonProps {
  entity: 'customers' | 'products' | 'invoices' | 'payments' | 'installments' | 'inventory'
  filters?: Record<string, any>
  columns?: string[]
  defaultColumns?: string[]
  title?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
}

interface ColumnInfo {
  key: string
  label: string
  selected: boolean
}

// ===================== COLUMN DEFINITIONS =====================
const entityColumns: Record<string, ColumnInfo[]> = {
  customers: [
    { key: 'code', label: 'الكود', selected: true },
    { key: 'name', label: 'الاسم', selected: true },
    { key: 'phone', label: 'الهاتف', selected: true },
    { key: 'phone2', label: 'الهاتف 2', selected: false },
    { key: 'nationalId', label: 'الرقم القومي', selected: false },
    { key: 'address', label: 'العنوان', selected: true },
    { key: 'governorate', label: 'المحافظة', selected: false },
    { key: 'city', label: 'المدينة', selected: false },
    { key: 'area', label: 'المنطقة', selected: false },
    { key: 'creditLimit', label: 'حد الائتمان', selected: true },
    { key: 'balance', label: 'الرصيد', selected: true },
    { key: 'status', label: 'الحالة', selected: true },
    { key: 'createdAt', label: 'تاريخ الإنشاء', selected: false },
  ],
  products: [
    { key: 'sku', label: 'الكود', selected: true },
    { key: 'name', label: 'الاسم', selected: true },
    { key: 'category', label: 'التصنيف', selected: true },
    { key: 'costPrice', label: 'سعر التكلفة', selected: true },
    { key: 'sellPrice', label: 'سعر البيع', selected: true },
    { key: 'minPrice', label: 'الحد الأدنى للسعر', selected: false },
    { key: 'salesCommission', label: 'العمولة', selected: false },
    { key: 'quantity', label: 'الكمية المتاحة', selected: true },
    { key: 'status', label: 'الحالة', selected: true },
    { key: 'createdAt', label: 'تاريخ الإنشاء', selected: false },
  ],
  invoices: [
    { key: 'invoiceNumber', label: 'رقم الفاتورة', selected: true },
    { key: 'customer', label: 'العميل', selected: true },
    { key: 'customerPhone', label: 'هاتف العميل', selected: false },
    { key: 'invoiceDate', label: 'تاريخ الفاتورة', selected: true },
    { key: 'subtotal', label: 'المجموع الفرعي', selected: false },
    { key: 'discount', label: 'الخصم', selected: false },
    { key: 'taxAmount', label: 'الضريبة', selected: false },
    { key: 'total', label: 'الإجمالي', selected: true },
    { key: 'paidAmount', label: 'المبلغ المدفوع', selected: true },
    { key: 'remainingAmount', label: 'المبلغ المتبقي', selected: true },
    { key: 'status', label: 'الحالة', selected: true },
    { key: 'paymentType', label: 'نوع الدفع', selected: false },
    { key: 'branch', label: 'الفرع', selected: false },
    { key: 'agent', label: 'المندوب', selected: false },
    { key: 'createdAt', label: 'تاريخ الإنشاء', selected: false },
  ],
  payments: [
    { key: 'paymentNumber', label: 'رقم الدفعة', selected: true },
    { key: 'customer', label: 'العميل', selected: true },
    { key: 'customerPhone', label: 'هاتف العميل', selected: false },
    { key: 'invoice', label: 'رقم الفاتورة', selected: true },
    { key: 'paymentDate', label: 'تاريخ الدفع', selected: true },
    { key: 'amount', label: 'المبلغ', selected: true },
    { key: 'method', label: 'طريقة الدفع', selected: true },
    { key: 'reference', label: 'المرجع', selected: false },
    { key: 'status', label: 'الحالة', selected: true },
    { key: 'notes', label: 'ملاحظات', selected: false },
    { key: 'createdAt', label: 'تاريخ الإنشاء', selected: false },
  ],
  installments: [
    { key: 'contractNumber', label: 'رقم العقد', selected: true },
    { key: 'customer', label: 'العميل', selected: true },
    { key: 'installmentNumber', label: 'رقم القسط', selected: true },
    { key: 'dueDate', label: 'تاريخ الاستحقاق', selected: true },
    { key: 'amount', label: 'المبلغ', selected: true },
    { key: 'paidAmount', label: 'المبلغ المدفوع', selected: true },
    { key: 'remainingAmount', label: 'المبلغ المتبقي', selected: true },
    { key: 'status', label: 'الحالة', selected: true },
    { key: 'lateFee', label: 'غرامة التأخير', selected: false },
    { key: 'createdAt', label: 'تاريخ الإنشاء', selected: false },
  ],
  inventory: [
    { key: 'product', label: 'المنتج', selected: true },
    { key: 'sku', label: 'كود المنتج', selected: true },
    { key: 'warehouse', label: 'المخزن', selected: true },
    { key: 'quantity', label: 'الكمية', selected: true },
    { key: 'minQuantity', label: 'الحد الأدنى', selected: false },
    { key: 'maxQuantity', label: 'الحد الأقصى', selected: false },
    { key: 'status', label: 'الحالة', selected: true },
    { key: 'value', label: 'القيمة', selected: true },
    { key: 'updatedAt', label: 'تاريخ التحديث', selected: false },
  ],
}

// ===================== FORMAT INFO =====================
const formatInfo: Record<ExportFormat, { icon: React.ReactNode; label: string; description: string; extension: string }> = {
  excel: {
    icon: <FileSpreadsheet className="h-4 w-4 text-emerald-500" />,
    label: 'Excel (XLS)',
    description: 'ملف Excel مع تنسيق RTL',
    extension: '.xls',
  },
  pdf: {
    icon: <FileText className="h-4 w-4 text-red-500" />,
    label: 'PDF (HTML)',
    description: 'تقرير جاهز للطباعة',
    extension: '.html',
  },
  csv: {
    icon: <File className="h-4 w-4 text-blue-500" />,
    label: 'CSV',
    description: 'ملف CSV للبيانات',
    extension: '.csv',
  },
  json: {
    icon: <FileJson className="h-4 w-4 text-amber-500" />,
    label: 'JSON',
    description: 'ملف JSON للتكامل',
    extension: '.json',
  },
}

// ===================== ENTITY LABELS =====================
const entityLabels: Record<string, string> = {
  customers: 'العملاء',
  products: 'المنتجات',
  invoices: 'الفواتير',
  payments: 'المدفوعات',
  installments: 'الأقساط',
  inventory: 'المخزون',
}

// ===================== MAIN COMPONENT =====================
export function ExportButton({
  entity,
  filters,
  columns: propColumns,
  defaultColumns,
  title,
  variant = 'outline',
  size = 'default',
  disabled = false,
}: ExportButtonProps) {
  // States
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  
  // Get columns for this entity
  const entityCols = entityColumns[entity] || []
  const [selectedColumns, setSelectedColumns] = useState<ColumnInfo[]>(
    entityCols.map(col => ({
      ...col,
      selected: defaultColumns ? defaultColumns.includes(col.key) : col.selected,
    }))
  )

  // Toggle column selection
  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.map(col =>
        col.key === key ? { ...col, selected: !col.selected } : col
      )
    )
  }

  // Select all columns
  const selectAllColumns = () => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: true })))
  }

  // Deselect all columns
  const deselectAllColumns = () => {
    setSelectedColumns(prev => prev.map(col => ({ ...col, selected: false })))
  }

  // Get selected column keys
  const getSelectedColumnKeys = () => {
    return selectedColumns.filter(col => col.selected).map(col => col.key)
  }

  // Export function
  const handleExport = useCallback(async (format: ExportFormat) => {
    const columnsToExport = getSelectedColumnKeys()
    
    if (columnsToExport.length === 0) {
      toast.error('يرجى تحديد عمود واحد على الأقل')
      return
    }

    setSelectedFormat(format)
    setExporting(true)
    setProgress(0)
    setShowResultDialog(true)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      // Call export API
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          entity,
          filters,
          columns: columnsToExport,
          title: title || entityLabels[entity],
        }),
      })

      clearInterval(progressInterval)
      setProgress(95)

      const result = await response.json()

      if (result.success) {
        setProgress(100)
        setExportResult({ success: true, message: 'تم التصدير بنجاح' })

        // Download the file
        const blob = new Blob([result.data], { type: result.mimeType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success('تم تصدير البيانات بنجاح')
      } else {
        setExportResult({ success: false, message: result.error || 'فشل التصدير' })
        toast.error(result.error || 'فشل التصدير')
      }
    } catch (error: any) {
      setExportResult({ success: false, message: error.message || 'حدث خطأ أثناء التصدير' })
      toast.error('حدث خطأ أثناء التصدير')
    } finally {
      setExporting(false)
    }
  }, [entity, filters, selectedColumns, title])

  // Quick export with all default columns
  const handleQuickExport = (format: ExportFormat) => {
    handleExport(format)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={disabled || exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 ml-2" />
            )}
            تصدير
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير البيانات
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Format options */}
          {(Object.keys(formatInfo) as ExportFormat[]).map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleQuickExport(format)}
              className="flex items-center gap-3 cursor-pointer"
            >
              {formatInfo[format].icon}
              <div className="flex-1">
                <p className="font-medium">{formatInfo[format].label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatInfo[format].description}
                </p>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          
          {/* Column selection */}
          <DropdownMenuItem
            onClick={() => setShowColumnDialog(true)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Columns className="h-4 w-4 text-purple-500" />
            <span>تحديد الأعمدة...</span>
            <Badge variant="secondary" className="mr-auto">
              {getSelectedColumnKeys().length}
            </Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Selection Dialog */}
      <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Columns className="h-5 w-5 text-purple-500" />
              تحديد الأعمدة للتصدير
            </DialogTitle>
            <DialogDescription>
              اختر الأعمدة التي تريد تضمينها في ملف التصدير
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllColumns}
            >
              تحديد الكل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAllColumns}
            >
              إلغاء التحديد
            </Button>
          </div>

          <ScrollArea className="h-64 border rounded-lg">
            <div className="p-2 space-y-2">
              {selectedColumns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleColumn(column.key)}
                >
                  <Checkbox
                    checked={column.selected}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <span className={column.selected ? 'font-medium' : 'text-muted-foreground'}>
                    {column.label}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowColumnDialog(false)}
            >
              إلغاء
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={getSelectedColumnKeys().length === 0}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(formatInfo) as ExportFormat[]).map((format) => (
                  <DropdownMenuItem
                    key={format}
                    onClick={() => {
                      setShowColumnDialog(false)
                      handleExport(format)
                    }}
                    className="flex items-center gap-2"
                  >
                    {formatInfo[format].icon}
                    {formatInfo[format].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {exporting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  جاري التصدير...
                </>
              ) : exportResult?.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  تم التصدير
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  فشل التصدير
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {exporting && (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  جاري تصدير {entityLabels[entity]}...
                </p>
              </>
            )}

            {!exporting && exportResult && (
              <>
                <p className="text-sm text-center">
                  {exportResult.message}
                </p>
                {exportResult.success && selectedFormat && (
                  <p className="text-xs text-muted-foreground text-center">
                    تم تنزيل الملف: {entity}_{new Date().toISOString().split('T')[0]}
                    {formatInfo[selectedFormat].extension}
                  </p>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResultDialog(false)}
              disabled={exporting}
            >
              {exporting ? 'انتظار...' : 'إغلاق'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ExportButton
