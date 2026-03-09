# 🎨 مشروع ERP-Aqsati - الفرونت إند الكامل
## نسخ ولصق في محادثة جديدة مع البرومبت السابق

---

## 📁 هيكل المشروع

```
src/
├── app/
│   ├── page.tsx          # الصفحة الرئيسية (كل المكونات)
│   ├── layout.tsx        # التخطيط الرئيسي
│   └── globals.css       # الأنماط العامة
├── components/
│   ├── ui/               # مكونات shadcn/ui
│   ├── payments/         # بوابات الدفع المصرية
│   ├── settings/         # الإعدادات
│   └── shared/           # مكونات مشتركة
└── lib/
    ├── db.ts             # Prisma client
    ├── auth.ts           # المصادقة
    └── api-client.ts     # عميل API
```

---

## 🎨 الأنماط الرئيسية (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
  }
}

/* دعم RTL */
html[dir="rtl"] {
  direction: rtl;
}

/* خط عربي */
body {
  font-family: 'Noto Sans Arabic', var(--font-geist-sans), system-ui, sans-serif;
}

/* شريط تمرير مخصص */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
```

---

## 🧩 المكونات الرئيسية في page.tsx

### 1️⃣ هيكل التطبيق الرئيسي

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// الأيقونات
import {
  Building2, Users, Package, UserCheck, Plus, Search, Loader2, Menu, Moon, Sun,
  LayoutDashboard, Settings, X, RefreshCw, Home, DollarSign, Receipt, Wallet,
  CreditCard, RotateCcw, BarChart3, Printer, Percent, MapPin, Warehouse,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Bell, Check, AlertTriangle,
  Info, CheckCircle, LogOut, Save, Trash2, BellRing, XCircle, AlertCircle, Clock,
  Upload, PanelRightClose, PanelRightOpen, Eye, Calendar, User, Building, FileText
} from 'lucide-react'

import { toast } from 'sonner'
import { useTheme } from 'next-themes'
```

### 2️⃣ قائمة التنقل الجانبية

```tsx
const navGroups = [
  { id: 'main', title: 'الرئيسية', items: [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, color: 'text-blue-500', bgColor: 'bg-blue-500/10' }
  ]},
  { id: 'organization', title: 'إدارة المؤسسة', items: [
    { id: 'companies', label: 'الشركات', icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { id: 'branches', label: 'الفروع', icon: Home, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { id: 'users', label: 'المستخدمين', icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  ]},
  { id: 'sales', title: 'المبيعات والعملاء', items: [
    { id: 'customers', label: 'العملاء', icon: UserCheck, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { id: 'zones', label: 'المناطق', icon: MapPin, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
    { id: 'products', label: 'المنتجات', icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  ]},
  { id: 'finance', title: 'المالية', items: [
    { id: 'invoices', label: 'الفواتير', icon: Receipt, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { id: 'payments', label: 'المدفوعات', icon: Wallet, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { id: 'installments', label: 'الأقساط', icon: CreditCard, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
    { id: 'collections', label: 'المقبوضات', icon: DollarSign, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  ]},
  { id: 'reports', title: 'التقارير والإعدادات', items: [
    { id: 'reports', label: 'التقارير', icon: BarChart3, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  ]},
]
```

### 3️⃣ نظام المصادقة

```tsx
function useAuth() {
  const [user, setUserState] = useState<UserType | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('erp_user')
    if (stored) {
      try { setUserState(JSON.parse(stored)) } 
      catch { localStorage.removeItem('erp_user') }
    }
    setMounted(true)
  }, [])

  const setUser = (newUser: UserType | null) => {
    if (newUser) localStorage.setItem('erp_user', JSON.stringify(newUser))
    else localStorage.removeItem('erp_user')
    setUserState(newUser)
  }
  
  const logout = () => { 
    localStorage.removeItem('erp_user')
    setUserState(null)
  }

  return { user, setUser, logout, mounted }
}
```

