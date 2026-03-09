'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Search, Loader2, Edit, Trash2, FileText, 
  Calendar, DollarSign, Printer, Eye, ArrowUpCircle, ArrowDownCircle
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
  description: string
  reference?: string
  status: 'DRAFT' | 'POSTED' | 'CANCELLED'
  paymentMethod: string
  checkNumber?: string
  checkDate?: string
  bankName?: string
  createdAt: string
  createdBy: string
}

// Sample vouchers
const sampleVouchers: Voucher[] = [
  {
    id: '1',
    voucherNumber: 'RV-0001',
    type: 'RECEIPT',
    date: '2024-01-15',
    amount: 5000,
    accountId: '1.1',
    accountName: 'النقدية والبنوك',
    description: 'مقبوضات من العميل أحمد محمد',
    reference: 'INV-0001',
    status: 'POSTED',
    paymentMethod: 'CASH',
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'سارة أحمد',
  },
  {
    id: '2',
    voucherNumber: 'PV-0001',
    type: 'PAYMENT',
    date: '2024-01-16',
    amount: 15000,
    accountId: '2.1',
    accountName: 'الموردين',
    description: 'مدفوعات للمورد شركة التوريدات',
    reference: 'PO-0010',
    status: 'POSTED',
    paymentMethod: 'BANK_TRANSFER',
    bankName: 'البنك الأهلي',
    createdAt: '2024-01-16T14:00:00Z',
    createdBy: 'محمد علي',
  },
  {
    id: '3',
    voucherNumber: 'RV-0002',
    type: 'RECEIPT',
    date: '2024-01-17',
    amount: 8000,
    accountId: '1.1',
    accountName: 'النقدية والبنوك',
    description: 'سداد قسط من العميل محمود حسن',
    status: 'DRAFT',
    paymentMethod: 'CHECK',
    checkNumber: 'CHK-123456',
    checkDate: '2024-01-20',
    bankName: 'بنك مصر',
    createdAt: '2024-01-17T09:15:00Z',
    createdBy: 'أحمد محمد',
  },
  {
    id: '4',
    voucherNumber: 'PV-0002',
    type: 'PAYMENT',
    date: '2024-01-18',
    amount: 3500,
    accountId: '5.2',
    accountName: 'المصروفات التشغيلية',
    description: 'صيانة أجهزة المكتب',
    status: 'POSTED',
    paymentMethod: 'CASH',
    createdAt: '2024-01-18T11:00:00Z',
    createdBy: 'سارة أحمد',
  },
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

export default function VouchersManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      setVouchers(sampleVouchers)
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher)
    setDialogOpen(true)
  }

  const handlePrintVoucher = (voucher: Voucher) => {
    toast.success(`جاري طباعة السند ${voucher.voucherNumber}`)
  }

  // Filter vouchers
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = search === '' || 
      voucher.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      voucher.description.includes(search)
    
    const matchesTab = activeTab === 'all' || voucher.type === activeTab
    
    return matchesSearch && matchesTab
  })

  // Calculate totals
  const totalReceipts = vouchers
    .filter(v => v.type === 'RECEIPT' && v.status === 'POSTED')
    .reduce((sum, v) => sum + v.amount, 0)

  const totalPayments = vouchers
    .filter(v => v.type === 'PAYMENT' && v.status === 'POSTED')
    .reduce((sum, v) => sum + v.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">السندات</h1>
            <p className="text-muted-foreground">Vouchers - سندات القبض والصرف</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          سند جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المقبوضات</p>
                <p className="text-xl font-bold text-green-600">{totalReceipts.toLocaleString('ar-EG')} ج.م</p>
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
                <p className="text-xl font-bold text-red-600">{totalPayments.toLocaleString('ar-EG')} ج.م</p>
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
                <p className="text-xs text-muted-foreground">مسودات</p>
                <p className="text-xl font-bold">{vouchers.filter(v => v.status === 'DRAFT').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  <TableHead>إجراءات</TableHead>
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
                    <TableCell>{new Date(voucher.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell className={cn(
                      "font-mono font-medium",
                      voucher.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {voucher.amount.toLocaleString('ar-EG')} ج.م
                    </TableCell>
                    <TableCell>{voucher.accountName}</TableCell>
                    <TableCell>{paymentMethodLabels[voucher.paymentMethod]}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[voucher.status]}>
                        {statusLabels[voucher.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewVoucher(voucher) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePrintVoucher(voucher) }}>
                          <Printer className="h-4 w-4" />
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

      {/* View Voucher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedVoucher ? `سند ${selectedVoucher.type === 'RECEIPT' ? 'قبض' : 'صرف'} رقم ${selectedVoucher.voucherNumber}` : 'سند جديد'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVoucher && (
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
                  <p className="font-medium">{new Date(selectedVoucher.date).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المبلغ</p>
                  <p className={cn(
                    "font-bold text-lg",
                    selectedVoucher.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {selectedVoucher.amount.toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الحساب</p>
                  <p className="font-medium">{selectedVoucher.accountName}</p>
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
                      <span>{new Date(selectedVoucher.checkDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">البيان</p>
                <p className="p-3 bg-muted/50 rounded-lg">{selectedVoucher.description}</p>
              </div>

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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إغلاق
            </Button>
            {selectedVoucher && (
              <Button onClick={() => handlePrintVoucher(selectedVoucher)}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
