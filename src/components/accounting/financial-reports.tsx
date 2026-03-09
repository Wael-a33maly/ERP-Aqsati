'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, Download, Printer, Calendar, TrendingUp, TrendingDown,
  DollarSign, Building2, CreditCard, PieChart, LineChart, FileSpreadsheet,
  User, Users, Search, FileText, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Sample financial data
const balanceSheetData = {
  assets: {
    current: [
      { name: 'النقدية والبنوك', amount: 50000 },
      { name: 'العملاء', amount: 75000 },
      { name: 'المخزون', amount: 25000 },
      { name: 'مدينون آخرون', amount: 5000 },
    ],
    fixed: [
      { name: 'الأصول الثابتة', amount: 150000 },
      { name: 'الإهلاك المتراكم', amount: -30000 },
      { name: 'أصول أخرى', amount: 10000 },
    ],
    total: 285000,
  },
  liabilities: {
    current: [
      { name: 'الموردين', amount: 45000 },
      { name: 'دائنون آخرون', amount: 15000 },
      { name: 'مستحقات', amount: 20000 },
    ],
    longTerm: [
      { name: 'قروض طويلة الأجل', amount: 50000 },
    ],
    total: 130000,
  },
  equity: {
    items: [
      { name: 'رأس المال', amount: 100000 },
      { name: 'الأرباح المحتجزة', amount: 55000 },
    ],
    total: 155000,
  },
}

const incomeStatementData = {
  revenue: [
    { name: 'المبيعات', amount: 500000 },
    { name: 'إيرادات أخرى', amount: 25000 },
  ],
  costOfSales: [
    { name: 'تكلفة البضاعة المباعة', amount: 300000 },
  ],
  expenses: [
    { name: 'مصروفات البيع والتوزيع', amount: 50000 },
    { name: 'مصروفات إدارية وعمومية', amount: 35000 },
    { name: 'مصروفات أخرى', amount: 10000 },
  ],
  grossProfit: 225000,
  netProfit: 130000,
}

const cashFlowData = {
  operating: [
    { name: 'صافي الربح', amount: 130000 },
    { name: 'تعديلات الإهلاك', amount: 15000 },
    { name: 'تغيرات رأس المال العامل', amount: -20000 },
  ],
  investing: [
    { name: 'شراء أصول ثابتة', amount: -40000 },
  ],
  financing: [
    { name: 'سداد قروض', amount: -25000 },
    { name: 'توزيعات', amount: -10000 },
  ],
  netChange: 50000,
  openingBalance: 30000,
  closingBalance: 80000,
}

// بيانات العملاء والموردين
const customers = [
  { id: 'C001', name: 'أحمد محمد علي', phone: '01012345678', balance: 15000 },
  { id: 'C002', name: 'محمود حسن إبراهيم', phone: '01023456789', balance: 8500 },
  { id: 'C003', name: 'شركة النور للتجارة', phone: '01034567890', balance: 45000 },
  { id: 'C004', name: 'فاطمة عبدالله سالم', phone: '01045678901', balance: 3200 },
  { id: 'C005', name: 'مؤسسة الأمل التجارية', phone: '01056789012', balance: 28000 },
]

const suppliers = [
  { id: 'S001', name: 'شركة التوريدات الحديثة', phone: '01112345678', balance: 35000 },
  { id: 'S002', name: 'مؤسسة الخليج للتجارة', phone: '01123456789', balance: 22000 },
  { id: 'S003', name: 'شركة الشرق الأوسط', phone: '01134567890', balance: 18000 },
  { id: 'S004', name: 'مصنع الإنتاج الصناعي', phone: '01145678901', balance: 55000 },
  { id: 'S005', name: 'شركة التكنولوجيا المتقدمة', phone: '01156789012', balance: 12000 },
]

// أنواع الحركات في كشف الحساب
interface AccountTransaction {
  id: string
  date: string
  type: 'INVOICE' | 'PAYMENT' | 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'OPENING'
  reference: string
  debit: number
  credit: number
  balance: number
  description: string
}