### 4️⃣ نظام العملة

```tsx
const defaultCurrencies = [
  { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س' },
  { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م' },
  { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
]

function useCurrency() {
  const [currency, setCurrency] = useState({ code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' })
  
  useEffect(() => {
    const savedSettings = localStorage.getItem('erp_settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      const curr = defaultCurrencies.find(c => c.code === settings.currency) || defaultCurrencies[0]
      setCurrency(curr)
    }
  }, [])
  
  return currency
}

function formatCurrency(amount: number, symbol: string): string {
  return `${amount.toLocaleString()} ${symbol}`
}
```

### 5️⃣ نظام الإشعارات

```tsx
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
  link?: string
}

function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date()
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead, addNotification }
}
```

### 6️⃣ لوحة التحكم (Dashboard)

```tsx
function Dashboard({ user, onNavigate }: { user: UserType; onNavigate: (view: string) => void }) {
  const [stats, setStats] = useState({
    users: 0, companies: 0, customers: 0, products: 0, invoices: 0, payments: 0,
    totalSales: 0, totalPaid: 0, pendingAmount: 0, branches: 0, zones: 0
  })
  const [loading, setLoading] = useState(true)
  const currency = useCurrency()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        const result = await response.json()
        if (result.success) {
          setStats(result.data.stats)
        }
      } catch (e) {
        console.error('Failed to fetch stats', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const collectionRate = stats.totalSales > 0 ? Math.round((stats.totalPaid / stats.totalSales) * 100) : 0

  const statCards = [
    { title: 'الشركات', value: stats.companies, icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-500/10', view: 'companies' },
    { title: 'الفروع', value: stats.branches, icon: Home, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', view: 'branches' },
    { title: 'المستخدمين', value: stats.users, icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10', view: 'users' },
    { title: 'العملاء', value: stats.customers, icon: UserCheck, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', view: 'customers' },
    { title: 'المنتجات', value: stats.products, icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10', view: 'products' },
    { title: 'الفواتير', value: stats.invoices, icon: Receipt, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', view: 'invoices' },
  ]

  return (
    <div className="space-y-6">
      {/* ترحيب */}
      <div className="bg-gradient-to-l from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-6 border">
        <h1 className="text-2xl font-bold">مرحباً، {user.name}! 👋</h1>
        <p className="text-muted-foreground mt-1">نظام ERP للمؤسسات - إدارة شاملة لجميع عملياتك</p>
      </div>

      {/* إحصائيات مالية */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-l from-emerald-500/10 to-green-500/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.totalSales, currency.symbol)}</p>
              </div>
              <DollarSign className="h-7 w-7 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        {/* ... المزيد من البطاقات */}
      </div>

      {/* شريط التقدم */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">نسبة التحصيل من المبيعات</span>
            <span className="text-sm font-bold text-green-600">{collectionRate}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-green-500 to-emerald-500"
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            className="bg-card rounded-xl border p-4 hover:shadow-lg transition-all cursor-pointer" 
            onClick={() => onNavigate(stat.view)}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 7️⃣ إدارة الأقساط (Installments) ⭐ مهم

```tsx
function InstallmentsManagement() {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const currency = useCurrency()
  const { formatDate } = useDateFormat()

  // الفلاتر
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  // الإحصائيات
  const stats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.status === 'active').length,
    totalAmount: contracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0),
    totalPaid: contracts.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
    totalRemaining: contracts.reduce((sum, c) => sum + ((c.totalAmount || 0) - (c.paidAmount || 0)), 0),
    overdueInstallments: contracts.reduce((sum, c) => 
      sum + (c.installments?.filter((i: any) => 
        i.status === 'pending' && new Date(i.dueDate) < new Date()
      ).length || 0), 0)
  }

  const statusColors: any = {
    active: 'bg-green-500/10 text-green-600',
    completed: 'bg-blue-500/10 text-blue-600',
    cancelled: 'bg-red-500/10 text-red-600',
    defaulted: 'bg-amber-500/10 text-amber-600'
  }

  const statusLabels: any = {
    active: 'نشط',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    defaulted: 'متأخر'
  }

  // دفع قسط
  const handlePayInstallment = async (installment: any) => {
    const amount = prompt('أدخل مبلغ الدفع:')
    if (!amount || isNaN(parseFloat(amount))) return

    try {
      const res = await fetch('/api/installments/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId: installment.id,
          amount: parseFloat(amount),
          method: 'CASH'
        })
      })
      const result = await res.json()
      if (result.success) {
        toast.success('تم تسجيل الدفعة بنجاح')
        fetchData()
      } else {
        toast.error(result.error || 'فشل في تسجيل الدفعة')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-sky-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إدارة الأقساط</h1>
          <p className="text-muted-foreground text-sm">متابعة عقود الأقساط والمدفوعات</p>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">عقود الأقساط</p>
            <p className="text-xl font-bold">{stats.totalContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">عقود نشطة</p>
            <p className="text-xl font-bold text-green-600">{stats.activeContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي المحصل</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalPaid, currency.symbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي المتبقي</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.totalRemaining, currency.symbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">أقساط متأخرة</p>
            <p className="text-xl font-bold text-red-600">{stats.overdueInstallments}</p>
          </CardContent>
        </Card>
      </div>

      {/* جدول العقود */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم العقد</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>إجمالي العقد</TableHead>
              <TableHead>المقدم</TableHead>
              <TableHead>الأقساط</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>{contract.contractNumber}</TableCell>
                <TableCell>{contract.customer?.name}</TableCell>
                <TableCell>{formatCurrency(contract.totalAmount, currency.symbol)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(contract.downPayment, currency.symbol)}</TableCell>
                <TableCell>
                  {contract.installments?.filter((i: any) => i.status === 'paid').length}/{contract.installments?.length}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[contract.status]}>{statusLabels[contract.status]}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => setSelectedContract(contract)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* نافذة تفاصيل العقد */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>تفاصيل عقد الأقساط</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              {/* جدول الأقساط */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>القسط</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>قيمة القسط</TableHead>
                    <TableHead>المحصل</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedContract.installments?.map((inst: any) => (
                    <TableRow key={inst.id}>
                      <TableCell>{inst.installmentNumber}</TableCell>
                      <TableCell>{formatDate(inst.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(inst.amount, currency.symbol)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(inst.paidAmount || 0, currency.symbol)}</TableCell>
                      <TableCell className="text-amber-600">{formatCurrency(inst.amount - (inst.paidAmount || 0), currency.symbol)}</TableCell>
                      <TableCell>
                        <Badge className={inst.status === 'paid' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}>
                          {inst.status === 'paid' ? 'مدفوع' : 'معلق'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inst.status !== 'paid' && (
                          <Button size="sm" onClick={() => handlePayInstallment(inst)}>
                            <Wallet className="h-4 w-4 ml-1" />دفع
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### 8️⃣ المقبوضات (Collections) مع بوابات الدفع المصرية

```tsx
function CollectionsManagement() {
  const [installments, setInstallments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('unpaid')
  const [collectDialog, setCollectDialog] = useState<any>(null)
  const [collectAmount, setCollectAmount] = useState(0)
  const [collectMethod, setCollectMethod] = useState('CASH')
  const currency = useCurrency()

  // بوابات الدفع المصرية
  const egyptianPaymentMethods = [
    { id: 'CASH', name: 'نقدي', icon: DollarSign },
    { id: 'VODAFONE_CASH', name: 'فودافون كاش', icon: Wallet },
    { id: 'INSTAPAY', name: 'انستاباي', icon: CreditCard },
    { id: 'BANK_TRANSFER', name: 'تحويل بنكي', icon: Building },
  ]

  // التحصيل السريع
  const handleQuickCollect = async () => {
    if (!collectDialog || collectAmount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح')
      return
    }
    
    try {
      const res = await fetch('/api/installments/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId: collectDialog.id,
          amount: collectAmount,
          method: collectMethod
        })
      })
      const result = await res.json()
      
      if (result.success) {
        toast.success('تم تحصيل القسط بنجاح')
        setCollectDialog(null)
        fetchData()
      } else {
        toast.error(result.error || 'فشل التحصيل')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  // فلترة الأقساط حسب التبويب
  const filteredInstallments = installments.filter(i => {
    if (activeTab === 'unpaid') return i.status !== 'paid'
    if (activeTab === 'paid') return i.status === 'paid'
    if (activeTab === 'overdue') return i.status === 'pending' && new Date(i.dueDate) < new Date()
    return true
  })

  return (
    <div className="space-y-6">
      {/* تبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unpaid">غير مدفوعة</TabsTrigger>
          <TabsTrigger value="paid">مدفوعة</TabsTrigger>
          <TabsTrigger value="overdue">متأخرة</TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>قيمة القسط</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell>{inst.contract?.customer?.name}</TableCell>
                    <TableCell>{formatCurrency(inst.amount, currency.symbol)}</TableCell>
                    <TableCell>{formatDate(inst.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={inst.status === 'overdue' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}>
                        {inst.status === 'overdue' ? 'متأخر' : 'معلق'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setCollectDialog(inst)}>
                        <Wallet className="h-4 w-4 ml-1" />تحصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة التحصيل */}
      <Dialog open={!!collectDialog} onOpenChange={() => setCollectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحصيل قسط</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المبلغ</Label>
              <Input 
                type="number" 
                value={collectAmount} 
                onChange={(e) => setCollectAmount(parseFloat(e.target.value))} 
              />
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <Select value={collectMethod} onValueChange={setCollectMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {egyptianPaymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleQuickCollect}>تأكيد التحصيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

## 🎯 نقاط مهمة للفرونت إند

### 1. أسماء العلاقات من API
```tsx
// API يعيد الأسماء بحرف كبير، نستخدمها مباشرة
const customer = invoice.Customer  // ✅
const branch = user.Branch         // ✅

// أو نحولها للواجهة
const formattedInvoice = {
  ...invoice,
  customer: invoice.Customer,
  branch: invoice.Branch
}
```

### 2. التعامل مع التواريخ
```tsx
function formatDate(date: Date | string): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
```

### 3. RTL Support
```tsx
// في layout.tsx
<html lang="ar" dir="rtl" suppressHydrationWarning>

// في globals.css
html[dir="rtl"] {
  direction: rtl;
}
```

### 4. Dark Mode
```tsx
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
```

---

## 📦 المكتبات المطلوبة

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "next-themes": "^0.4.0",
    "lucide-react": "^0.400.0",
    "sonner": "^1.5.0",
    "date-fns": "^3.0.0",
    "recharts": "^2.12.0",
    "framer-motion": "^11.0.0",
    "egydata": "^1.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0"
  }
}
```

---

## 🚀 أوامر التثبيت الكاملة

```bash
# إنشاء المشروع
npx create-next-app@latest erp-aqsati --typescript --tailwind --app

# الدخول للمجلد
cd erp-aqsati

# تثبيت المكتبات
npm install prisma @prisma/client bcryptjs jsonwebtoken next-themes zustand @tanstack/react-query lucide-react date-fns recharts framer-motion egydata sonner

# تثبيت shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card table dialog select badge tabs input label textarea scroll-area switch popover collapsible sheet

# إعداد Prisma
npx prisma init

# نسخ schema.prisma وإنشاء قاعدة البيانات
npx prisma db push
npx prisma generate

# تشغيل المشروع
npm run dev
```

---

**هذا البرومبت يحتوي على الفرونت إند الكامل. استخدمه مع البرومبت السابق (الذي يحتوي على الـ Backend).**
