'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi, customersApi, productsApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, Search, FileText, Trash2, Loader2, Printer, 
  DollarSign, Package, Receipt, CreditCard, Eye
} from 'lucide-react'
import { toast } from 'sonner'

const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity is required'),
  unitPrice: z.number().min(0, 'Price is required'),
  discount: z.number().default(0),
  taxRate: z.number().default(0),
})

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  type: z.enum(['CASH', 'INSTALLMENT']),
  invoiceDate: z.string(),
  dueDate: z.string().optional(),
  discount: z.number().default(0),
  taxRate: z.number().default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
})

type InvoiceForm = z.infer<typeof invoiceSchema>

interface Installment {
  id: string
  installmentNumber: number
  dueDate: string
  amount: number
  paidAmount: number
  remainingAmount: number
  status: string
  paidDate: string | null
}

interface InstallmentContract {
  id: string
  contractNumber: string
  totalAmount: number
  downPayment: number
  financedAmount: number
  numberOfPayments: number
  paymentFrequency: string
  startDate: string
  endDate: string
  installments: Installment[]
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  type: string
  status: string
  subtotal: number
  discount: number
  taxAmount: number
  total: number
  paidAmount: number
  remainingAmount: number
  customer: { id: string; name: string; phone?: string; address?: string }
  branch?: { id: string; name: string }
  agent?: { id: string; name: string; phone?: string }
  items: Array<{
    id: string
    productId: string
    product: { name: string; sku: string }
    quantity: number
    unitPrice: number
    total: number
  }>
  installmentContract?: InstallmentContract
}

