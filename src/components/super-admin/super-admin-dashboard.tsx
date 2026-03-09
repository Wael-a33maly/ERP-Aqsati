'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Building2, Users, CreditCard, Settings, DollarSign, TrendingUp,
  Eye, LogOut, Search, Loader2, RefreshCw, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Download,
  Upload, FileText, BarChart3, Bell, Shield, Database, Server,
  Calendar, Filter, ArrowUpRight, ArrowDownRight, Zap, Gift,
  Send, Link as LinkIcon, Wallet, Receipt, PieChart, Landmark
} from 'lucide-react'
import { toast } from 'sonner'
import SubscriptionPlansManagement from '@/components/admin/subscription-plans-management'
import CollectionsDashboard from '@/components/super-admin/collections-dashboard'
import PaymentGatewaysManagement from '@/components/super-admin/payment-gateways-management'

interface Company {
  id: string
  name: string
  nameAr?: string
  code: string
  email?: string
  phone?: string
  active: boolean
  subscriptionStatus: string
  createdAt: string
  admin?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  subscription?: {
    planName: string
    status: string
    endDate: string
    finalPrice: number
  }
  counts: {
    users: number
    customers: number
    invoices: number
    products: number
    branches: number
  }
}

interface CollectionCompany {
  id: string
  name: string
  nameAr?: string
  code: string
  subscriptionStatus: string
  plan: string
  collected: number
  sales: number
  pending: number
  collectionRate: number
  byMethod: Record<string, number>
  counts: {
    customers: number
    invoices: number
    payments: number
    users: number
  }
}

interface BackupFile {
  filename: string
  size: number
  createdAt: string
  type: 'full' | 'company'
}

interface SuperAdminDashboardProps {
  user: any
  onImpersonate: (company: Company) => void
}

