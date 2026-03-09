'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { 
  Plus, Search, Loader2, Edit, Trash2, FileText, 
  Calendar, DollarSign, Printer, Eye, ArrowUpCircle, ArrowDownCircle,
  CheckCircle, AlertCircle, X
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Voucher {
  id: string
  voucherNumber: string
  type: 'RECEIPT' | 'PAYMENT'
  date: string
  amount: number
  accountId: string
  accountName: string
  accountCode: string
  description: string
  reference?: string
  status: 'DRAFT' | 'POSTED' | 'CANCELLED'
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD'
  checkNumber?: string
  checkDate?: string
  bankName?: string
  createdAt: string
  createdBy: string
}

// الحسابات المتاحة
const accounts = [
  { id: '1.1', code: '1.1', name: 'النقدية والبنوك', type: 'ASSET' },
  { id: '1.1.1', code: '1.1.1', name: 'الصندوق', type: 'ASSET' },
  { id: '1.1.2', code: '1.1.2', name: 'البنك الأهلي', type: 'ASSET' },
  { id: '1.1.3', code: '1.1.3', name: 'بنك مصر', type: 'ASSET' },
  { id: '1.2', code: '1.2', name: 'العملاء', type: 'ASSET' },
  { id: '1.3', code: '1.3', name: 'المخزون', type: 'ASSET' },
  { id: '2.1', code: '2.1', name: 'الموردين', type: 'LIABILITY' },
  { id: '2.2', code: '2.2', name: 'القروض', type: 'LIABILITY' },
  { id: '2.3', code: '2.3', name: 'ضريبة القيمة المضافة', type: 'LIABILITY' },
  { id: '3.1', code: '3.1', name: 'رأس المال', type: 'EQUITY' },
  { id: '4.1', code: '4.1', name: 'المبيعات', type: 'REVENUE' },
  { id: '4.2', code: '4.2', name: 'الإيرادات الأخرى', type: 'REVENUE' },
  { id: '5.1', code: '5.1', name: 'تكلفة المبيعات', type: 'EXPENSE' },
  { id: '5.2', code: '5.2', name: 'المصروفات التشغيلية', type: 'EXPENSE' },
  { id: '5.3', code: '5.3', name: 'مصروفات الرواتب', type: 'EXPENSE' },
  { id: '5.4', code: '5.4', name: 'مصروفات الإيجار', type: 'EXPENSE' },
  { id: '5.5', code: '5.5', name: 'مصروفات الصيانة', type: 'EXPENSE' },
]

const paymentMethodLabels: Record<string, string> = {
  CASH: 'نقدي',
  BANK_TRANSFER: 'تحويل بنكي',
  CHECK: 'شيك',
  CARD: 'بطاقة',
}

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  POSTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels = {
  DRAFT: 'مسودة',
  POSTED: 'مرحل',
  CANCELLED: 'ملغي',
}

// توليد رقم السند التلقائي
const generateVoucherNumber = (vouchers: Voucher[], type: 'RECEIPT' | 'PAYMENT'): string => {
  const prefix = type === 'RECEIPT' ? 'RV' : 'PV'
  const typeVouchers = vouchers.filter(v => v.type === type)
  const lastNumber = typeVouchers.reduce((max, voucher) => {
    const num = parseInt(voucher.voucherNumber.replace(`${prefix}-`, ''))
    return num > max ? num : max
  }, 0)
  return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`
}

// توليد ID فريد
const generateId = () => `voucher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// تنسيق الأرقام بالإنجليزية
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

// تنسيق التاريخ بالإنجليزية
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-CA')
}

