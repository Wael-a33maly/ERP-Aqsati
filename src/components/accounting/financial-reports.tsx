'use client'

import { useState, useEffect, useRef } from 'react'
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
  User, Users, Search, FileText, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// تنسيق الأرقام بالإنجليزية
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

// تنسيق التاريخ بالإنجليزية
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-CA')
}

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
  const [selectedAccountName, setSelectedAccountName] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([])
  const [loadingStatement, setLoadingStatement] = useState(false)

  // بحث العملاء/الموردين
  const [accountSearch, setAccountSearch] = useState('')
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // إغلاق القائمة المنسدلة عند النقر خارجها
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ${activeReport} as ${format}`)
    toast.success(`جاري تصدير التقرير بصيغة ${format === 'pdf' ? 'PDF' : 'Excel'}`)
  }

  // طباعة التقرير الحالي
  const handlePrint = () => {
    let printContent = ''
    
    if (activeReport === 'balance-sheet') {
      printContent = generateBalanceSheetPrint()
    } else if (activeReport === 'income-statement') {
      printContent = generateIncomeStatementPrint()
    } else if (activeReport === 'cash-flow') {
      printContent = generateCashFlowPrint()
    }

    const printWindow = window.open('', '_blank')
    if (printWindow && printContent) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // توليد محتوى طباعة الميزانية
  const generateBalanceSheetPrint = () => {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>الميزانية العمومية</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .date { font-size: 14px; margin-top: 10px; color: #666; }
          .section { margin: 20px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: right; }
          td:last-child { text-align: left; font-family: monospace; }
          .total-row { background: #f3f4f6; font-weight: bold; }
          .grand-total { background: #e5e7eb; font-weight: bold; font-size: 16px; }
          .assets { color: #16a34a; }
          .liabilities { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">الميزانية العمومية</div>
          <div class="date">Balance Sheet - ${selectedYear}</div>
        </div>
        
        <div class="section">
          <div class="section-title assets">الأصول (Assets)</div>
          <table>
            <tbody>
              <tr><td colspan="2" style="font-weight: bold; color: #666;">الأصول المتداولة</td></tr>
              ${balanceSheetData.assets.current.map(item => `
                <tr><td>${item.name}</td><td>${formatNumber(item.amount)}</td></tr>
              `).join('')}
              <tr class="total-row">
                <td>إجمالي الأصول المتداولة</td>
                <td>${formatNumber(balanceSheetData.assets.current.reduce((s, a) => s + a.amount, 0))}</td>
              </tr>
              <tr><td colspan="2" style="font-weight: bold; color: #666; padding-top: 15px;">الأصول الثابتة</td></tr>
              ${balanceSheetData.assets.fixed.map(item => `
                <tr><td>${item.name}</td><td style="color: ${item.amount < 0 ? '#dc2626' : '#000'}">${formatNumber(item.amount)}</td></tr>
              `).join('')}
              <tr class="total-row">
                <td>إجمالي الأصول الثابتة</td>
                <td>${formatNumber(balanceSheetData.assets.fixed.reduce((s, a) => s + a.amount, 0))}</td>
              </tr>
              <tr class="grand-total assets">
                <td>إجمالي الأصول</td>
                <td>${formatNumber(balanceSheetData.assets.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title liabilities">الخصوم وحقوق الملكية</div>
          <table>
            <tbody>
              <tr><td colspan="2" style="font-weight: bold; color: #666;">الخصوم المتداولة</td></tr>
              ${balanceSheetData.liabilities.current.map(item => `
                <tr><td>${item.name}</td><td>${formatNumber(item.amount)}</td></tr>
              `).join('')}
              <tr><td colspan="2" style="font-weight: bold; color: #666; padding-top: 15px;">الخصوم طويلة الأجل</td></tr>
              ${balanceSheetData.liabilities.longTerm.map(item => `
                <tr><td>${item.name}</td><td>${formatNumber(item.amount)}</td></tr>
              `).join('')}
              <tr class="total-row">
                <td>إجمالي الخصوم</td>
                <td>${formatNumber(balanceSheetData.liabilities.total)}</td>
              </tr>
              <tr><td colspan="2" style="font-weight: bold; color: #666; padding-top: 15px;">حقوق الملكية</td></tr>
              ${balanceSheetData.equity.items.map(item => `
                <tr><td>${item.name}</td><td>${formatNumber(item.amount)}</td></tr>
              `).join('')}
              <tr class="total-row">
                <td>إجمالي حقوق الملكية</td>
                <td>${formatNumber(balanceSheetData.equity.total)}</td>
              </tr>
              <tr class="grand-total liabilities">
                <td>إجمالي الخصوم وحقوق الملكية</td>
                <td>${formatNumber(balanceSheetData.liabilities.total + balanceSheetData.equity.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `
  }

  // توليد محتوى طباعة قائمة الدخل
  const generateIncomeStatementPrint = () => {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>قائمة الدخل</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .date { font-size: 14px; margin-top: 10px; color: #666; }
          .section { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px; text-align: right; }
          td:last-child { text-align: left; font-family: monospace; }
          .total-row { background: #f3f4f6; font-weight: bold; }
          .profit { background: #dcfce7; font-weight: bold; }
          .net-profit { background: linear-gradient(to left, #dcfce7, #bbf7d0); font-weight: bold; font-size: 18px; }
          .green { color: #16a34a; }
          .red { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">قائمة الدخل</div>
          <div class="date">Income Statement - ${selectedYear}</div>
        </div>
        
        <table>
          <tbody>
            <tr><td colspan="2" style="font-weight: bold;">الإيرادات</td></tr>
            ${incomeStatementData.revenue.map(item => `
              <tr><td>${item.name}</td><td class="green">${formatNumber(item.amount)}</td></tr>
            `).join('')}
            <tr class="total-row">
              <td>إجمالي الإيرادات</td>
              <td class="green">${formatNumber(incomeStatementData.revenue.reduce((s, a) => s + a.amount, 0))}</td>
            </tr>
            
            <tr><td colspan="2" style="font-weight: bold; padding-top: 15px;">تكلفة المبيعات</td></tr>
            ${incomeStatementData.costOfSales.map(item => `
              <tr><td>${item.name}</td><td class="red">(${formatNumber(item.amount)})</td></tr>
            `).join('')}
            
            <tr class="profit">
              <td>إجمالي الربح</td>
              <td>${formatNumber(incomeStatementData.grossProfit)}</td>
            </tr>
            
            <tr><td colspan="2" style="font-weight: bold; padding-top: 15px;">المصروفات</td></tr>
            ${incomeStatementData.expenses.map(item => `
              <tr><td>${item.name}</td><td class="red">(${formatNumber(item.amount)})</td></tr>
            `).join('')}
            <tr class="total-row">
              <td>إجمالي المصروفات</td>
              <td class="red">(${formatNumber(incomeStatementData.expenses.reduce((s, a) => s + a.amount, 0))})</td>
            </tr>
            
            <tr class="net-profit">
              <td>صافي الربح</td>
              <td class="green">${formatNumber(incomeStatementData.netProfit)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `
  }

  // توليد محتوى طباعة قائمة التدفقات النقدية
  const generateCashFlowPrint = () => {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>قائمة التدفقات النقدية</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .date { font-size: 14px; margin-top: 10px; color: #666; }
          .section { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px; text-align: right; }
          td:last-child { text-align: left; font-family: monospace; }
          .total-row { background: #f3f4f6; font-weight: bold; }
          .green { color: #16a34a; }
          .red { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">قائمة التدفقات النقدية</div>
          <div class="date">Cash Flow Statement - ${selectedYear}</div>
        </div>
        
        <table>
          <tbody>
            <tr><td colspan="2" style="font-weight: bold;">أنشطة تشغيلية</td></tr>
            ${cashFlowData.operating.map(item => `
              <tr><td>${item.name}</td><td class="${item.amount >= 0 ? 'green' : 'red'}">${item.amount >= 0 ? '' : '('}${formatNumber(Math.abs(item.amount))}${item.amount >= 0 ? '' : ')'}</td></tr>
            `).join('')}
            
            <tr><td colspan="2" style="font-weight: bold; padding-top: 15px;">أنشطة استثمارية</td></tr>
            ${cashFlowData.investing.map(item => `
              <tr><td>${item.name}</td><td class="red">(${formatNumber(Math.abs(item.amount))})</td></tr>
            `).join('')}
            
            <tr><td colspan="2" style="font-weight: bold; padding-top: 15px;">أنشطة تمويلية</td></tr>
            ${cashFlowData.financing.map(item => `
              <tr><td>${item.name}</td><td class="red">(${formatNumber(Math.abs(item.amount))})</td></tr>
            `).join('')}
            
            <tr class="total-row">
              <td>صافي التغير في النقدية</td>
              <td class="green">${formatNumber(cashFlowData.netChange)}</td>
            </tr>
            <tr class="total-row">
              <td>رصيد الافتتاح</td>
              <td>${formatNumber(cashFlowData.openingBalance)}</td>
            </tr>
            <tr class="total-row" style="background: #e9d5ff;">
              <td>رصيد الإقفال</td>
              <td>${formatNumber(cashFlowData.closingBalance)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `
  }

  // فتح نافذة كشف الحساب
  const handleOpenAccountStatement = () => {
    setAccountStatementOpen(true)
    setSelectedAccountId('')
    setSelectedAccountName('')
    setAccountSearch('')
    setDateFrom('')
    setDateTo('')
    setAccountTransactions([])
  }

  // تصفية الحسابات حسب البحث
  const getFilteredAccounts = () => {
    const accountList = accountType === 'CUSTOMER' ? customers : suppliers
    return accountList.filter(account => 
      account.name.includes(accountSearch) ||
      account.id.toLowerCase().includes(accountSearch.toLowerCase()) ||
      account.phone.includes(accountSearch)
    )
  }

  // اختيار حساب
  const handleSelectAccount = (account: typeof customers[0] | typeof suppliers[0]) => {
    setSelectedAccountId(account.id)
    setSelectedAccountName(account.name)
    setAccountSearch(`${account.id} - ${account.name}`)
    setShowAccountDropdown(false)
  }

  // توليد كشف الحساب
  const handleGenerateStatement = async () => {
    if (!selectedAccountId) {
      toast.error('يرجى اختيار الحساب')
      return
    }

    setLoadingStatement(true)
    
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

  // طباعة كشف الحساب
  const handlePrintAccountStatement = () => {
    if (accountTransactions.length === 0) return

    const totalDebit = accountTransactions.reduce((sum, t) => sum + t.debit, 0)
    const totalCredit = accountTransactions.reduce((sum, t) => sum + t.credit, 0)
    const finalBalance = accountTransactions[accountTransactions.length - 1].balance

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب - ${selectedAccountName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .account-info { margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
          .account-info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #f3f4f6; }
          td:nth-child(5), td:nth-child(6), td:nth-child(7) { text-align: left; font-family: monospace; }
          .total-row { background: #f3f4f6; font-weight: bold; }
          .green { color: #16a34a; }
          .red { color: #dc2626; }
          .summary { margin-top: 30px; display: flex; justify-content: space-around; }
          .summary-box { text-align: center; padding: 15px 30px; background: #f3f4f6; border-radius: 8px; }
          .summary-box .label { font-size: 12px; color: #666; }
          .summary-box .value { font-size: 20px; font-weight: bold; margin-top: 5px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">كشف حساب</div>
          <div style="font-size: 14px; color: #666;">Account Statement</div>
        </div>
        
        <div class="account-info">
          <p><strong>نوع الحساب:</strong> ${accountType === 'CUSTOMER' ? 'عميل' : 'مورد'}</p>
          <p><strong>اسم الحساب:</strong> ${selectedAccountName}</p>
          <p><strong>رقم الحساب:</strong> ${selectedAccountId}</p>
          ${dateFrom || dateTo ? `<p><strong>الفترة:</strong> ${dateFrom ? formatDate(dateFrom) : '...'} - ${dateTo ? formatDate(dateTo) : '...'}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>المرجع</th>
              <th>البيان</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${accountTransactions.map(t => `
              <tr>
                <td style="font-family: monospace;">${formatDate(t.date)}</td>
                <td>${getTransactionTypeLabel(t.type)}</td>
                <td style="font-family: monospace;">${t.reference}</td>
                <td>${t.description}</td>
                <td class="green">${t.debit > 0 ? formatNumber(t.debit) : '-'}</td>
                <td class="red">${t.credit > 0 ? formatNumber(t.credit) : '-'}</td>
                <td style="color: ${t.balance >= 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">${formatNumber(t.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4">الإجمالي</td>
              <td class="green">${formatNumber(totalDebit)}</td>
              <td class="red">${formatNumber(totalCredit)}</td>
              <td style="color: ${finalBalance >= 0 ? '#16a34a' : '#dc2626'};">${formatNumber(finalBalance)}</td>
            </tr>
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="label">إجمالي المدين</div>
            <div class="value green">${formatNumber(totalDebit)}</div>
          </div>
          <div class="summary-box">
            <div class="label">إجمالي الدائن</div>
            <div class="value red">${formatNumber(totalCredit)}</div>
          </div>
          <div class="summary-box">
            <div class="label">الرصيد النهائي</div>
            <div class="value" style="color: ${finalBalance >= 0 ? '#16a34a' : '#dc2626'};">${formatNumber(finalBalance)}</div>
          </div>
        </div>

        <div class="footer">
          <div class="signature">
            <div class="signature-line">المحاسب</div>
          </div>
          <div class="signature">
            <div class="signature-line">المراجع</div>
          </div>
          <div class="signature">
            <div class="signature-line">المدير المالي</div>
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

  // تسمية نوع الحركة
  const getTransactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      INVOICE: 'فاتورة',
      PAYMENT: 'سند صرف',
      RECEIPT: 'سند قبض',
      CREDIT_NOTE: 'إشعار دائن',
      DEBIT_NOTE: 'إشعار مدين',
      OPENING: 'رصيد افتتاحي',
    }
    return labels[type] || type
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
      <div className="flex items-center justify-between print:hidden">
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
      <div className="flex flex-wrap gap-4 print:hidden">
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
        <TabsList className="grid w-full grid-cols-3 print:hidden">
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
                            <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الأصول المتداولة</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {formatNumber(balanceSheetData.assets.current.reduce((sum, a) => sum + a.amount, 0))}
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
                            )}>{formatNumber(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الأصول الثابتة</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {formatNumber(balanceSheetData.assets.fixed.reduce((sum, a) => sum + a.amount, 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Assets */}
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-green-700 dark:text-green-400">إجمالي الأصول</span>
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">
                      {formatNumber(balanceSheetData.assets.total)} ج.م
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
                            <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
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
                            <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الخصوم</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {formatNumber(balanceSheetData.liabilities.total)}
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
                            <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي حقوق الملكية</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {formatNumber(balanceSheetData.equity.total)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Liabilities & Equity */}
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-red-700 dark:text-red-400">إجمالي الخصوم وحقوق الملكية</span>
                    <span className="font-mono font-bold text-red-700 dark:text-red-400">
                      {formatNumber(balanceSheetData.liabilities.total + balanceSheetData.equity.total)} ج.م
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
                          <TableCell className="text-left font-mono text-green-600">{formatNumber(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-green-50 dark:bg-green-900/20">
                        <TableCell className="font-medium">إجمالي الإيرادات</TableCell>
                        <TableCell className="text-left font-mono font-bold text-green-600">
                          {formatNumber(incomeStatementData.revenue.reduce((sum, a) => sum + a.amount, 0))}
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
                          <TableCell className="text-left font-mono text-red-600">({formatNumber(item.amount)})</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Gross Profit */}
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-blue-700 dark:text-blue-400">إجمالي الربح</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    {formatNumber(incomeStatementData.grossProfit)} ج.م
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
                          <TableCell className="text-left font-mono text-red-600">({formatNumber(item.amount)})</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-red-50 dark:bg-red-900/20">
                        <TableCell className="font-medium">إجمالي المصروفات</TableCell>
                        <TableCell className="text-left font-mono font-bold text-red-600">
                          ({formatNumber(incomeStatementData.expenses.reduce((sum, a) => sum + a.amount, 0))})
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Profit */}
                <div className="p-4 bg-gradient-to-l from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-xl text-green-700 dark:text-green-400">صافي الربح</span>
                  <span className="font-mono font-bold text-2xl text-green-700 dark:text-green-400">
                    {formatNumber(incomeStatementData.netProfit)} ج.م
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
                            {item.amount >= 0 ? '' : '('}{formatNumber(Math.abs(item.amount))}{item.amount >= 0 ? '' : ')'}
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
                            ({formatNumber(Math.abs(item.amount))})
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
                            ({formatNumber(Math.abs(item.amount))})
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
                      {formatNumber(cashFlowData.netChange)} ج.م
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="font-medium">رصيد الافتتاح</span>
                    <span className="font-mono">{formatNumber(cashFlowData.openingBalance)} ج.م</span>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-purple-700 dark:text-purple-400">رصيد الإقفال</span>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                      {formatNumber(cashFlowData.closingBalance)} ج.م
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
                onClick={() => { setAccountType('CUSTOMER'); setSelectedAccountId(''); setAccountSearch(''); }}
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
                onClick={() => { setAccountType('SUPPLIER'); setSelectedAccountId(''); setAccountSearch(''); }}
              >
                <Building2 className="h-5 w-5" />
                <span>مورد</span>
              </Button>
            </div>

            {/* بحث الحساب */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2" ref={accountDropdownRef}>
                <Label>{accountType === 'CUSTOMER' ? 'العميل' : 'المورد'}</Label>
                <div className="relative">
                  <Input
                    placeholder={`ابحث عن ${accountType === 'CUSTOMER' ? 'العميل' : 'المورد'} بالاسم أو الكود...`}
                    value={accountSearch}
                    onChange={(e) => {
                      setAccountSearch(e.target.value)
                      setShowAccountDropdown(true)
                      if (!e.target.value) {
                        setSelectedAccountId('')
                        setSelectedAccountName('')
                      }
                    }}
                    onFocus={() => setShowAccountDropdown(true)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {selectedAccountId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => {
                        setAccountSearch('')
                        setSelectedAccountId('')
                        setSelectedAccountName('')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* القائمة المنسدلة */}
                  {showAccountDropdown && accountSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredAccounts().length > 0 ? (
                        getFilteredAccounts().map((account) => (
                          <div
                            key={account.id}
                            className="px-3 py-2 hover:bg-muted cursor-pointer"
                            onClick={() => handleSelectAccount(account)}
                          >
                            <div className="flex justify-between items-center">
                              <span>{account.name}</span>
                              <span className="text-muted-foreground text-sm font-mono">{account.id}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>{account.phone}</span>
                              <span>رصيد: {formatNumber(account.balance)} ج.م</span>
                            </div>
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
                      <p className="font-bold text-lg">{selectedAccountName}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                      <p className={cn(
                        "font-bold text-xl font-mono",
                        finalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatNumber(finalBalance)} ج.م
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
                              {formatDate(transaction.date)}
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
                              {transaction.debit > 0 ? formatNumber(transaction.debit) : '-'}
                            </TableCell>
                            <TableCell className="text-left font-mono text-red-600">
                              {transaction.credit > 0 ? formatNumber(transaction.credit) : '-'}
                            </TableCell>
                            <TableCell className={cn(
                              "text-left font-mono font-medium",
                              transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {formatNumber(transaction.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* صف الإجمالي */}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell colSpan={4}>الإجمالي</TableCell>
                          <TableCell className="text-left font-mono text-green-600">
                            {formatNumber(totalDebit)}
                          </TableCell>
                          <TableCell className="text-left font-mono text-red-600">
                            {formatNumber(totalCredit)}
                          </TableCell>
                          <TableCell className={cn(
                            "text-left font-mono",
                            finalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {formatNumber(finalBalance)}
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
                            {formatNumber(totalDebit)}
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
                            {formatNumber(totalCredit)}
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
                            {formatNumber(finalBalance)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* رسالة فارغة */}
            {accountTransactions.length === 0 && !loadingStatement && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>ابحث عن {accountType === 'CUSTOMER' ? 'العميل' : 'المورد'} واضغط "عرض الكشف"</p>
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
                <Button onClick={handlePrintAccountStatement}>
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
