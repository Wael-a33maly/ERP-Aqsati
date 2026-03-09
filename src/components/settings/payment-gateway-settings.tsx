'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Wallet, CreditCard, Building2, Smartphone, CheckCircle2, XCircle, 
  Eye, EyeOff, Save, RefreshCw, TestTube, Info, Lock, Key,
  Plus, Trash2, Star, StarOff
} from 'lucide-react'
import { toast } from 'sonner'

// ===================== TYPES =====================
interface CompanyPaymentGateway {
  id: string
  companyId: string
  gatewayType: string
  name: string
  nameAr?: string | null
  merchantId?: string | null
  merchantSecret?: string | null
  apiKey?: string | null
  apiSecret?: string | null
  walletNumber?: string | null
  accountNumber?: string | null
  bankCode?: string | null
  callbackUrl?: string | null
  webhookSecret?: string | null
  isLive: boolean
  isActive: boolean
  isDefault: boolean
  feesPercent: number
  feesFixed: number
  minAmount?: number | null
  maxAmount?: number | null
  settlementDays: number
  settings?: string | null
  lastTestAt?: string | null
  lastTestStatus?: string | null
  lastTestMessage?: string | null
  createdAt: string
  updatedAt: string
}

interface GatewayFormData {
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
}

const gatewayTypes = [
  { type: 'fawry', name: 'فوري', nameEn: 'Fawry', icon: Wallet, color: 'text-orange-600', bgColor: 'bg-orange-500/10', description: 'بوابة الدفع الإلكتروني الأولى في مصر' },
  { type: 'vodafone_cash', name: 'فودافون كاش', nameEn: 'Vodafone Cash', icon: Smartphone, color: 'text-red-600', bgColor: 'bg-red-500/10', description: 'محفظة فودافون كاش الإلكترونية' },
  { type: 'orange_cash', name: 'أورانج كاش', nameEn: 'Orange Cash', icon: Smartphone, color: 'text-orange-500', bgColor: 'bg-orange-500/10', description: 'محفظة أورانج كاش الإلكترونية' },
  { type: 'etisalat_cash', name: 'اتصالات كاش', nameEn: 'Etisalat Cash', icon: Smartphone, color: 'text-green-600', bgColor: 'bg-green-500/10', description: 'محفظة اتصالات كاش الإلكترونية' },
  { type: 'we_pay', name: 'WE Pay', nameEn: 'WE Pay', icon: Smartphone, color: 'text-teal-600', bgColor: 'bg-teal-500/10', description: 'محفظة WE Pay الإلكترونية' },
  { type: 'instapay', name: 'انستاباي', nameEn: 'InstaPay', icon: Building2, color: 'text-purple-600', bgColor: 'bg-purple-500/10', description: 'استقبال التحويلات البنكية الفورية' },
  { type: 'meeza', name: 'بطاقة ميزة', nameEn: 'Meeza Card', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-500/10', description: 'بطاقات ميزة المصرية' },
  { type: 'visa', name: 'فيزا / ماستركارد', nameEn: 'Visa/Mastercard', icon: CreditCard, color: 'text-indigo-600', bgColor: 'bg-indigo-500/10', description: 'بطاقات فيزا وماستركارد' },
]

const defaultFormData: GatewayFormData = {
  gatewayType: '',
  name: '',
  nameAr: '',
  merchantId: '',
  merchantSecret: '',
  apiKey: '',
  apiSecret: '',
  walletNumber: '',
  accountNumber: '',
  bankCode: '',
  callbackUrl: '',
  webhookSecret: '',
  isLive: false,
  isActive: true,
  isDefault: false,
  feesPercent: 0,
  feesFixed: 0,
  minAmount: undefined,
  maxAmount: undefined,
  settlementDays: 1
}

// ===================== GATEWAY CARD COMPONENT =====================
function GatewayCard({
  gateway,
  gatewayInfo,
  onEdit,
  onDelete,
  onToggleActive,
  onSetDefault,
  onTest,
  testLoading
}: {
  gateway: CompanyPaymentGateway
  gatewayInfo: typeof gatewayTypes[0]
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
  onSetDefault: () => void
  onTest: () => void
  testLoading: boolean
}) {
  const Icon = gatewayInfo.icon
  
  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${gateway.isActive ? 'ring-2 ring-primary' : 'opacity-70'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl ${gatewayInfo.bgColor} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${gatewayInfo.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{gateway.name}</h3>
                {gateway.isDefault && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 text-[10px]">
                    <Star className="h-3 w-3 ml-1" />
                    افتراضي
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{gatewayInfo.nameEn}</p>
            </div>
          </div>
          <Switch checked={gateway.isActive} onCheckedChange={onToggleActive} />
        </div>
        
        <div className="text-xs text-muted-foreground mb-3">
          {gateway.isLive ? (
            <Badge className="bg-green-500/10 text-green-600">وضع الإنتاج</Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-600">وضع التجربة</Badge>
          )}
          {gateway.feesPercent > 0 && (
            <span className="mr-2">العمولة: {gateway.feesPercent}%</span>
          )}
        </div>
        
        {gateway.lastTestAt && (
          <div className="text-xs mb-3 flex items-center gap-2">
            {gateway.lastTestStatus === 'success' ? (
              <Badge className="bg-green-500/10 text-green-600">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                آخر اختبار: ناجح
              </Badge>
            ) : (
              <Badge className="bg-red-500/10 text-red-600">
                <XCircle className="h-3 w-3 ml-1" />
                آخر اختبار: فاشل
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Key className="h-3 w-3 ml-1" />
              تعديل
            </Button>
            {!gateway.isDefault && (
              <Button variant="ghost" size="sm" onClick={onSetDefault} title="تعيين كافتراضي">
                <StarOff className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={onTest} disabled={testLoading}>
            {testLoading ? <RefreshCw className="h-3 w-3 ml-1 animate-spin" /> : <TestTube className="h-3 w-3 ml-1" />}
            اختبار
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ===================== GATEWAY FORM COMPONENT =====================
function GatewayForm({
  gateway,
  onSave,
  onCancel,
  loading,
  showSecret,
  onToggleSecret
}: {
  gateway: CompanyPaymentGateway | null
  onSave: (data: GatewayFormData) => void
  onCancel: () => void
  loading: boolean
  showSecret: boolean
  onToggleSecret: () => void
}) {
  // Memoize initial form data based on gateway
  const initialData = useMemo((): GatewayFormData => {
    if (gateway) {
      return {
        gatewayType: gateway.gatewayType,
        name: gateway.name,
        nameAr: gateway.nameAr || '',
        merchantId: gateway.merchantId || '',
        merchantSecret: '',
        apiKey: gateway.apiKey || '',
        apiSecret: '',
        walletNumber: gateway.walletNumber || '',
        accountNumber: gateway.accountNumber || '',
        bankCode: gateway.bankCode || '',
        callbackUrl: gateway.callbackUrl || '',
        webhookSecret: '',
        isLive: gateway.isLive,
        isActive: gateway.isActive,
        isDefault: gateway.isDefault,
        feesPercent: gateway.feesPercent,
        feesFixed: gateway.feesFixed,
        minAmount: gateway.minAmount || undefined,
        maxAmount: gateway.maxAmount || undefined,
        settlementDays: gateway.settlementDays
      }
    }
    return defaultFormData
  }, [gateway])

  const [form, setForm] = useState<GatewayFormData>(initialData)
  
  const selectedGatewayInfo = gatewayTypes.find(g => g.type === form.gatewayType)

  const renderFields = () => {
    switch (form.gatewayType) {
      case 'fawry':
        return (
          <>
            <div className="space-y-2">
              <Label>Merchant Code *</Label>
              <Input
                value={form.merchantId || ''}
                onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                placeholder="أدخل كود التاجر"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Security Key *</Label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={form.merchantSecret || ''}
                  onChange={(e) => setForm({ ...form, merchantSecret: e.target.value })}
                  placeholder="أدخل مفتاح الأمان"
                  className="font-mono pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-0 h-full"
                  onClick={onToggleSecret}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        )
      case 'vodafone_cash':
      case 'orange_cash':
      case 'etisalat_cash':
      case 'we_pay':
        return (
          <>
            <div className="space-y-2">
              <Label>رقم المحفظة المستفيدة *</Label>
              <Input
                value={form.walletNumber || ''}
                onChange={(e) => setForm({ ...form, walletNumber: e.target.value })}
                placeholder="01xxxxxxxxx"
                className="font-mono"
                dir="ltr"
              />
            </div>
            <Separator />
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">بيانات التكامل (اختياري)</p>
              <div className="space-y-2">
                <Input
                  value={form.merchantId || ''}
                  onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                  placeholder="Merchant ID"
                  className="font-mono"
                />
                <div className="relative">
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={form.apiKey || ''}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder="API Key"
                    className="font-mono pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0 h-full"
                    onClick={onToggleSecret}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )
      case 'instapay':
        return (
          <>
            <div className="space-y-2">
              <Label>اسم البنك *</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: البنك الأهلي المصري"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الحساب *</Label>
              <Input
                value={form.accountNumber || ''}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="رقم الحساب البنكي"
                className="font-mono"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Code</Label>
              <Input
                value={form.bankCode || ''}
                onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
                placeholder="كود البنك"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type={showSecret ? 'text' : 'password'}
                value={form.apiKey || ''}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="مفتاح API"
                className="font-mono"
              />
            </div>
          </>
        )
      case 'meeza':
      case 'visa':
        return (
          <>
            <div className="space-y-2">
              <Label>Merchant ID *</Label>
              <Input
                value={form.merchantId || ''}
                onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                placeholder="معرف التاجر"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key *</Label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={form.apiKey || ''}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="مفتاح API"
                  className="font-mono pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-0 h-full"
                  onClick={onToggleSecret}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {!gateway && (
        <div className="space-y-2">
          <Label>نوع البوابة *</Label>
          <select
            value={form.gatewayType}
            onChange={(e) => {
              const selected = gatewayTypes.find(g => g.type === e.target.value)
              setForm({ 
                ...form, 
                gatewayType: e.target.value,
                name: selected?.name || ''
              })
            }}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="">اختر نوع البوابة</option>
            {gatewayTypes.map((g) => (
              <option key={g.type} value={g.type}>
                {g.name} ({g.nameEn})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {form.gatewayType && (
        <>
          {renderFields()}
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">وضع الإنتاج</span>
              <Switch 
                checked={form.isLive} 
                onCheckedChange={(checked) => setForm({ ...form, isLive: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">مفعّل</span>
              <Switch 
                checked={form.isActive} 
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نسبة العمولة %</Label>
              <Input
                type="number"
                step="0.1"
                value={form.feesPercent}
                onChange={(e) => setForm({ ...form, feesPercent: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>عمولة ثابتة</Label>
              <Input
                type="number"
                step="0.01"
                value={form.feesFixed}
                onChange={(e) => setForm({ ...form, feesFixed: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>يتم تشفير البيانات الحساسة وحفظها بأمان لكل شركة على حدة</span>
          </div>
        </>
      )}
      
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button onClick={() => onSave(form)} disabled={loading || !form.gatewayType}>
          {loading ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ
        </Button>
      </DialogFooter>
    </div>
  )
}

// ===================== MAIN COMPONENT =====================
export default function PaymentGatewaySettings() {
  const [gateways, setGateways] = useState<CompanyPaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<CompanyPaymentGateway | null>(null)
  const [testLoading, setTestLoading] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [formKey, setFormKey] = useState(0) // Used to reset form

  // Fetch gateways
  const fetchGateways = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/payment-gateways')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setGateways(data.gateways || [])
    } catch (error) {
      console.error('Error fetching gateways:', error)
      toast.error('فشل في تحميل بوابات الدفع')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGateways()
  }, [fetchGateways])

  // Save gateway
  const handleSave = async (data: GatewayFormData) => {
    try {
      setSaving(true)
      
      const url = '/api/payment-gateways'
      const method = selectedGateway ? 'PUT' : 'POST'
      const body = selectedGateway 
        ? { id: selectedGateway.id, ...data }
        : data
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save')
      }
      
      toast.success(selectedGateway ? 'تم تحديث البوابة بنجاح' : 'تم إضافة البوابة بنجاح')
      setDialogOpen(false)
      setSelectedGateway(null)
      fetchGateways()
    } catch (error) {
      console.error('Error saving gateway:', error)
      toast.error('فشل في حفظ البوابة')
    } finally {
      setSaving(false)
    }
  }

  // Delete gateway
  const handleDelete = async (gateway: CompanyPaymentGateway) => {
    if (!confirm(`هل أنت متأكد من حذف بوابة "${gateway.name}"؟`)) return
    
    try {
      const res = await fetch(`/api/payment-gateways?id=${gateway.id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete')
      
      toast.success('تم حذف البوابة بنجاح')
      fetchGateways()
    } catch (error) {
      console.error('Error deleting gateway:', error)
      toast.error('فشل في حذف البوابة')
    }
  }

  // Toggle active
  const handleToggleActive = async (gateway: CompanyPaymentGateway) => {
    try {
      const res = await fetch('/api/payment-gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: gateway.id,
          isActive: !gateway.isActive
        })
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      toast.success(gateway.isActive ? 'تم تعطيل البوابة' : 'تم تفعيل البوابة')
      fetchGateways()
    } catch (error) {
      console.error('Error toggling gateway:', error)
      toast.error('فشل في تحديث البوابة')
    }
  }

  // Set as default
  const handleSetDefault = async (gateway: CompanyPaymentGateway) => {
    try {
      const res = await fetch('/api/payment-gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: gateway.id,
          isDefault: true
        })
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      toast.success('تم تعيين البوابة كافتراضية')
      fetchGateways()
    } catch (error) {
      console.error('Error setting default:', error)
      toast.error('فشل في تعيين البوابة الافتراضية')
    }
  }

  // Test gateway
  const handleTest = async (gateway: CompanyPaymentGateway) => {
    try {
      setTestLoading(gateway.id)
      
      const res = await fetch('/api/payment-gateways/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayId: gateway.id })
      })
      
      const result = await res.json()
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      
      fetchGateways()
    } catch (error) {
      console.error('Error testing gateway:', error)
      toast.error('فشل في اختبار البوابة')
    } finally {
      setTestLoading(null)
    }
  }

  // Open dialog for new/edit
  const openDialog = (gateway: CompanyPaymentGateway | null) => {
    setSelectedGateway(gateway)
    setFormKey(prev => prev + 1) // Reset form
    setShowSecret(false)
    setDialogOpen(true)
  }

  const getGatewayInfo = (type: string) => {
    return gatewayTypes.find(g => g.type === type) || gatewayTypes[0]
  }

  const activeCount = gateways.filter(g => g.isActive).length
  const defaultGateway = gateways.find(g => g.isDefault)

  if (loading) {
    return (
      <div className="space-y-6 p-6" dir="rtl">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">بوابات الدفع</h1>
            <p className="text-muted-foreground text-sm">إعدادات خاصة بالشركة - نظام SaaS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-3 w-3 ml-1" />
            {activeCount} مفعّل
          </Badge>
          {defaultGateway && (
            <Badge className="bg-yellow-500/10 text-yellow-600">
              <Star className="h-3 w-3 ml-1" />
              الافتراضي: {defaultGateway.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">نظام SaaS متعدد الشركات</p>
              <p className="text-xs">كل شركة لها إعداداتها الخاصة ومفاتيحها المستقلة. البيانات محفوظة بشكل آمن ومشفّر.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Button */}
      <Button onClick={() => openDialog(null)} className="gap-2">
        <Plus className="h-4 w-4" />
        إضافة بوابة دفع جديدة
      </Button>

      {/* Gateways Grid */}
      {gateways.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">لا توجد بوابات دفع</h3>
            <p className="text-sm text-muted-foreground mb-4">
              قم بإضافة بوابة دفع لبدء استقبال المدفوعات
            </p>
            <Button onClick={() => openDialog(null)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة بوابة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gateways.map((gateway) => {
            const info = getGatewayInfo(gateway.gatewayType)
            return (
              <GatewayCard
                key={gateway.id}
                gateway={gateway}
                gatewayInfo={info}
                onEdit={() => openDialog(gateway)}
                onDelete={() => handleDelete(gateway)}
                onToggleActive={() => handleToggleActive(gateway)}
                onSetDefault={() => handleSetDefault(gateway)}
                onTest={() => handleTest(gateway)}
                testLoading={testLoading === gateway.id}
              />
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedGateway(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGateway && getGatewayInfo(selectedGateway.gatewayType) && (
                <div className={`${getGatewayInfo(selectedGateway.gatewayType).bgColor} p-2 rounded-lg`}>
                  {(() => {
                    const Icon = getGatewayInfo(selectedGateway.gatewayType).icon
                    return <Icon className={`h-5 w-5 ${getGatewayInfo(selectedGateway.gatewayType).color}`} />
                  })()}
                </div>
              )}
              {selectedGateway ? 'تعديل بوابة الدفع' : 'إضافة بوابة دفع جديدة'}
            </DialogTitle>
            <DialogDescription>
              قم بإدخال بيانات الربط الخاصة بك
            </DialogDescription>
          </DialogHeader>
          
          <GatewayForm
            key={formKey}
            gateway={selectedGateway}
            onSave={handleSave}
            onCancel={() => { setDialogOpen(false); setSelectedGateway(null) }}
            loading={saving}
            showSecret={showSecret}
            onToggleSecret={() => setShowSecret(!showSecret)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Hook لاستخدام بوابات الدفع الخاصة بالشركة
export function useCompanyPaymentGateways() {
  const [gateways, setGateways] = useState<CompanyPaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultGateway, setDefaultGateway] = useState<CompanyPaymentGateway | null>(null)

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/payment-gateways')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        const gatewaysList = data.gateways || []
        setGateways(gatewaysList)
        setDefaultGateway(gatewaysList.find((g: CompanyPaymentGateway) => g.isDefault && g.isActive) || null)
      } catch (error) {
        console.error('Error fetching gateways:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGateways()
  }, [])

  const getActiveGateways = () => gateways.filter(g => g.isActive)
  
  const getGatewayByType = (type: string) => gateways.find(g => g.gatewayType === type && g.isActive)

  return {
    gateways,
    loading,
    defaultGateway,
    getActiveGateways,
    getGatewayByType
  }
}
