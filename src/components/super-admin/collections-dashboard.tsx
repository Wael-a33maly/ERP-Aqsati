'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2, Users, CreditCard, Settings, DollarSign, TrendingUp,
  Eye, LogOut, Search, Loader2, RefreshCw, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Download,
  Upload, FileText, BarChart3, Bell, Shield, Database, Server,
  Calendar, Filter, ArrowUpRight, ArrowDownRight, Zap, Gift,
  Send, Link as LinkIcon, Wallet, Receipt, PieChart, Activity,
  TrendingDown, Target, Award, Percent, ArrowLeftRight, CreditCard as CardIcon,
  Banknote, Smartphone, QrCode, Globe, Building, Landmark, Coins
} from 'lucide-react'
import { toast } from 'sonner'

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

interface CollectionsData {
  period: string
  startDate: Date
  endDate: Date
  totals: {
    totalCollected: number
    totalSales: number
    totalPending: number
    totalCompanies: number
    activeCompanies: number
    trialCompanies: number
    expiredCompanies: number
  }
  companies: CollectionCompany[]
  dailyTrend?: { date: string; collected: number }[]
  methodBreakdown?: Record<string, number>
}

interface CollectionsDashboardProps {
  companies: any[]
  onImpersonate: (company: any) => void
}

export default function CollectionsDashboard({ companies, onImpersonate }: CollectionsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState<CollectionsData | null>(null)
  
  // الفلاتر
  const [periodFilter, setPeriodFilter] = useState('month')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sortBy, setSortBy] = useState<'collected' | 'sales' | 'pending' | 'rate'>('collected')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCollections()
  }, [periodFilter])

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/collections?period=${periodFilter}`)
      const result = await response.json()
      if (result.success) {
        setCollections(result.data)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount?.toLocaleString() || 0} ج.م`
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // تطبيق الفلاتر
  const filteredCompanies = collections?.companies?.filter(company => {
    // فلتر البحث
    if (searchQuery && !company.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !company.code.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // فلتر الحالة
    if (statusFilter !== 'all' && company.subscriptionStatus !== statusFilter) {
      return false
    }
    
    // فلتر الخطة
    if (planFilter !== 'all' && company.plan !== planFilter) {
      return false
    }
    
    // فلتر المبلغ المعلق
    if (minAmount && company.pending < parseFloat(minAmount)) {
      return false
    }
    if (maxAmount && company.pending > parseFloat(maxAmount)) {
      return false
    }
    
    return true
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'collected':
        comparison = a.collected - b.collected
        break
      case 'sales':
        comparison = a.sales - b.sales
        break
      case 'pending':
        comparison = a.pending - b.pending
        break
      case 'rate':
        comparison = a.collectionRate - b.collectionRate
        break
    }
    return sortOrder === 'desc' ? -comparison : comparison
  }) || []

  // حساب الإحصائيات الإضافية
  const stats = {
    avgCollectionRate: filteredCompanies.length > 0 
      ? Math.round(filteredCompanies.reduce((sum, c) => sum + c.collectionRate, 0) / filteredCompanies.length)
      : 0,
    topCollector: filteredCompanies[0] || null,
    totalPayments: filteredCompanies.reduce((sum, c) => sum + c.counts.payments, 0),
    totalInvoices: filteredCompanies.reduce((sum, c) => sum + c.counts.invoices, 0),
    totalCustomers: filteredCompanies.reduce((sum, c) => sum + c.counts.customers, 0),
  }

  // طرق الدفع
  const paymentMethods = [
    { id: 'CASH', label: 'نقدي', icon: Banknote, color: 'text-green-600', bgColor: 'bg-green-500/10' },
    { id: 'BANK_TRANSFER', label: 'تحويل بنكي', icon: Landmark, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    { id: 'CARD', label: 'بطاقة', icon: CreditCard, color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
    { id: 'FAWRY', label: 'فوري', icon: QrCode, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
    { id: 'VODAFONE_CASH', label: 'فودافون كاش', icon: Smartphone, color: 'text-red-600', bgColor: 'bg-red-500/10' },
    { id: 'INSTAPAY', label: 'انستاباي', icon: Send, color: 'text-cyan-600', bgColor: 'bg-cyan-500/10' },
  ]

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

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-amber-600'
    if (rate >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">متابعة التحصيلات</h1>
          <p className="text-muted-foreground">متابعة شاملة لتحصيلات جميع الشركات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCollections}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* كروت الإحصائيات الرئيسية */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-gradient-to-l from-emerald-500/10 to-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs text-muted-foreground">إجمالي المحصل</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(collections?.totals.totalCollected || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-l from-blue-500/10 to-indigo-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs text-muted-foreground">إجمالي المبيعات</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(collections?.totals.totalSales || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-l from-amber-500/10 to-orange-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs text-muted-foreground">المعلق</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(collections?.totals.totalPending || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-l from-purple-500/10 to-violet-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-xs text-muted-foreground">معدل التحصيل</span>
            </div>
            <p className={`text-2xl font-bold ${getCollectionRateColor(stats.avgCollectionRate)}`}>
              {stats.avgCollectionRate}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-l from-cyan-500/10 to-teal-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-cyan-600" />
              </div>
              <span className="text-xs text-muted-foreground">العملاء</span>
            </div>
            <p className="text-2xl font-bold text-cyan-600">
              {stats.totalCustomers}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-l from-rose-500/10 to-pink-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-rose-600" />
              </div>
              <span className="text-xs text-muted-foreground">الشركات</span>
            </div>
            <p className="text-2xl font-bold text-rose-600">
              {collections?.totals.totalCompanies || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات تفصيلية */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">شركات نشطة</p>
                <p className="text-xl font-bold">{collections?.totals.activeCompanies || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">فترة تجريبية</p>
                <p className="text-xl font-bold">{collections?.totals.trialCompanies || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اشتراكات منتهية</p>
                <p className="text-xl font-bold">{collections?.totals.expiredCompanies || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                <p className="text-xl font-bold">{stats.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شريط التقدم للتحصيل */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">نسبة التحصيل الإجمالية</span>
            </div>
            <span className={`text-lg font-bold ${getCollectionRateColor(stats.avgCollectionRate)}`}>
              {stats.avgCollectionRate}%
            </span>
          </div>
          <Progress value={stats.avgCollectionRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>المحصل: {formatCurrency(collections?.totals.totalCollected || 0)}</span>
            <span>المبيعات: {formatCurrency(collections?.totals.totalSales || 0)}</span>
          </div>
        </CardContent>
      </Card>

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {/* البحث */}
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground">بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="اسم أو كود الشركة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>

            {/* الفترة */}
            <div>
              <Label className="text-xs text-muted-foreground">الفترة</Label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="quarter">هذا الربع</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الحالة */}
            <div>
              <Label className="text-xs text-muted-foreground">الحالة</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="trial">تجريبي</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الترتيب */}
            <div>
              <Label className="text-xs text-muted-foreground">ترتيب حسب</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collected">الأعلى تحصيلاً</SelectItem>
                  <SelectItem value="sales">الأعلى مبيعات</SelectItem>
                  <SelectItem value="pending">الأعلى معلقاً</SelectItem>
                  <SelectItem value="rate">الأعلى نسبة تحصيل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* مبلغ معلق من */}
            <div>
              <Label className="text-xs text-muted-foreground">معلق من (ج.م)</Label>
              <Input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            {/* مبلغ معلق إلى */}
            <div>
              <Label className="text-xs text-muted-foreground">معلق إلى (ج.م)</Label>
              <Input
                type="number"
                placeholder="999999"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>

          {/* إضافة زر مسح الفلاتر */}
          <div className="flex justify-end mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setPlanFilter('all')
                setMinAmount('')
                setMaxAmount('')
                setSortBy('collected')
                setSortOrder('desc')
              }}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول التحصيلات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>تحصيلات الشركات</CardTitle>
              <CardDescription>
                عرض {filteredCompanies.length} من {collections?.companies?.length || 0} شركة
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-600px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الشركة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>المبيعات</TableHead>
                  <TableHead>المحصل</TableHead>
                  <TableHead>المعلق</TableHead>
                  <TableHead>نسبة التحصيل</TableHead>
                  <TableHead>العملاء</TableHead>
                  <TableHead>الفواتير</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      لا توجد نتائج مطابقة للبحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/50">
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
                      <TableCell>{getStatusBadge(company.subscriptionStatus)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(company.sales)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-bold">{formatCurrency(company.collected)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${company.pending > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {formatCurrency(company.pending)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={company.collectionRate} className="w-16 h-2" />
                          <span className={`text-sm font-bold ${getCollectionRateColor(company.collectionRate)}`}>
                            {company.collectionRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{company.counts.customers}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{company.counts.invoices}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const c = companies.find(c => c.id === company.id)
                            if (c) onImpersonate(c)
                          }}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* توزيع طرق الدفع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            توزيع طرق الدفع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {paymentMethods.map((method) => {
              const totalAmount = filteredCompanies.reduce((sum, c) => sum + (c.byMethod?.[method.id] || 0), 0)
              const Icon = method.icon
              return (
                <Card key={method.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className={`h-10 w-10 rounded-lg ${method.bgColor} flex items-center justify-center mb-2`}>
                      <Icon className={`h-5 w-5 ${method.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{method.label}</p>
                    <p className={`font-bold ${method.color}`}>{formatCurrency(totalAmount)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
