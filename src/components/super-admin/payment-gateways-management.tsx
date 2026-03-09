'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  CreditCard, Building2, Users, DollarSign, TrendingUp,
  Eye, LogOut, Search, Loader2, RefreshCw, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Download,
  Upload, FileText, BarChart3, Bell, Shield, Database, Server,
  Calendar, Filter, ArrowUpRight, ArrowDownRight, Zap, Gift,
  Send, Link as LinkIcon, Wallet, Receipt, PieChart, Activity,
  TrendingDown, Target, Award, Percent, ArrowLeftRight,
  Banknote, Smartphone, QrCode, Globe, Building, Landmark, Coins,
  Settings, TestTube, Check, Copy, ExternalLink, Key, Lock
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentGateway {
  id: string
  companyId?: string
  companyName?: string
  gatewayType: string
  name: string
  nameAr?: string
  merchantId?: string
  merchantSecret?: string
  apiKey?: string
  apiSecret?: string
  walletNumber?: string
  accountNumber?: string
  bankCode?: string
  callbackUrl?: string
  webhookSecret?: string
  isLive: boolean
  isActive: boolean
  isDefault: boolean
  feesPercent: number
  feesFixed: number
  minAmount?: number
  maxAmount?: number
  settlementDays: number
  lastTestAt?: Date
  lastTestStatus?: string
  lastTestMessage?: string
  createdAt: Date
}

interface GlobalGatewaySettings {
  defaultCurrency: string
  callbackBaseUrl: string
  webhookEnabled: boolean
  autoSettlement: boolean
  settlementSchedule: string
  notificationEmail: string
  fraudDetection: boolean
  maxRetryAttempts: number
}