export default function VouchersManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [isCreating, setIsCreating] = useState(false)

  // البحث عن الحسابات
  const [accountSearch, setAccountSearch] = useState('')
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)

  // فورم السند الجديد
  const [formData, setFormData] = useState({
    type: 'RECEIPT' as 'RECEIPT' | 'PAYMENT',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    accountId: '',
    accountName: '',
    accountCode: '',
    description: '',
    reference: '',
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD',
    checkNumber: '',
    checkDate: '',
    bankName: '',
  })

  useEffect(() => {
    fetchVouchers()
  }, [])

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      setVouchers([])
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  // تصفية الحسابات حسب البحث
  const filteredAccounts = accounts.filter(account => 
    account.name.includes(accountSearch) ||
    account.code.includes(accountSearch)
  )

  // فتح نافذة سند جديد
  const handleOpenNewVoucher = () => {
    setSelectedVoucher(null)
    setAccountSearch('')
    setFormData({
      type: 'RECEIPT',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      accountId: '',
      accountName: '',
      accountCode: '',
      description: '',
      reference: '',
      paymentMethod: 'CASH',
      checkNumber: '',
      checkDate: '',
      bankName: '',
    })
    setDialogOpen(true)
  }

  // عرض تفاصيل سند
  const handleViewVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher)
    setDialogOpen(true)
  }

  // اختيار حساب
  const handleSelectAccount = (account: typeof accounts[0]) => {
    setFormData({
      ...formData,
      accountId: account.id,
      accountName: account.name,
      accountCode: account.code,
    })
    setAccountSearch(`${account.code} - ${account.name}`)
    setShowAccountDropdown(false)
  }

  // حفظ السند مع الترحيل التلقائي
  const handleSaveVoucher = async () => {
    if (!formData.accountId) {
      toast.error('يرجى اختيار الحساب')
      return
    }

    if (formData.amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح')
      return
    }

    if (!formData.description.trim()) {
      toast.error('يرجى إدخال البيان')
      return
    }

    if (formData.paymentMethod === 'CHECK') {
      if (!formData.checkNumber || !formData.checkDate || !formData.bankName) {
        toast.error('يرجى إدخال بيانات الشيك كاملة')
        return
      }
    }

    setIsCreating(true)

    try {
      const newVoucher: Voucher = {
        id: generateId(),
        voucherNumber: generateVoucherNumber(vouchers, formData.type),
        type: formData.type,
        date: formData.date,
        amount: formData.amount,
        accountId: formData.accountId,
        accountName: formData.accountName,
        accountCode: formData.accountCode,
        description: formData.description,
        reference: formData.reference || undefined,
        status: 'POSTED',
        paymentMethod: formData.paymentMethod,
        checkNumber: formData.paymentMethod === 'CHECK' ? formData.checkNumber : undefined,
        checkDate: formData.paymentMethod === 'CHECK' ? formData.checkDate : undefined,
        bankName: formData.paymentMethod === 'CHECK' ? formData.bankName : formData.paymentMethod === 'BANK_TRANSFER' ? formData.bankName : undefined,
        createdAt: new Date().toISOString(),
        createdBy: 'المستخدم الحالي',
      }

      setVouchers([newVoucher, ...vouchers])
      
      const journalEntryNumber = `JE-${String(vouchers.length + 1).padStart(4, '0')}`
      
      toast.success(`تم إنشاء وترحيل السند ${newVoucher.voucherNumber} مع القيد ${journalEntryNumber}`)
      setDialogOpen(false)
      
      setAccountSearch('')
      setFormData({
        type: 'RECEIPT',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        accountId: '',
        accountName: '',
        accountCode: '',
        description: '',
        reference: '',
        paymentMethod: 'CASH',
        checkNumber: '',
        checkDate: '',
        bankName: '',
      })
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ السند')
    } finally {
      setIsCreating(false)
    }
  }

  // إلغاء سند
  const handleCancelVoucher = async (id: string) => {
    if (confirm('هل أنت متأكد من إلغاء هذا السند؟')) {
      setVouchers(vouchers.map(v => 
        v.id === id ? { ...v, status: 'CANCELLED' as const } : v
      ))
      toast.success('تم إلغاء السند')
    }
  }

  // طباعة سند
  const handlePrintVoucher = (voucher: Voucher) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>سند ${voucher.type === 'RECEIPT' ? 'قبض' : 'صرف'} - ${voucher.voucherNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: ${voucher.type === 'RECEIPT' ? '#16a34a' : '#dc2626'}; }
          .voucher-number { font-size: 18px; margin-top: 10px; }
          .content { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; }
          .value { font-weight: bold; }
          .amount-box { background: ${voucher.type === 'RECEIPT' ? '#dcfce7' : '#fee2e2'}; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .amount { font-size: 28px; font-weight: bold; color: ${voucher.type === 'RECEIPT' ? '#16a34a' : '#dc2626'}; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">سند ${voucher.type === 'RECEIPT' ? 'قبض' : 'صرف'</div>
          <div class="voucher-number">رقم: ${voucher.voucherNumber}</div>
        </div>
        <div class="content">
          <div class="row">
            <span class="label">التاريخ:</span>
            <span class="value">${formatDate(voucher.date)}</span>
          </div>
          <div class="row">
            <span class="label">الحساب:</span>
            <span class="value">${voucher.accountCode} - ${voucher.accountName}</span>
          </div>
          <div class="row">
            <span class="label">طريقة الدفع:</span>
            <span class="value">${paymentMethodLabels[voucher.paymentMethod]}</span>
          </div>
          ${voucher.bankName ? `<div class="row"><span class="label">البنك:</span><span class="value">${voucher.bankName}</span></div>` : ''}
          ${voucher.checkNumber ? `<div class="row"><span class="label">رقم الشيك:</span><span class="value">${voucher.checkNumber}</span></div>` : ''}
          <div class="row">
            <span class="label">البيان:</span>
            <span class="value">${voucher.description}</span>
          </div>
          ${voucher.reference ? `<div class="row"><span class="label">المرجع:</span><span class="value">${voucher.reference}</span></div>` : ''}
        </div>
        <div class="amount-box">
          <div class="amount">${formatNumber(voucher.amount)} ج.م</div>
        </div>
        <div class="footer">
          <div class="signature">
            <div class="signature-line">المستلم</div>
          </div>
          <div class="signature">
            <div class="signature-line">المحاسب</div>
          </div>
          <div class="signature">
            <div class="signature-line">المراجع</div>
          </div>
        </div>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // تصفية السندات
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = search === '' || 
      voucher.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      voucher.description.includes(search)
    
    const matchesTab = activeTab === 'all' || voucher.type === activeTab
    
    return matchesSearch && matchesTab
  })

  // حساب المجاميع
  const totalReceipts = vouchers
    .filter(v => v.type === 'RECEIPT' && v.status === 'POSTED')
    .reduce((sum, v) => sum + v.amount, 0)

  const totalPayments = vouchers
    .filter(v => v.type === 'PAYMENT' && v.status === 'POSTED')
    .reduce((sum, v) => sum + v.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">السندات</h1>
            <p className="text-muted-foreground">Vouchers - سندات القبض والصرف</p>
          </div>
        </div>
        <Button onClick={handleOpenNewVoucher}>
          <Plus className="h-4 w-4 ml-2" />
          سند جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المقبوضات</p>
                <p className="text-xl font-bold text-green-600">{formatNumber(totalReceipts)} ج.م</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ArrowDownCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المدفوعات</p>
                <p className="text-xl font-bold text-red-600">{formatNumber(totalPayments)} ج.م</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي السندات</p>
                <p className="text-xl font-bold">{vouchers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مرحلة</p>
                <p className="text-xl font-bold">{vouchers.filter(v => v.status === 'POSTED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="RECEIPT">سندات قبض</TabsTrigger>
            <TabsTrigger value="PAYMENT">سندات صرف</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 print:hidden">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground print:hidden">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد سندات</p>
              <p className="text-sm mb-4">ابدأ بإنشاء سند جديد</p>
              <Button onClick={handleOpenNewVoucher}>
                <Plus className="h-4 w-4 ml-2" />
                سند جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم السند</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحساب</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="print:hidden">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher) => (
                  <TableRow key={voucher.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewVoucher(voucher)}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        {voucher.type === 'RECEIPT' ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-500" />
                        )}
                        {voucher.voucherNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={voucher.type === 'RECEIPT' ? 'default' : 'secondary'}>
                        {voucher.type === 'RECEIPT' ? 'قبض' : 'صرف'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatDate(voucher.date)}</TableCell>
                    <TableCell className={cn(
                      "font-mono font-medium",
                      voucher.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatNumber(voucher.amount)} ج.م
                    </TableCell>
                    <TableCell>{voucher.accountCode} - {voucher.accountName}</TableCell>
                    <TableCell>{paymentMethodLabels[voucher.paymentMethod]}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[voucher.status]}>
                        {statusLabels[voucher.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="print:hidden">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewVoucher(voucher) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePrintVoucher(voucher) }}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {voucher.status === 'POSTED' && (
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleCancelVoucher(voucher.id) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Voucher / View Voucher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVoucher ? `سند ${selectedVoucher.type === 'RECEIPT' ? 'قبض' : 'صرف'} رقم ${selectedVoucher.voucherNumber}` : 'سند جديد'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVoucher ? (
            // عرض السند الموجود
            <div className="space-y-4">
              {/* Voucher Header */}
              <div className={cn(
                "p-4 rounded-lg text-white",
                selectedVoucher.type === 'RECEIPT' ? 'bg-green-600' : 'bg-red-600'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedVoucher.type === 'RECEIPT' ? (
                      <ArrowUpCircle className="h-6 w-6" />
                    ) : (
                      <ArrowDownCircle className="h-6 w-6" />
                    )}
                    <span className="text-lg font-bold">
                      سند {selectedVoucher.type === 'RECEIPT' ? 'قبض' : 'صرف'}
                    </span>
                  </div>
                  <span className="font-mono">{selectedVoucher.voucherNumber}</span>
                </div>
              </div>

              {/* Voucher Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">التاريخ</p>
                  <p className="font-medium font-mono">{formatDate(selectedVoucher.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المبلغ</p>
                  <p className={cn(
                    "font-bold text-lg font-mono",
                    selectedVoucher.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatNumber(selectedVoucher.amount)} ج.م
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الحساب</p>
                  <p className="font-medium">{selectedVoucher.accountCode} - {selectedVoucher.accountName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">{paymentMethodLabels[selectedVoucher.paymentMethod]}</p>
                </div>
              </div>

              {/* Bank Details if applicable */}
              {selectedVoucher.paymentMethod !== 'CASH' && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  {selectedVoucher.bankName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">البنك</span>
                      <span>{selectedVoucher.bankName}</span>
                    </div>
                  )}
                  {selectedVoucher.checkNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم الشيك</span>
                      <span className="font-mono">{selectedVoucher.checkNumber}</span>
                    </div>
                  )}
                  {selectedVoucher.checkDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الشيك</span>
                      <span className="font-mono">{formatDate(selectedVoucher.checkDate)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">البيان</p>
                <p className="p-3 bg-muted/50 rounded-lg">{selectedVoucher.description}</p>
              </div>

              {/* Reference */}
              {selectedVoucher.reference && (
                <div>
                  <p className="text-xs text-muted-foreground">المرجع</p>
                  <p className="font-mono">{selectedVoucher.reference}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[selectedVoucher.status]}>
                    {statusLabels[selectedVoucher.status]}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  بواسطة: {selectedVoucher.createdBy}
                </div>
              </div>
            </div>
          ) : (
            // فورم السند الجديد
            <div className="space-y-4">
              {/* نوع السند */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={formData.type === 'RECEIPT' ? 'default' : 'outline'}
                  className={cn(
                    "h-20 flex-col gap-2",
                    formData.type === 'RECEIPT' && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => setFormData({ ...formData, type: 'RECEIPT' })}
                >
                  <ArrowUpCircle className="h-6 w-6" />
                  <span>سند قبض</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'PAYMENT' ? 'default' : 'outline'}
                  className={cn(
                    "h-20 flex-col gap-2",
                    formData.type === 'PAYMENT' && "bg-red-600 hover:bg-red-700"
                  )}
                  onClick={() => setFormData({ ...formData, type: 'PAYMENT' })}
                >
                  <ArrowDownCircle className="h-6 w-6" />
                  <span>سند صرف</span>
                </Button>
              </div>

              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>المبلغ</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="text-lg font-bold font-mono"
                  />
                </div>
                <div>
                  <Label>المرجع (اختياري)</Label>
                  <Input
                    placeholder="مثال: INV-0001"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* الحساب - بحث */}
              <div ref={accountDropdownRef} className="relative">
                <Label>الحساب</Label>
                <div className="relative">
                  <Input
                    placeholder="ابحث عن حساب بالاسم أو الكود..."
                    value={accountSearch}
                    onChange={(e) => {
                      setAccountSearch(e.target.value)
                      setShowAccountDropdown(true)
                      if (!e.target.value) {
                        setFormData({ ...formData, accountId: '', accountName: '', accountCode: '' })
                      }
                    }}
                    onFocus={() => setShowAccountDropdown(true)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {formData.accountId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => {
                        setAccountSearch('')
                        setFormData({ ...formData, accountId: '', accountName: '', accountCode: '' })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* القائمة المنسدلة */}
                {showAccountDropdown && accountSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                          onClick={() => handleSelectAccount(account)}
                        >
                          <span>{account.name}</span>
                          <span className="text-muted-foreground font-mono text-sm">{account.code}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-muted-foreground text-center">
                        لا توجد نتائج
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* طريقة الدفع */}
              <div>
                <Label>طريقة الدفع</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD') => 
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">نقدي</SelectItem>
                    <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                    <SelectItem value="CHECK">شيك</SelectItem>
                    <SelectItem value="CARD">بطاقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* بيانات البنك للتحويل */}
              {formData.paymentMethod === 'BANK_TRANSFER' && (
                <div>
                  <Label>اسم البنك</Label>
                  <Input
                    placeholder="اسم البنك"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
              )}

              {/* بيانات الشيك */}
              {formData.paymentMethod === 'CHECK' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label>اسم البنك</Label>
                    <Input
                      placeholder="اسم البنك"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>رقم الشيك</Label>
                    <Input
                      placeholder="رقم الشيك"
                      value={formData.checkNumber}
                      onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label>تاريخ الشيك</Label>
                    <Input
                      type="date"
                      value={formData.checkDate}
                      onChange={(e) => setFormData({ ...formData, checkDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* البيان */}
              <div>
                <Label>البيان</Label>
                <Textarea
                  placeholder="وصف السند..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* ملخص */}
              <div className={cn(
                "p-4 rounded-lg",
                formData.type === 'RECEIPT' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {formData.type === 'RECEIPT' ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {formData.type === 'RECEIPT' ? 'سند قبض' : 'سند صرف'}
                    </span>
                  </div>
                  <div className={cn(
                    "text-xl font-bold font-mono",
                    formData.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatNumber(formData.amount || 0)} ج.م
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {!selectedVoucher && (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSaveVoucher} 
                  disabled={!formData.amount || !formData.accountId || isCreating}
                  className={cn(
                    "gap-2",
                    formData.type === 'RECEIPT' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      حفظ وترحيل
                    </>
                  )}
                </Button>
              </>
            )}
            {selectedVoucher && (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إغلاق
                </Button>
                <Button onClick={() => handlePrintVoucher(selectedVoucher)}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