export default function FinancialReportsManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [activeReport, setActiveReport] = useState('balance-sheet')
  
  // كشف الحساب
  const [accountStatementOpen, setAccountStatementOpen] = useState(false)
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([])
  const [loadingStatement, setLoadingStatement] = useState(false)

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ${activeReport} as ${format}`)
    toast.success(`جاري تصدير التقرير بصيغة ${format === 'pdf' ? 'PDF' : 'Excel'}`)
  }

  const handlePrint = () => {
    window.print()
  }

  // فتح نافذة كشف الحساب
  const handleOpenAccountStatement = () => {
    setAccountStatementOpen(true)
    setSelectedAccountId('')
    setDateFrom('')
    setDateTo('')
    setAccountTransactions([])
  }

  // توليد كشف الحساب
  const handleGenerateStatement = async () => {
    if (!selectedAccountId) {
      toast.error('يرجى اختيار الحساب')
      return
    }

    setLoadingStatement(true)
    
    // محاكاة API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const account = accountType === 'CUSTOMER' 
      ? customers.find(c => c.id === selectedAccountId)
      : suppliers.find(s => s.id === selectedAccountId)

    if (!account) {
      toast.error('الحساب غير موجود')
      setLoadingStatement(false)
      return
    }

    // توليد حركات تجريبية
    const transactions: AccountTransaction[] = [
      {
        id: '1',
        date: '2024-01-01',
        type: 'OPENING',
        reference: 'رصيد افتتاحي',
        debit: 0,
        credit: 0,
        balance: account.balance * 0.3,
        description: 'رصيد افتتاحي من الفترة السابقة',
      },
      {
        id: '2',
        date: '2024-01-15',
        type: 'INVOICE',
        reference: 'INV-0001',
        debit: 5000,
        credit: 0,
        balance: account.balance * 0.3 + 5000,
        description: 'فاتورة مبيعات',
      },
      {
        id: '3',
        date: '2024-01-20',
        type: 'RECEIPT',
        reference: 'RV-0001',
        debit: 0,
        credit: 3000,
        balance: account.balance * 0.3 + 2000,
        description: 'سند قبض',
      },
      {
        id: '4',
        date: '2024-02-05',
        type: 'INVOICE',
        reference: 'INV-0005',
        debit: 8500,
        credit: 0,
        balance: account.balance * 0.3 + 10500,
        description: 'فاتورة مبيعات',
      },
      {
        id: '5',
        date: '2024-02-15',
        type: 'PAYMENT',
        reference: 'PV-0002',
        debit: 0,
        credit: 5500,
        balance: account.balance * 0.3 + 5000,
        description: 'سند صرف',
      },
      {
        id: '6',
        date: '2024-02-28',
        type: 'CREDIT_NOTE',
        reference: 'CN-0001',
        debit: 0,
        credit: 1000,
        balance: account.balance * 0.3 + 4000,
        description: 'إشعار دائن - مرتجع',
      },
      {
        id: '7',
        date: '2024-03-10',
        type: 'INVOICE',
        reference: 'INV-0012',
        debit: 12000,
        credit: 0,
        balance: account.balance * 0.3 + 16000,
        description: 'فاتورة مبيعات',
      },
    ]

    setAccountTransactions(transactions)
    setLoadingStatement(false)
    toast.success('تم توليد كشف الحساب')
  }

  // حساب إجمالي المدين والدائن
  const totalDebit = accountTransactions.reduce((sum, t) => sum + t.debit, 0)
  const totalCredit = accountTransactions.reduce((sum, t) => sum + t.credit, 0)
  const finalBalance = accountTransactions.length > 0 
    ? accountTransactions[accountTransactions.length - 1].balance 
    : 0

  // نوع الحركة
  const transactionTypeLabels: Record<string, { label: string; color: string }> = {
    INVOICE: { label: 'فاتورة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    PAYMENT: { label: 'سند صرف', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    RECEIPT: { label: 'سند قبض', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    CREDIT_NOTE: { label: 'إشعار دائن', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    DEBIT_NOTE: { label: 'إشعار مدين', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    OPENING: { label: 'رصيد افتتاحي', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التقارير المالية</h1>
            <p className="text-muted-foreground">Financial Reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenAccountStatement}>
            <User className="h-4 w-4 ml-2" />
            كشف حساب
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="السنة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">الفترة الحالية</SelectItem>
            <SelectItem value="q1">الربع الأول</SelectItem>
            <SelectItem value="q2">الربع الثاني</SelectItem>
            <SelectItem value="q3">الربع الثالث</SelectItem>
            <SelectItem value="q4">الربع الرابع</SelectItem>
            <SelectItem value="annual">سنوي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance-sheet">الميزانية العمومية</TabsTrigger>
          <TabsTrigger value="income-statement">قائمة الدخل</TabsTrigger>
          <TabsTrigger value="cash-flow">قائمة التدفقات النقدية</TabsTrigger>
        </TabsList>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  الأصول (Assets)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Assets */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الأصول المتداولة</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.assets.current.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الأصول المتداولة</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.assets.current.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Fixed Assets */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الأصول الثابتة</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.assets.fixed.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className={cn(
                              "text-left font-mono",
                              item.amount < 0 && 'text-red-600'
                            )}>{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الأصول الثابتة</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.assets.fixed.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Assets */}
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-green-700 dark:text-green-400">إجمالي الأصول</span>
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">
                      {balanceSheetData.assets.total.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  الخصوم وحقوق الملكية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Liabilities */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الخصوم المتداولة</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.liabilities.current.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Long-term Liabilities */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الخصوم طويلة الأجل</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.liabilities.longTerm.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الخصوم</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.liabilities.total.toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Equity */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">حقوق الملكية</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.equity.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي حقوق الملكية</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.equity.total.toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Liabilities & Equity */}
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-red-700 dark:text-red-400">إجمالي الخصوم وحقوق الملكية</span>
                    <span className="font-mono font-bold text-red-700 dark:text-red-400">
                      {(balanceSheetData.liabilities.total + balanceSheetData.equity.total).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income-statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-500" />
                قائمة الدخل - Income Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Revenue */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">الإيرادات</h4>
                  <Table>
                    <TableBody>
                      {incomeStatementData.revenue.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-green-600">{item.amount.toLocaleString('ar-EG')}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-green-50 dark:bg-green-900/20">
                        <TableCell className="font-medium">إجمالي الإيرادات</TableCell>
                        <TableCell className="text-left font-mono font-bold text-green-600">
                          {incomeStatementData.revenue.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Cost of Sales */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">تكلفة المبيعات</h4>
                  <Table>
                    <TableBody>
                      {incomeStatementData.costOfSales.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">({item.amount.toLocaleString('ar-EG')})</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Gross Profit */}
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-blue-700 dark:text-blue-400">إجمالي الربح</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    {incomeStatementData.grossProfit.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                {/* Expenses */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">المصروفات</h4>
                  <Table>
                    <TableBody>
                      {incomeStatementData.expenses.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">({item.amount.toLocaleString('ar-EG')})</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-red-50 dark:bg-red-900/20">
                        <TableCell className="font-medium">إجمالي المصروفات</TableCell>
                        <TableCell className="text-left font-mono font-bold text-red-600">
                          ({incomeStatementData.expenses.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')})
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Profit */}
                <div className="p-4 bg-gradient-to-l from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-xl text-green-700 dark:text-green-400">صافي الربح</span>
                  <span className="font-mono font-bold text-2xl text-green-700 dark:text-green-400">
                    {incomeStatementData.netProfit.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-500" />
                قائمة التدفقات النقدية - Cash Flow Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Operating Activities */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">أنشطة تشغيلية</h4>
                  <Table>
                    <TableBody>
                      {cashFlowData.operating.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className={cn(
                            "text-left font-mono",
                            item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {item.amount >= 0 ? '' : '('}{Math.abs(item.amount).toLocaleString('ar-EG')}{item.amount >= 0 ? '' : ')'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Investing Activities */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">أنشطة استثمارية</h4>
                  <Table>
                    <TableBody>
                      {cashFlowData.investing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">
                            ({Math.abs(item.amount).toLocaleString('ar-EG')})
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Financing Activities */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">أنشطة تمويلية</h4>
                  <Table>
                    <TableBody>
                      {cashFlowData.financing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">
                            ({Math.abs(item.amount).toLocaleString('ar-EG')})
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="font-medium">صافي التغير في النقدية</span>
                    <span className="font-mono font-bold text-green-600">
                      {cashFlowData.netChange.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="font-medium">رصيد الافتتاح</span>
                    <span className="font-mono">{cashFlowData.openingBalance.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-purple-700 dark:text-purple-400">رصيد الإقفال</span>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                      {cashFlowData.closingBalance.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Statement Dialog */}
      <Dialog open={accountStatementOpen} onOpenChange={setAccountStatementOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              كشف حساب - Account Statement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* نوع الحساب */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={accountType === 'CUSTOMER' ? 'default' : 'outline'}
                className={cn(
                  "h-16 flex-col gap-1",
                  accountType === 'CUSTOMER' && "bg-blue-600 hover:bg-blue-700"
                )}
                onClick={() => { setAccountType('CUSTOMER'); setSelectedAccountId(''); }}
              >
                <Users className="h-5 w-5" />
                <span>عميل</span>
              </Button>
              <Button
                type="button"
                variant={accountType === 'SUPPLIER' ? 'default' : 'outline'}
                className={cn(
                  "h-16 flex-col gap-1",
                  accountType === 'SUPPLIER' && "bg-orange-600 hover:bg-orange-700"
                )}
                onClick={() => { setAccountType('SUPPLIER'); setSelectedAccountId(''); }}
              >
                <Building2 className="h-5 w-5" />
                <span>مورد</span>
              </Button>
            </div>

            {/* اختيار الحساب */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>{accountType === 'CUSTOMER' ? 'العميل' : 'المورد'}</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`اختر ${accountType === 'CUSTOMER' ? 'العميل' : 'المورد'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(accountType === 'CUSTOMER' ? customers : suppliers).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-muted-foreground mr-2">
                            (رصيد: {account.balance.toLocaleString('ar-EG')} ج.م)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleGenerateStatement} 
                  disabled={!selectedAccountId || loadingStatement}
                  className="w-full"
                >
                  {loadingStatement ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 ml-2" />
                      عرض الكشف
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* نطاق التاريخ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* كشف الحساب */}
            {accountTransactions.length > 0 && (
              <div className="space-y-4">
                {/* معلومات الحساب */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {accountType === 'CUSTOMER' ? 'العميل' : 'المورد'}
                      </p>
                      <p className="font-bold text-lg">
                        {(accountType === 'CUSTOMER' ? customers : suppliers).find(a => a.id === selectedAccountId)?.name}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                      <p className={cn(
                        "font-bold text-xl",
                        finalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {finalBalance.toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                  </div>
                </div>

                {/* جدول الحركات */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>النوع</TableHead>
                          <TableHead>المرجع</TableHead>
                          <TableHead>البيان</TableHead>
                          <TableHead className="text-left">مدين</TableHead>
                          <TableHead className="text-left">دائن</TableHead>
                          <TableHead className="text-left">الرصيد</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-mono text-sm">
                              {new Date(transaction.date).toLocaleDateString('ar-EG')}
                            </TableCell>
                            <TableCell>
                              <Badge className={transactionTypeLabels[transaction.type].color}>
                                {transactionTypeLabels[transaction.type].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {transaction.reference}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="text-left font-mono text-green-600">
                              {transaction.debit > 0 ? transaction.debit.toLocaleString('ar-EG') : '-'}
                            </TableCell>
                            <TableCell className="text-left font-mono text-red-600">
                              {transaction.credit > 0 ? transaction.credit.toLocaleString('ar-EG') : '-'}
                            </TableCell>
                            <TableCell className={cn(
                              "text-left font-mono font-medium",
                              transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {transaction.balance.toLocaleString('ar-EG')}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* صف الإجمالي */}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell colSpan={4}>الإجمالي</TableCell>
                          <TableCell className="text-left font-mono text-green-600">
                            {totalDebit.toLocaleString('ar-EG')}
                          </TableCell>
                          <TableCell className="text-left font-mono text-red-600">
                            {totalCredit.toLocaleString('ar-EG')}
                          </TableCell>
                          <TableCell className={cn(
                            "text-left font-mono",
                            finalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {finalBalance.toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* ملخص */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">إجمالي المدين</p>
                          <p className="text-xl font-bold text-green-600 font-mono">
                            {totalDebit.toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">إجمالي الدائن</p>
                          <p className="text-xl font-bold text-red-600 font-mono">
                            {totalCredit.toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">الرصيد النهائي</p>
                          <p className={cn(
                            "text-xl font-bold font-mono",
                            finalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {finalBalance.toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* رسالة فارغة */}
            {accountTransactions.length === 0 && selectedAccountId && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>اضغط "عرض الكشف" لعرض حركات الحساب</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountStatementOpen(false)}>
              إغلاق
            </Button>
            {accountTransactions.length > 0 && (
              <>
                <Button variant="outline" onClick={() => toast.success('جاري تصدير Excel...')}>
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  Excel
                </Button>
                <Button onClick={() => toast.success('جاري الطباعة...')}>
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