export default function SuperAdminDashboard({ user, onImpersonate }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'collections' | 'subscriptions' | 'payment-gateways' | 'backup' | 'settings'>('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [collections, setCollections] = useState<any>(null)
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState('month')

  // حالات النوافذ
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedCompanyForDelete, setSelectedCompanyForDelete] = useState<Company | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [backupType, setBackupType] = useState<'full' | 'company'>('full')
  const [selectedCompanyForBackup, setSelectedCompanyForBackup] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      // الحصول على الـ token من localStorage
      const userStr = localStorage.getItem('erp_user')
      const token = userStr ? JSON.parse(userStr).token : null
      
      // إعداد headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // إضافة Authorization header إذا كان موجود
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      if (activeTab === 'dashboard' || activeTab === 'companies') {
        const response = await fetch('/api/admin/stats', { headers })
        const result = await response.json()
        if (result.success) {
          setStats(result.data.stats)
          setCompanies(result.data.companies)
        }
      }
      if (activeTab === 'collections') {
        const response = await fetch(`/api/admin/collections?period=${periodFilter}`, { headers })
        const result = await response.json()
        if (result.success) {
          setCollections(result.data)
        }
      }
      if (activeTab === 'backup') {
        const response = await fetch('/api/admin/backup?action=list', { headers })
        const result = await response.json()
        if (result.success) {
          setBackups(result.backups)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = async (company: Company) => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      })
      const result = await response.json()
      
      if (result.success) {
        // جلب المستخدم الحالي من localStorage
        const currentUserStr = localStorage.getItem('erp_user')
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { id: 'super-admin', name: 'Super Admin', email: 'admin@aqsati.com' }
        
        // إنشاء بيانات المستخدم المتخفي
        const impersonatedUser = {
          id: currentUser.id || 'super-admin',
          email: currentUser.email || 'admin@aqsati.com',
          name: currentUser.name || 'Super Admin',
          role: 'COMPANY_ADMIN',
          companyId: company.id,
          companyName: company.name,
          branchId: result.session?.branchId,
          isImpersonating: true
        }
        
        // حفظ المستخدم الجديد في localStorage
        localStorage.setItem('erp_user', JSON.stringify(impersonatedUser))
        
        // حفظ معلومات الدخول المتخفي في localStorage
        localStorage.setItem('impersonation_session', JSON.stringify({
          sessionId: result.session?.sessionId || Date.now().toString(),
          companyId: company.id,
          companyName: company.name,
          originalUserId: currentUser.id,
          originalUserName: currentUser.name
        }))
        
        toast.success(`تم الدخول إلى شركة ${company.name} بنجاح`)
        
        // تحديث الصفحة
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        toast.error(result.error || 'فشل في الدخول المتخفي')
      }
    } catch (error) {
      console.error('Impersonation error:', error)
      toast.error('حدث خطأ في الاتصال')
    }
  }

  const handleCreateBackup = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: backupType,
          companyId: backupType === 'company' ? selectedCompanyForBackup : undefined
        })
      })
      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        setShowBackupDialog(false)
        fetchData()
      } else {
        toast.error(result.error || 'فشل في إنشاء النسخة الاحتياطية')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/backup?action=download&file=${filename}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('تم تحميل النسخة الاحتياطية')
    } catch (error) {
      toast.error('فشل في تحميل النسخة الاحتياطية')
    }
  }

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) return
    
    try {
      const response = await fetch(`/api/admin/backup?file=${filename}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        fetchData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('فشل في حذف النسخة الاحتياطية')
    }
  }

  const handleDeleteCompany = async () => {
    if (!selectedCompanyForDelete) return
    if (deleteConfirmation !== 'DELETE') {
      toast.error('اكتب DELETE للتأكيد')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/danger', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'company',
          companyId: selectedCompanyForDelete.id,
          confirmation: 'DELETE_ALL_DATA_CONFIRM'
        })
      })
      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        setShowDeleteDialog(false)
        setSelectedCompanyForDelete(null)
        setDeleteConfirmation('')
        fetchData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('حدث خطأ في الحذف')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (deleteConfirmation !== 'DELETE_ALL_DATA_CONFIRM') {
      toast.error('اكتب DELETE_ALL_DATA_CONFIRM للتأكيد')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/danger', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'all',
          confirmation: 'DELETE_ALL_DATA_CONFIRM'
        })
      })
      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        setShowDeleteDialog(false)
        setDeleteConfirmation('')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('حدث خطأ في الحذف')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: 'نشط', className: 'bg-green-500/10 text-green-600' },
      trial: { label: 'تجريبي', className: 'bg-blue-500/10 text-blue-600' },
      expired: { label: 'منتهي', className: 'bg-red-500/10 text-red-600' },
      cancelled: { label: 'ملغي', className: 'bg-gray-500/10 text-gray-600' },
      pending: { label: 'معلق', className: 'bg-yellow-500/10 text-yellow-600' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return `${amount?.toLocaleString() || 0} ج.م`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // تبويبات القائمة الجانبية
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: TrendingUp },
    { id: 'companies', label: 'إدارة المؤسسات', icon: Building2 },
    { id: 'collections', label: 'متابعة التحصيلات', icon: Wallet },
    { id: 'subscriptions', label: 'إدارة الاشتراكات', icon: CreditCard },
    { id: 'payment-gateways', label: 'بوابات الدفع', icon: Landmark },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
    { id: 'settings', label: 'الإعدادات العامة', icon: Settings },
  ]

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('erp_user')
    localStorage.removeItem('impersonation_session')
    window.location.reload()
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* القائمة الجانبية */}
      <aside className="w-64 border-l bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">لوحة السوبر أدمن</h2>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* قسم المستخدم */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5 ml-1" />
              تحديث
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1" 
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 ml-1" />
              خروج
            </Button>
          </div>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* لوحة التحكم الرئيسية */}
            {activeTab === 'dashboard' && stats && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                  <p className="text-muted-foreground">نظرة عامة على النظام</p>
                </div>

                {/* بطاقات الإحصائيات */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gradient-to-l from-purple-500/10 to-purple-600/5">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي الشركات</p>
                          <p className="text-3xl font-bold text-purple-600">{stats.totalCompanies}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stats.activeCompanies} نشطة · {stats.inactiveCompanies} غير نشطة
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-l from-green-500/10 to-green-600/5">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">الاشتراكات النشطة</p>
                          <p className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stats.trialSubscriptions} تجريبية
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-l from-blue-500/10 to-blue-600/5">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            عبر جميع الشركات
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-l from-emerald-500/10 to-emerald-600/5">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            من جميع الشركات
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-emerald-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* إحصائيات إضافية */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                          <p className="text-xl font-bold">{stats.totalCustomers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                          <p className="text-xl font-bold">{stats.totalInvoices}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">اشتراكات منتهية</p>
                          <p className="text-xl font-bold">{stats.expiredSubscriptions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* آخر الشركات */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>آخر الشركات المسجلة</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('companies')}>
                      عرض الكل
                      <ChevronRight className="h-4 w-4 mr-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {companies.slice(0, 5).map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              <p className="text-xs text-muted-foreground">{company.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(company.subscriptionStatus)}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImpersonate(company)}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              دخول
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* إدارة المؤسسات */}
            {activeTab === 'companies' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">إدارة المؤسسات</h1>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث عن شركة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 pr-9"
                      />
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      شركة جديدة
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-220px)]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الشركة</TableHead>
                            <TableHead>المدير</TableHead>
                            <TableHead>الخطة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>الإحصائيات</TableHead>
                            <TableHead>تاريخ التسجيل</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCompanies.map((company) => (
                            <TableRow key={company.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{company.name}</p>
                                    <p className="text-xs text-muted-foreground">{company.code}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {company.admin ? (
                                  <div>
                                    <p className="text-sm font-medium">{company.admin.name}</p>
                                    <p className="text-xs text-muted-foreground">{company.admin.email}</p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">غير محدد</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {company.subscription ? (
                                  <div>
                                    <p className="text-sm font-medium">{company.subscription.planName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      ينتهي: {formatDate(company.subscription.endDate)}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">لا يوجد اشتراك</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(company.subscriptionStatus)}
                                  {company.active ? (
                                    <Badge className="bg-green-500/10 text-green-600 text-xs">نشطة</Badge>
                                  ) : (
                                    <Badge className="bg-gray-500/10 text-gray-600 text-xs">معطلة</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground">مستخدمين:</span>
                                    <span className="font-medium">{company.counts.users}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground">عملاء:</span>
                                    <span className="font-medium">{company.counts.customers}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground">فواتير:</span>
                                    <span className="font-medium">{company.counts.invoices}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{formatDate(company.createdAt)}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleImpersonate(company)}
                                    title="دخول متخفي"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => {
                                      setSelectedCompanyForDelete(company)
                                      setShowDeleteDialog(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* متابعة التحصيلات */}
            {activeTab === 'collections' && (
              <div className="p-6">
                <CollectionsDashboard companies={companies} onImpersonate={onImpersonate} />
              </div>
            )}

            {/* إدارة الاشتراكات */}
            {activeTab === 'subscriptions' && (
              <div className="p-6">
                <SubscriptionPlansManagement />
              </div>
            )}

            {/* بوابات الدفع */}
            {activeTab === 'payment-gateways' && (
              <div className="p-6">
                <PaymentGatewaysManagement />
              </div>
            )}

            {/* النسخ الاحتياطي */}
            {activeTab === 'backup' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">النسخ الاحتياطي</h1>
                  <Button onClick={() => setShowBackupDialog(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء نسخة احتياطية
                  </Button>
                </div>

                {/* أزرار سريعة */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
                    setBackupType('full')
                    setShowBackupDialog(true)
                  }}>
                    <CardContent className="p-6 text-center">
                      <Server className="h-12 w-12 mx-auto text-purple-500 mb-3" />
                      <h3 className="font-semibold">نسخة احتياطية كاملة</h3>
                      <p className="text-sm text-muted-foreground">جميع بيانات النظام</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
                    setBackupType('company')
                    setShowBackupDialog(true)
                  }}>
                    <CardContent className="p-6 text-center">
                      <Building2 className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                      <h3 className="font-semibold">نسخة احتياطية لشركة</h3>
                      <p className="text-sm text-muted-foreground">بيانات شركة محددة</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowRestoreDialog(true)}>
                    <CardContent className="p-6 text-center">
                      <Upload className="h-12 w-12 mx-auto text-green-500 mb-3" />
                      <h3 className="font-semibold">استعادة نسخة احتياطية</h3>
                      <p className="text-sm text-muted-foreground">رفع واستعادة البيانات</p>
                    </CardContent>
                  </Card>
                </div>

                {/* قائمة النسخ الاحتياطية */}
                <Card>
                  <CardHeader>
                    <CardTitle>النسخ الاحتياطية المتاحة</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {backups.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>لا توجد نسخ احتياطية</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الملف</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>الحجم</TableHead>
                            <TableHead>تاريخ الإنشاء</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {backups.map((backup) => (
                            <TableRow key={backup.filename}>
                              <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                              <TableCell>
                                <Badge variant={backup.type === 'full' ? 'default' : 'outline'}>
                                  {backup.type === 'full' ? 'كامل' : 'شركة'}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatFileSize(backup.size)}</TableCell>
                              <TableCell>{formatDate(backup.createdAt)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadBackup(backup.filename)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500"
                                    onClick={() => handleDeleteBackup(backup.filename)}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
              </div>
            )}

            {/* الإعدادات العامة */}
            {activeTab === 'settings' && (
              <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold">الإعدادات العامة</h1>
                
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>إعدادات النظام</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => toast.info('سيتم تفعيل الوضع التجريبي')}>
                        <div className="flex items-center gap-3">
                          <Gift className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-medium">الوضع التجريبي</p>
                            <p className="text-sm text-muted-foreground">السماح للشركات الجديدة بتجربة النظام</p>
                          </div>
                        </div>
                        <Button variant="outline">تفعيل</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setActiveTab('backup')}>
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">النسخ الاحتياطي التلقائي</p>
                            <p className="text-sm text-muted-foreground">جدولة النسخ الاحتياطي اليومي</p>
                          </div>
                        </div>
                        <Button variant="outline">إعداد</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => toast.info('سيتم فتح سجلات النظام')}>
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="font-medium">سجلات النظام</p>
                            <p className="text-sm text-muted-foreground">عرض سجلات العمليات والأخطاء</p>
                          </div>
                        </div>
                        <Button variant="outline">عرض</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => toast.info('سيتم فتح إعدادات البوابات')}>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">بوابات الدفع الإلكتروني</p>
                            <p className="text-sm text-muted-foreground">إعداد بوابات الدفع للنظام</p>
                          </div>
                        </div>
                        <Button variant="outline">إعداد</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* منطقة الخطر */}
                  <Card className="border-red-200">
                    <CardHeader className="text-red-600">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        منطقة الخطر
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          هذه الإجراءات لا يمكن التراجع عنها. يرجى التوخي الحذر.
                        </AlertDescription>
                      </Alert>
                      <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
                        <div>
                          <p className="font-medium text-red-600">مسح جميع البيانات</p>
                          <p className="text-sm text-muted-foreground">حذف جميع بيانات النظام (لا يمكن التراجع)</p>
                        </div>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            setSelectedCompanyForDelete(null)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          مسح الكل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* نافذة إنشاء نسخة احتياطية */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء نسخة احتياطية</DialogTitle>
            <DialogDescription>
              اختر نوع النسخة الاحتياطية التي تريد إنشائها
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <Button
                variant={backupType === 'full' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setBackupType('full')}
              >
                <Server className="h-4 w-4 ml-2" />
                النظام كامل
              </Button>
              <Button
                variant={backupType === 'company' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setBackupType('company')}
              >
                <Building2 className="h-4 w-4 ml-2" />
                شركة محددة
              </Button>
            </div>
            {backupType === 'company' && (
              <select
                value={selectedCompanyForBackup}
                onChange={(e) => setSelectedCompanyForBackup(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">اختر الشركة</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreateBackup} disabled={actionLoading || (backupType === 'company' && !selectedCompanyForBackup)}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة الحذف */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {selectedCompanyForDelete ? 'حذف الشركة' : 'مسح جميع البيانات'}
            </DialogTitle>
            <DialogDescription className="text-red-500">
              {selectedCompanyForDelete 
                ? `سيتم حذف شركة "${selectedCompanyForDelete.name}" وجميع بياناتها نهائياً`
                : 'سيتم حذف جميع البيانات نهائياً ولا يمكن التراجع عن هذا الإجراء'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                اكتب <strong>{selectedCompanyForDelete ? 'DELETE' : 'DELETE_ALL_DATA_CONFIRM'}</strong> للتأكيد
              </AlertDescription>
            </Alert>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={selectedCompanyForDelete ? 'DELETE' : 'DELETE_ALL_DATA_CONFIRM'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false)
              setDeleteConfirmation('')
              setSelectedCompanyForDelete(null)
            }}>إلغاء</Button>
            <Button 
              variant="destructive" 
              onClick={selectedCompanyForDelete ? handleDeleteCompany : handleDeleteAllData}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة الاستعادة */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استعادة نسخة احتياطية</DialogTitle>
            <DialogDescription>
              اختر النسخة الاحتياطية التي تريد استعادتها
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {backups.length === 0 ? (
              <p className="text-center text-muted-foreground">لا توجد نسخ احتياطية</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.filename}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-mono text-sm">{backup.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(backup.size)} · {formatDate(backup.createdAt)}
                      </p>
                    </div>
                    <Button size="sm">استعادة</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