export default function PaymentGatewaysManagement() {
  const [loading, setLoading] = useState(true)
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [globalSettings, setGlobalSettings] = useState<GlobalGatewaySettings>({
    defaultCurrency: 'EGP',
    callbackBaseUrl: '',
    webhookEnabled: true,
    autoSettlement: false,
    settlementSchedule: 'daily',
    notificationEmail: '',
    fraudDetection: true,
    maxRetryAttempts: 3
  })
  const [activeTab, setActiveTab] = useState('gateways')
  
  // حالات النوافذ
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
  const [saving, setSaving] = useState(false)
  
  // نموذج البوابة
  const [gatewayForm, setGatewayForm] = useState({
    gatewayType: 'FAWRY',
    name: '',
    nameAr: '',
    merchantId: '',
    merchantSecret: '',
    apiKey: '',
    apiSecret: '',
    walletNumber: '',
    accountNumber: '',
    bankCode: '',
    feesPercent: 0,
    feesFixed: 0,
    minAmount: 0,
    maxAmount: 0,
    settlementDays: 1,
    isLive: false,
    isActive: true,
    isDefault: false
  })

  // أنواع البوابات
  const gatewayTypes = [
    { id: 'FAWRY', label: 'فوري (Fawry)', icon: QrCode, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { id: 'VODAFONE_CASH', label: 'فودافون كاش', icon: Smartphone, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { id: 'INSTAPAY', label: 'انستاباي', icon: Send, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { id: 'ORANGE_MONEY', label: 'أورنج موني', icon: Smartphone, color: 'text-orange-600', bgColor: 'bg-orange-600/10' },
    { id: 'ETISALAT_CASH', label: 'اتصالات كاش', icon: Smartphone, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { id: 'BANK_TRANSFER', label: 'تحويل بنكي', icon: Landmark, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { id: 'VISA', label: 'فيزا / ماستركارد', icon: CreditCard, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { id: 'MEEZA', label: 'ميزة', icon: CreditCard, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
    { id: 'PAYMOB', label: 'باي موب', icon: Smartphone, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { id: 'OPAY', label: 'أو باي', icon: Smartphone, color: 'text-green-600', bgColor: 'bg-green-600/10' },
  ]

  useEffect(() => {
    fetchGateways()
  }, [])

  const fetchGateways = async () => {
    setLoading(true)
    try {
      // جلب بوابات الدفع من API
      const response = await fetch('/api/admin/payment-gateways')
      const result = await response.json()
      if (result.success) {
        setGateways(result.gateways || [])
        if (result.globalSettings) {
          setGlobalSettings(result.globalSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching gateways:', error)
      // بيانات تجريبية للعرض
      setGateways([
        {
          id: '1',
          gatewayType: 'FAWRY',
          name: 'Fawry',
          nameAr: 'فوري',
          merchantId: 'test-merchant',
          isLive: false,
          isActive: true,
          isDefault: true,
          feesPercent: 1.5,
          feesFixed: 2,
          settlementDays: 1,
          createdAt: new Date()
        },
        {
          id: '2',
          gatewayType: 'VODAFONE_CASH',
          name: 'Vodafone Cash',
          nameAr: 'فودافون كاش',
          walletNumber: '01012345678',
          isLive: false,
          isActive: true,
          isDefault: false,
          feesPercent: 0,
          feesFixed: 0,
          settlementDays: 0,
          createdAt: new Date()
        },
        {
          id: '3',
          gatewayType: 'INSTAPAY',
          name: 'InstaPay',
          nameAr: 'انستاباي',
          accountNumber: 'EG0100010001',
          isLive: false,
          isActive: true,
          isDefault: false,
          feesPercent: 0,
          feesFixed: 0,
          settlementDays: 0,
          createdAt: new Date()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGateway = async () => {
    if (!gatewayForm.name) {
      toast.error('اسم البوابة مطلوب')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/payment-gateways', {
        method: selectedGateway ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gatewayForm,
          id: selectedGateway?.id
        })
      })
      const result = await response.json()
      if (result.success) {
        toast.success(selectedGateway ? 'تم تحديث البوابة' : 'تم إضافة البوابة')
        setShowAddDialog(false)
        setShowEditDialog(false)
        setSelectedGateway(null)
        fetchGateways()
      } else {
        toast.error(result.error || 'فشل في الحفظ')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  const handleTestGateway = async (gateway: PaymentGateway) => {
    setSelectedGateway(gateway)
    setShowTestDialog(true)
    try {
      const response = await fetch('/api/admin/payment-gateways/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayId: gateway.id })
      })
      const result = await response.json()
      if (result.success) {
        toast.success('نجح الاتصال بالبوابة')
      } else {
        toast.error(result.error || 'فشل الاتصال')
      }
    } catch (error) {
      toast.error('فشل في اختبار الاتصال')
    }
  }

  const handleToggleGateway = async (gateway: PaymentGateway) => {
    try {
      const response = await fetch('/api/admin/payment-gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: gateway.id,
          isActive: !gateway.isActive
        })
      })
      const result = await response.json()
      if (result.success) {
        toast.success(gateway.isActive ? 'تم تعطيل البوابة' : 'تم تفعيل البوابة')
        fetchGateways()
      }
    } catch (error) {
      toast.error('فشل في التحديث')
    }
  }

  const handleSaveGlobalSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/payment-gateways/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      })
      const result = await response.json()
      if (result.success) {
        toast.success('تم حفظ الإعدادات العامة')
      } else {
        toast.error(result.error || 'فشل في الحفظ')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  const getGatewayTypeConfig = (type: string) => {
    return gatewayTypes.find(g => g.id === type) || gatewayTypes[0]
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">بوابات الدفع الإلكتروني</h1>
          <p className="text-muted-foreground">إدارة بوابات الدفع لجميع الشركات</p>
        </div>
        <Button onClick={() => {
          setSelectedGateway(null)
          setGatewayForm({
            gatewayType: 'FAWRY',
            name: '',
            nameAr: '',
            merchantId: '',
            merchantSecret: '',
            apiKey: '',
            apiSecret: '',
            walletNumber: '',
            accountNumber: '',
            bankCode: '',
            feesPercent: 0,
            feesFixed: 0,
            minAmount: 0,
            maxAmount: 0,
            settlementDays: 1,
            isLive: false,
            isActive: true,
            isDefault: false
          })
          setShowAddDialog(true)
        }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة بوابة جديدة
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gateways">البوابات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات العامة</TabsTrigger>
          <TabsTrigger value="logs">سجلات العمليات</TabsTrigger>
        </TabsList>

        {/* تبويب البوابات */}
        <TabsContent value="gateways" className="space-y-6">
          {/* أنواع البوابات المتاحة */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {gatewayTypes.map((type) => {
              const Icon = type.icon
              const configured = gateways.some(g => g.gatewayType === type.id)
              return (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${configured ? 'border-green-500/50' : ''}`}
                  onClick={() => {
                    setGatewayForm(prev => ({ ...prev, gatewayType: type.id }))
                    setShowAddDialog(true)
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`h-12 w-12 rounded-xl ${type.bgColor} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className={`h-6 w-6 ${type.color}`} />
                    </div>
                    <p className="font-medium text-sm">{type.label}</p>
                    {configured ? (
                      <Badge className="mt-2 bg-green-500/10 text-green-600 text-xs">مفعلة</Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2 text-xs">غير مفعلة</Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* جدول البوابات */}
          <Card>
            <CardHeader>
              <CardTitle>البوابات المُعدة</CardTitle>
              <CardDescription>قائمة بوابات الدفع المفعلة في النظام</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البوابة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الوضع</TableHead>
                    <TableHead>الرسوم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر اختبار</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gateways.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا توجد بوابات مُعدة
                      </TableCell>
                    </TableRow>
                  ) : (
                    gateways.map((gateway) => {
                      const typeConfig = getGatewayTypeConfig(gateway.gatewayType)
                      const Icon = typeConfig.icon
                      return (
                        <TableRow key={gateway.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-lg ${typeConfig.bgColor} flex items-center justify-center`}>
                                <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                              </div>
                              <div>
                                <p className="font-medium">{gateway.nameAr || gateway.name}</p>
                                <p className="text-xs text-muted-foreground">{gateway.companyName || 'عالمية'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{typeConfig.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={gateway.isLive ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}>
                              {gateway.isLive ? '🟢 لايف' : '🟡 تجريبي'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {gateway.feesPercent > 0 && <span>{gateway.feesPercent}%</span>}
                              {gateway.feesFixed > 0 && <span className="text-muted-foreground"> + {gateway.feesFixed} ج.م</span>}
                              {gateway.feesPercent === 0 && gateway.feesFixed === 0 && <span className="text-green-600">بدون رسوم</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={gateway.isActive}
                              onCheckedChange={() => handleToggleGateway(gateway)}
                            />
                          </TableCell>
                          <TableCell>
                            {gateway.lastTestAt ? (
                              <div className="text-xs">
                                <p>{new Date(gateway.lastTestAt).toLocaleDateString('ar-EG')}</p>
                                <Badge className={gateway.lastTestStatus === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                                  {gateway.lastTestStatus === 'success' ? 'نجح' : 'فشل'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">لم يتم الاختبار</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTestGateway(gateway)}
                                title="اختبار الاتصال"
                              >
                                <TestTube className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedGateway(gateway)
                                  setGatewayForm({
                                    gatewayType: gateway.gatewayType,
                                    name: gateway.name,
                                    nameAr: gateway.nameAr || '',
                                    merchantId: gateway.merchantId || '',
                                    merchantSecret: gateway.merchantSecret || '',
                                    apiKey: gateway.apiKey || '',
                                    apiSecret: gateway.apiSecret || '',
                                    walletNumber: gateway.walletNumber || '',
                                    accountNumber: gateway.accountNumber || '',
                                    bankCode: gateway.bankCode || '',
                                    feesPercent: gateway.feesPercent,
                                    feesFixed: gateway.feesFixed,
                                    minAmount: gateway.minAmount || 0,
                                    maxAmount: gateway.maxAmount || 0,
                                    settlementDays: gateway.settlementDays,
                                    isLive: gateway.isLive,
                                    isActive: gateway.isActive,
                                    isDefault: gateway.isDefault
                                  })
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات العامة */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة لبوابات الدفع</CardTitle>
              <CardDescription>إعدادات مشتركة لجميع بوابات الدفع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>العملة الافتراضية</Label>
                  <Select value={globalSettings.defaultCurrency} onValueChange={(v) => setGlobalSettings(prev => ({ ...prev, defaultCurrency: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>عنوان URL للرد (Callback)</Label>
                  <Input
                    placeholder="https://api.example.com/callback"
                    value={globalSettings.callbackBaseUrl}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, callbackBaseUrl: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>جدول التسوية</Label>
                  <Select value={globalSettings.settlementSchedule} onValueChange={(v) => setGlobalSettings(prev => ({ ...prev, settlementSchedule: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">فوري</SelectItem>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>بريد الإشعارات</Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={globalSettings.notificationEmail}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">تفعيل الـ Webhooks</p>
                      <p className="text-sm text-muted-foreground">إرسال إشعارات تلقائية عند العمليات</p>
                    </div>
                  </div>
                  <Switch
                    checked={globalSettings.webhookEnabled}
                    onCheckedChange={(v) => setGlobalSettings(prev => ({ ...prev, webhookEnabled: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <ArrowLeftRight className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">التسوية التلقائية</p>
                      <p className="text-sm text-muted-foreground">تحويل تلقائي للحساب البنكي</p>
                    </div>
                  </div>
                  <Switch
                    checked={globalSettings.autoSettlement}
                    onCheckedChange={(v) => setGlobalSettings(prev => ({ ...prev, autoSettlement: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">كشف الاحتيال</p>
                      <p className="text-sm text-muted-foreground">نظام ذكي للكشف عن العمليات المشبوهة</p>
                    </div>
                  </div>
                  <Switch
                    checked={globalSettings.fraudDetection}
                    onCheckedChange={(v) => setGlobalSettings(prev => ({ ...prev, fraudDetection: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">محاولات إعادة الدفع</p>
                      <p className="text-sm text-muted-foreground">الحد الأقصى لمحاولات إعادة الدفع التلقائية</p>
                    </div>
                  </div>
                  <Input
                    type="number"
                    className="w-20"
                    value={globalSettings.maxRetryAttempts}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, maxRetryAttempts: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGlobalSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Check className="h-4 w-4 ml-2" />}
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب السجلات */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجلات عمليات الدفع</CardTitle>
              <CardDescription>سجل كامل لجميع عمليات الدفع عبر البوابات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>سيتم عرض سجلات العمليات هنا</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة إضافة/تعديل بوابة */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={() => {
        setShowAddDialog(false)
        setShowEditDialog(false)
        setSelectedGateway(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedGateway ? 'تعديل بوابة دفع' : 'إضافة بوابة دفع جديدة'}</DialogTitle>
            <DialogDescription>
              أدخل بيانات بوابة الدفع للإعداد
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* نوع البوابة */}
            <div className="space-y-2">
              <Label>نوع البوابة</Label>
              <Select value={gatewayForm.gatewayType} onValueChange={(v) => setGatewayForm(prev => ({ ...prev, gatewayType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gatewayTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الاسم */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم البوابة (بالإنجليزية)</Label>
                <Input
                  value={gatewayForm.name}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Fawry"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم البوابة (بالعربية)</Label>
                <Input
                  value={gatewayForm.nameAr}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="فوري"
                />
              </div>
            </div>

            {/* بيانات حسب نوع البوابة */}
            {['FAWRY', 'PAYMOB', 'OPAY'].includes(gatewayForm.gatewayType) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Merchant ID</Label>
                  <Input
                    value={gatewayForm.merchantId}
                    onChange={(e) => setGatewayForm(prev => ({ ...prev, merchantId: e.target.value }))}
                    placeholder="أدخل معرف التاجر"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Merchant Secret</Label>
                  <Input
                    type="password"
                    value={gatewayForm.merchantSecret}
                    onChange={(e) => setGatewayForm(prev => ({ ...prev, merchantSecret: e.target.value }))}
                    placeholder="أدخل السر"
                  />
                </div>
              </div>
            )}

            {['VODAFONE_CASH', 'ORANGE_MONEY', 'ETISALAT_CASH'].includes(gatewayForm.gatewayType) && (
              <div className="space-y-2">
                <Label>رقم المحفظة</Label>
                <Input
                  value={gatewayForm.walletNumber}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, walletNumber: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  dir="ltr"
                />
              </div>
            )}

            {gatewayForm.gatewayType === 'INSTAPAY' && (
              <div className="space-y-2">
                <Label>رقم الحساب / IBAN</Label>
                <Input
                  value={gatewayForm.accountNumber}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="EG0100010001..."
                  dir="ltr"
                />
              </div>
            )}

            {gatewayForm.gatewayType === 'BANK_TRANSFER' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>رقم الحساب البنكي</Label>
                  <Input
                    value={gatewayForm.accountNumber}
                    onChange={(e) => setGatewayForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="أدخل رقم الحساب"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>كود البنك</Label>
                  <Input
                    value={gatewayForm.bankCode}
                    onChange={(e) => setGatewayForm(prev => ({ ...prev, bankCode: e.target.value }))}
                    placeholder="CIBAEGCX"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {['VISA', 'MEEZA'].includes(gatewayForm.gatewayType) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    value={gatewayForm.apiKey}
                    onChange={(e) => setGatewayForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="أدخل مفتاح API"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    value={gatewayForm.apiSecret}
                    onChange={(e) => setGatewayForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="أدخل السر"
                  />
                </div>
              </div>
            )}

            {/* الرسوم */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>نسبة الرسوم (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={gatewayForm.feesPercent}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, feesPercent: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الرسوم الثابتة (ج.م)</Label>
                <Input
                  type="number"
                  value={gatewayForm.feesFixed}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, feesFixed: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى (ج.م)</Label>
                <Input
                  type="number"
                  value={gatewayForm.minAmount}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى (ج.م)</Label>
                <Input
                  type="number"
                  value={gatewayForm.maxAmount}
                  onChange={(e) => setGatewayForm(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* أيام التسوية */}
            <div className="space-y-2">
              <Label>أيام التسوية</Label>
              <Input
                type="number"
                value={gatewayForm.settlementDays}
                onChange={(e) => setGatewayForm(prev => ({ ...prev, settlementDays: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">عدد الأيام التي يستغرقها تحويل المبلغ للحساب البنكي</p>
            </div>

            {/* الخيارات */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">وضع الإنتاج</p>
                  <p className="text-xs text-muted-foreground">تشغيل البوابة في الوضع الحقيقي</p>
                </div>
                <Switch
                  checked={gatewayForm.isLive}
                  onCheckedChange={(v) => setGatewayForm(prev => ({ ...prev, isLive: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">تفعيل البوابة</p>
                  <p className="text-xs text-muted-foreground">السماح باستخدام البوابة</p>
                </div>
                <Switch
                  checked={gatewayForm.isActive}
                  onCheckedChange={(v) => setGatewayForm(prev => ({ ...prev, isActive: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">افتراضية</p>
                  <p className="text-xs text-muted-foreground">استخدام كبوابة افتراضية</p>
                </div>
                <Switch
                  checked={gatewayForm.isDefault}
                  onCheckedChange={(v) => setGatewayForm(prev => ({ ...prev, isDefault: v }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setShowEditDialog(false)
              setSelectedGateway(null)
            }}>
              إلغاء
            </Button>
            <Button onClick={handleSaveGateway} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              {selectedGateway ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة اختبار الاتصال */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>اختبار اتصال البوابة</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            {selectedGateway && (
              <div className="space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
                  <TestTube className="h-8 w-8 text-blue-500" />
                </div>
                <p className="font-medium">{selectedGateway.nameAr || selectedGateway.name}</p>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري اختبار الاتصال...</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