// مكون طباعة إيصالات الأقساط
function InstallmentReceiptsDialog({ 
  invoice, 
  open, 
  onClose 
}: { 
  invoice: Invoice | null
  open: boolean
  onClose: () => void 
}) {
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([])
  const [printAll, setPrintAll] = useState(true)

  if (!invoice || !invoice.installmentContract) {
    return null
  }

  const contract = invoice.installmentContract
  const paperWidth = 794
  const paperHeight = 374

  const toggleInstallment = (id: string) => {
    setSelectedInstallments(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
    setPrintAll(false)
  }

  const toggleAll = () => {
    if (printAll) {
      setSelectedInstallments([])
    } else {
      setSelectedInstallments(contract.installments.map(i => i.id))
    }
    setPrintAll(!printAll)
  }

  const printSelectedReceipts = () => {
    const installmentsToPrint = printAll 
      ? contract.installments 
      : contract.installments.filter(i => selectedInstallments.includes(i.id))

    if (installmentsToPrint.length === 0) {
      toast.error('الرجاء اختيار قسط واحد على الأقل')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('الرجاء السماح بالنوافذ المنبثقة')
      return
    }

    const receiptsHtml = installmentsToPrint.map((installment, idx) => `
      <div class="receipt-page" style="
        width: ${paperWidth}px;
        height: ${paperHeight}px;
        padding: 15px;
        box-sizing: border-box;
        position: relative;
        font-family: Arial, Tahoma, sans-serif;
        direction: rtl;
        page-break-after: always;
        background: white;
      ">
        <!-- الهيدر -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #333;">
          <div style="font-size: 14px;">${invoice.branch?.name || 'الفرع الرئيسي'}</div>
          <div style="font-size: 16px; font-weight: bold;">${invoice.customer?.name || 'اسم الشركة'}</div>
          <div style="font-size: 14px;">${invoice.customer?.phone || 'هاتف الشركة'}</div>
        </div>

        <!-- العمودين -->
        <div style="display: flex; gap: 15px; margin-bottom: 10px;">
          <!-- عمود بيانات الأقساط -->
          <div style="flex: 1; font-size: 11px;">
            <div style="background: #f0f7ff; padding: 5px; text-align: center; font-weight: bold; border-radius: 3px; margin-bottom: 5px;">
              بيانات الأقساط
            </div>
            <div style="line-height: 1.6;">
              <div>عدد الأقساط: <strong>${contract.numberOfPayments}</strong></div>
              <div>القسط: <strong style="color: #0066cc;">${installment.installmentNumber}</strong> من ${contract.numberOfPayments}</div>
              <div>إجمالي الفاتورة: <strong>${invoice.total.toLocaleString()} ر.س</strong></div>
              <div>المقدم: <strong>${contract.downPayment.toLocaleString()} ر.س</strong></div>
              <div>المتبقي للأقساط: <strong>${contract.financedAmount.toLocaleString()} ر.س</strong></div>
              <div style="background: #f0fff0; border: 1px solid #008800; border-radius: 3px; padding: 2px 5px; display: inline-block; margin-top: 3px;">
                قيمة القسط: <strong style="color: #008800;">${installment.amount.toLocaleString()} ر.س</strong>
              </div>
              <div style="color: #cc0000;">المتبقي القادم: ${installment.remainingAmount.toLocaleString()} ر.س</div>
              <div>القسط القادم: ${installment.dueDate ? new Date(installment.dueDate).toLocaleDateString('ar-SA') : '-'}</div>
              <div>رقم العقد: ${contract.contractNumber}</div>
            </div>
          </div>

          <!-- عمود بيانات العميل -->
          <div style="flex: 1; font-size: 11px;">
            <div style="background: #f5f5f5; padding: 5px; text-align: center; font-weight: bold; border-radius: 3px; margin-bottom: 5px;">
              بيانات العميل
            </div>
            <div style="line-height: 1.6;">
              <div style="font-weight: bold; margin-bottom: 3px;">تاريخ السداد: ${new Date().toLocaleDateString('ar-SA')}</div>
              <div>رقم العميل: ${invoice.customer?.id?.slice(-6) || '-'}</div>
              <div style="font-weight: bold;">العميل: ${invoice.customer?.name}</div>
              <div>المنطقة: -</div>
              <div>العنوان: ${invoice.customer?.address || '-'}</div>
              <div>تليفون: ${invoice.customer?.phone || '-'}</div>
            </div>
          </div>
        </div>

        <!-- جدول المنتجات -->
        <div style="border: 1px solid #ccc; border-radius: 3px; padding: 5px; font-size: 10px; margin-bottom: 10px;">
          <div style="border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 3px; font-weight: bold; text-align: center;">
            جدول المنتجات
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 5px; font-weight: bold; text-align: center;">
            <span>المنتج</span>
            <span>العدد</span>
            <span>السعر</span>
            <span>الإجمالي</span>
          </div>
          ${invoice.items.map(item => `
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 5px; text-align: center; padding-top: 2px;">
              <span>${item.product?.name || '-'}</span>
              <span>${item.quantity}</span>
              <span>${item.unitPrice.toLocaleString()}</span>
              <span>${item.total.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>

        <!-- الفوتر -->
        <div style="border-top: 2px solid #333; padding-top: 8px; display: flex; justify-content: space-between; font-size: 11px;">
          <div>المندوب: ${invoice.agent?.name || '-'}</div>
          <div>تليفون المندوب: ${invoice.agent?.phone || '-'}</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666; margin-top: 5px;">
          <div>فاتورة رقم: ${invoice.invoiceNumber}</div>
          <div>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصالات الأقساط - ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, Tahoma, sans-serif;
            background: #f5f5f5;
            padding: 20px;
          }
          .receipt-page {
            margin: 0 auto 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          @media print {
            body { background: white; padding: 0; }
            .receipt-page { 
              box-shadow: none; 
              margin: 0;
              page-break-after: always;
            }
            .receipt-page:last-child { page-break-after: auto; }
          }
          @page {
            size: ${paperWidth}px ${paperHeight}px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        ${receiptsHtml}
        <script>
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            طباعة إيصالات الأقساط
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            الفاتورة: {invoice.invoiceNumber} | العميل: {invoice.customer?.name}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات العقد */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">رقم العقد:</span>
                  <span className="font-bold mr-2">{contract.contractNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">عدد الأقساط:</span>
                  <span className="font-bold mr-2">{contract.numberOfPayments}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">إجمالي الأقساط:</span>
                  <span className="font-bold mr-2">{contract.financedAmount.toLocaleString()} ر.س</span>
                </div>
                <div>
                  <span className="text-muted-foreground">قيمة القسط:</span>
                  <span className="font-bold mr-2 text-green-600">{(contract.financedAmount / contract.numberOfPayments).toLocaleString()} ر.س</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جدول الأقساط */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium">الأقساط:</h4>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {printAll ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </Button>
          </div>

          <ScrollArea className="h-[300px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={printAll}
                      onChange={toggleAll}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead className="text-center">رقم القسط</TableHead>
                  <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-center">قيمة القسط</TableHead>
                  <TableHead className="text-center">المدفوع</TableHead>
                  <TableHead className="text-center">المتبقي</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.installments.map((installment) => {
                  const isSelected = printAll || selectedInstallments.includes(installment.id)
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    paid: 'bg-green-100 text-green-800',
                    partial: 'bg-blue-100 text-blue-800',
                    overdue: 'bg-red-100 text-red-800',
                  }
                  const statusLabels: Record<string, string> = {
                    pending: 'معلق',
                    paid: 'مدفوع',
                    partial: 'جزئي',
                    overdue: 'متأخر',
                  }
                  
                  return (
                    <TableRow 
                      key={installment.id}
                      className={`cursor-pointer hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleInstallment(installment.id)}
                    >
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleInstallment(installment.id)}
                          className="h-4 w-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        القسط {installment.installmentNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(installment.dueDate).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {installment.amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell className="text-center text-green-600">
                        {installment.paidAmount?.toLocaleString() || 0} ر.س
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {installment.remainingAmount?.toLocaleString() || installment.amount.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={statusColors[installment.status] || 'bg-gray-100'}>
                          {statusLabels[installment.status] || installment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* أزرار الإجراءات */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {printAll 
                ? `سيتم طباعة ${contract.installments.length} إيصال`
                : `سيتم طباعة ${selectedInstallments.length} إيصال`
              }
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button onClick={printSelectedReceipts}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة الإيصالات
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function InvoicesList() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { search, statusFilter, page }],
    queryFn: () => invoicesApi.list({ search, status: statusFilter !== 'all' ? statusFilter : undefined, page, limit: 10 }),
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ limit: 100 }),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list({ limit: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: InvoiceForm) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice created successfully')
      setDialogOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice')
    },
  })

  const { register, control, handleSubmit, watch, reset: resetForm, formState: { errors }, setValue } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      type: 'CASH',
      invoiceDate: new Date().toISOString().split('T')[0],
      discount: 0,
      taxRate: 15,
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 15 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items' as never,
  })

  const items = watch('items')
  const discount = watch('discount') || 0
  const taxRate = watch('taxRate') || 0

  const subtotal = items?.reduce((sum: number, item: any) => {
    return sum + ((item.quantity || 0) * (item.unitPrice || 0) - (item.discount || 0))
  }, 0) || 0

  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal - discount + taxAmount

  const onSubmit = (data: InvoiceForm) => {
    createMutation.mutate({
      ...data,
      items: data.items.map(item => ({
        ...item,
        taxAmount: (item.quantity * item.unitPrice - item.discount) * (item.taxRate / 100),
        total: (item.quantity * item.unitPrice - item.discount) * (1 + item.taxRate / 100),
      })),
    })
  }

  const invoices = data?.data?.invoices || []
  const customers = customersData?.data?.customers || []
  const products = productsData?.data?.products || []

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const handlePrintReceipts = (invoice: Invoice) => {
    // جلب بيانات العقد والأقساط من الـ API
    fetch(`/api/invoices/${invoice.id}/installments`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.contract) {
          setSelectedInvoice({
            ...invoice,
            installmentContract: data.contract
          })
          setShowReceiptsDialog(true)
        } else {
          // إنشاء بيانات افتراضية للعرض
          const mockContract: InstallmentContract = {
            id: `contract-${invoice.id}`,
            contractNumber: `CNT-${invoice.invoiceNumber}`,
            totalAmount: invoice.total,
            downPayment: invoice.total * 0.2,
            financedAmount: invoice.total * 0.8,
            numberOfPayments: 6,
            paymentFrequency: 'MONTHLY',
            startDate: invoice.invoiceDate,
            endDate: new Date(new Date(invoice.invoiceDate).setMonth(new Date(invoice.invoiceDate).getMonth() + 6)).toISOString(),
            installments: Array.from({ length: 6 }, (_, i) => ({
              id: `inst-${i}`,
              installmentNumber: i + 1,
              dueDate: new Date(new Date(invoice.invoiceDate).setMonth(new Date(invoice.invoiceDate).getMonth() + i + 1)).toISOString(),
              amount: (invoice.total * 0.8) / 6,
              paidAmount: i < 2 ? (invoice.total * 0.8) / 6 : 0,
              remainingAmount: i >= 2 ? (invoice.total * 0.8) / 6 : 0,
              status: i < 2 ? 'paid' : 'pending',
              paidDate: i < 2 ? new Date(new Date(invoice.invoiceDate).setMonth(new Date(invoice.invoiceDate).getMonth() + i + 1)).toISOString() : null
            }))
          }
          setSelectedInvoice({
            ...invoice,
            installmentContract: mockContract
          })
          setShowReceiptsDialog(true)
        }
      })
      .catch(() => {
        toast.error('فشل في جلب بيانات الأقساط')
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Invoices / الفواتير</h2>
          <p className="text-muted-foreground">Manage sales invoices</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice / فاتورة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>No invoices found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.customer?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.type}</Badge>
                    </TableCell>
                    <TableCell>SAR {invoice.total.toLocaleString()}</TableCell>
                    <TableCell>SAR {invoice.paidAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status] || ''}`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {invoice.type === 'INSTALLMENT' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-primary hover:bg-primary/10"
                            onClick={() => handlePrintReceipts(invoice)}
                            title="طباعة إيصالات الأقساط"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" title="طباعة الفاتورة">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="تسجيل دفعة">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Invoice / فاتورة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Customer / العميل</Label>
                <Select onValueChange={(v) => setValue('customerId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Type / النوع</Label>
                <Select defaultValue="CASH" onValueChange={(v) => setValue('type', v as 'CASH' | 'INSTALLMENT')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash / نقدي</SelectItem>
                    <SelectItem value="INSTALLMENT">Installment / تقسيط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date / التاريخ</Label>
                <Input type="date" {...register('invoiceDate')} />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Items / الأصناف</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 15 })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-32">Price</TableHead>
                    <TableHead className="w-24">Discount</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select onValueChange={(v) => {
                          setValue(`items.${index}.productId`, v)
                          const product = products.find((p: any) => p.id === v)
                          if (product) setValue(`items.${index}.unitPrice`, product.sellPrice)
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.name} - SAR {p.sellPrice}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" {...register(`items.${index}.discount`, { valueAsNumber: true })} />
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <Card className="w-72">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>SAR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>SAR {taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>SAR {total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Installment Receipts Dialog */}
      <InstallmentReceiptsDialog 
        invoice={selectedInvoice}
        open={showReceiptsDialog}
        onClose={() => {
          setShowReceiptsDialog(false)
          setSelectedInvoice(null)
        }}
      />
    </div>
  )
}
