'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, Plus, Loader2, Check, X, Crown, Star, Settings, 
  Building2, Users, Package, FileText, Wallet, Receipt, BarChart3,
  Shield, Bell, Smartphone, Globe, Database, Zap, Edit, Trash2, Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

// أيقونات الميزات
const featureIcons: Record<string, any> = {
  max_branches: Building2,
  max_users: Users,
  max_customers: Users,
  max_products: Package,
  max_invoices: FileText,
  max_storage: Database,
  invoices_enabled: FileText,
  installments_enabled: CreditCard,
  payments_enabled: Wallet,
  payment_links: Receipt,
  advanced_reports: BarChart3,
  two_factor_auth: Shield,
  notifications_enabled: Bell,
  mobile_app: Smartphone,
  api_access: Globe,
  default: Zap
}

interface Feature {
  id: string
  planId: string
  featureKey: string
  featureName: string
  featureNameAr: string
  category: string
  categoryAr: string
  enabled: boolean
  limitValue: number | null
  limitUnit: string | null
  price: number | null
  description: string | null
  descriptionAr: string | null
  icon: string | null
}

interface Plan {
  id: string
  name: string
  nameAr: string
  code: string
  description: string | null
  descriptionAr: string | null
  price: number
  currency: string
  billingCycle: string
  trialDays: number
  sortOrder: number
  isPopular: boolean
  isDefault: boolean
  active: boolean
  PlanFeature?: Feature[]
}

interface FeatureCategory {
  category: string
  categoryAr: string
  features: Feature[]
}

// ============== مكون بطاقة الخطة ==============
function PlanCard({ 
  plan, 
  onSelect, 
  onEdit, 
  onDuplicate,
  isSelected 
}: { 
  plan: Plan
  onSelect: () => void
  onEdit: () => void
  onDuplicate: () => void
  isSelected: boolean
}) {
  const enabledFeatures = plan.PlanFeature?.filter(f => f.enabled).length || 0
  const totalFeatures = plan.PlanFeature?.length || 0
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      } ${plan.isPopular ? 'border-amber-500/50' : ''}`}
      onClick={onSelect}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Star className="h-3 w-3 ml-1" />
            الأكثر شعبية
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{plan.nameAr}</CardTitle>
            <CardDescription>{plan.name}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">
              {plan.price === 0 ? 'مجاني' : plan.price.toLocaleString()}
            </span>
            {plan.price > 0 && (
              <span className="text-muted-foreground">
                {plan.currency === 'EGP' ? 'ج.م' : plan.currency}
                {plan.billingCycle === 'YEARLY' ? '/سنة' : '/شهر'}
              </span>
            )}
          </div>
          {plan.trialDays > 0 && (
            <p className="text-sm text-muted-foreground">
              فترة تجريبية {plan.trialDays} يوم
            </p>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الميزات المفعلة</span>
            <span className="font-medium">{enabledFeatures} / {totalFeatures}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${(enabledFeatures / totalFeatures) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {plan.PlanFeature?.filter(f => f.enabled && f.limitValue).slice(0, 4).map(feature => (
            <Badge key={feature.id} variant="secondary" className="text-xs">
              {feature.featureNameAr}: {feature.limitValue === -1 ? '∞' : feature.limitValue}
            </Badge>
          ))}
          {enabledFeatures > 4 && (
            <Badge variant="outline" className="text-xs">
              +{enabledFeatures - 4}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Badge variant={plan.active ? 'default' : 'secondary'}>
            {plan.active ? 'نشطة' : 'معطلة'}
          </Badge>
          {plan.isDefault && (
            <Badge variant="outline">افتراضية</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============== مكون تعديل الميزات ==============
function FeatureEditor({ 
  features, 
  onUpdateFeature 
}: { 
  features: Feature[]
  onUpdateFeature: (featureId: string, enabled: boolean, limitValue?: number | null) => void
}) {
  // تجميع الميزات حسب الفئة
  const groupedFeatures = features.reduce((acc, feature) => {
    const key = feature.category
    if (!acc[key]) {
      acc[key] = {
        category: feature.category,
        categoryAr: feature.categoryAr,
        features: []
      }
    }
    acc[key].features.push(feature)
    return acc
  }, {} as Record<string, FeatureCategory>)
  
  const categories = Object.values(groupedFeatures)
  
  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.category} className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {cat.categoryAr}
            </h4>
            <div className="grid gap-2">
              {cat.features.map((feature) => (
                <div 
                  key={feature.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    feature.enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(checked) => 
                        onUpdateFeature(feature.id, checked, feature.limitValue)
                      }
                    />
                    <div>
                      <p className="text-sm font-medium">{feature.featureNameAr}</p>
                      <p className="text-xs text-muted-foreground">
                        {feature.descriptionAr || feature.featureName}
                      </p>
                    </div>
                  </div>
                  
                  {feature.enabled && feature.limitValue !== null && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 h-8 text-center"
                        value={feature.limitValue === -1 ? '' : feature.limitValue || 0}
                        placeholder="∞"
                        onChange={(e) => {
                          const val = e.target.value === '' ? -1 : parseInt(e.target.value)
                          onUpdateFeature(feature.id, true, val)
                        }}
                      />
                      {feature.limitUnit && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {feature.limitUnit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// ============== المكون الرئيسي ==============
export default function SubscriptionPlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [planForm, setPlanForm] = useState({
    name: '',
    nameAr: '',
    code: '',
    description: '',
    descriptionAr: '',
    price: 0,
    currency: 'EGP',
    billingCycle: 'YEARLY',
    trialDays: 0,
    sortOrder: 0,
    isPopular: false,
    isDefault: false,
    active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/plans?features=true')
      const data = await res.json()
      if (data.success) {
        setPlans(data.data)
        if (data.data.length > 0 && !selectedPlanId) {
          setSelectedPlanId(data.data[0].id)
        }
      }
    } catch (error) {
      toast.error('فشل في تحميل الخطط')
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  const handleUpdateFeature = async (featureId: string, enabled: boolean, limitValue?: number | null) => {
    try {
      const res = await fetch('/api/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId,
          enabled,
          limitValue
        })
      })
      
      if (res.ok) {
        // تحديث محلي
        setPlans(prev => prev.map(plan => {
          if (plan.id === selectedPlanId) {
            return {
              ...plan,
              PlanFeature: plan.PlanFeature?.map(f => 
                f.id === featureId 
                  ? { ...f, enabled, limitValue: limitValue ?? f.limitValue }
                  : f
              )
            }
          }
          return plan
        }))
        toast.success('تم تحديث الميزة')
      }
    } catch {
      toast.error('فشل في تحديث الميزة')
    }
  }

  const handleCreatePlan = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم إنشاء الخطة')
        setEditDialogOpen(false)
        resetForm()
        loadPlans()
      } else {
        toast.error(data.error || 'فشل في إنشاء الخطة')
      }
    } catch {
      toast.error('فشل في إنشاء الخطة')
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicatePlan = async (plan: Plan) => {
    try {
      setSaving(true)
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${plan.name} (Copy)`,
          nameAr: `${plan.nameAr} (نسخة)`,
          code: `${plan.code}-copy`,
          description: plan.description,
          descriptionAr: plan.descriptionAr,
          price: plan.price,
          currency: plan.currency,
          billingCycle: plan.billingCycle,
          trialDays: plan.trialDays,
          copyFromPlanId: plan.id
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم نسخ الخطة')
        loadPlans()
      }
    } catch {
      toast.error('فشل في نسخ الخطة')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return
    
    try {
      const res = await fetch(`/api/plans?id=${planId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم حذف الخطة')
        loadPlans()
        if (selectedPlanId === planId) {
          setSelectedPlanId(plans[0]?.id || null)
        }
      }
    } catch {
      toast.error('فشل في حذف الخطة')
    }
  }

  const resetForm = () => {
    setPlanForm({
      name: '',
      nameAr: '',
      code: '',
      description: '',
      descriptionAr: '',
      price: 0,
      currency: 'EGP',
      billingCycle: 'YEARLY',
      trialDays: 0,
      sortOrder: 0,
      isPopular: false,
      isDefault: false,
      active: true
    })
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
          <h2 className="text-2xl font-bold">إدارة الخطط والميزات</h2>
          <p className="text-muted-foreground">تحكم في خطط الاشتراك وميزات كل خطة</p>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          خطة جديدة
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* قائمة الخطط */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-lg">الخطط المتاحة ({plans.length})</h3>
          <div className="space-y-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlanId === plan.id}
                onSelect={() => setSelectedPlanId(plan.id)}
                onEdit={() => {
                  setSelectedPlanId(plan.id)
                  setPlanForm({
                    name: plan.name,
                    nameAr: plan.nameAr,
                    code: plan.code,
                    description: plan.description || '',
                    descriptionAr: plan.descriptionAr || '',
                    price: plan.price,
                    currency: plan.currency,
                    billingCycle: plan.billingCycle,
                    trialDays: plan.trialDays,
                    sortOrder: plan.sortOrder,
                    isPopular: plan.isPopular,
                    isDefault: plan.isDefault,
                    active: plan.active
                  })
                  setEditDialogOpen(true)
                }}
                onDuplicate={() => handleDuplicatePlan(plan)}
              />
            ))}
          </div>
        </div>

        {/* تفاصيل الخطة المحددة */}
        <div className="lg:col-span-2">
          {selectedPlan ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      {selectedPlan.nameAr}
                    </CardTitle>
                    <CardDescription>
                      تفعيل وتعطيل ميزات الخطة
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicatePlan(selectedPlan)}
                    >
                      <Copy className="h-4 w-4 ml-1" />
                      نسخ
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeletePlan(selectedPlan.id)}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="features">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="features">الميزات</TabsTrigger>
                    <TabsTrigger value="limits">الحدود</TabsTrigger>
                    <TabsTrigger value="settings">الإعدادات</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="features" className="mt-4">
                    <FeatureEditor
                      features={selectedPlan.PlanFeature || []}
                      onUpdateFeature={handleUpdateFeature}
                    />
                  </TabsContent>
                  
                  <TabsContent value="limits" className="mt-4">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4 pr-4">
                        {selectedPlan.PlanFeature?.filter(f => f.limitValue !== null).map(feature => (
                          <div 
                            key={feature.id}
                            className="flex items-center justify-between p-4 rounded-lg border"
                          >
                            <div>
                              <p className="font-medium">{feature.featureNameAr}</p>
                              <p className="text-sm text-muted-foreground">
                                {feature.descriptionAr}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-24 text-center"
                                value={feature.limitValue === -1 ? '' : feature.limitValue || 0}
                                placeholder="∞"
                                onChange={(e) => {
                                  const val = e.target.value === '' ? -1 : parseInt(e.target.value)
                                  handleUpdateFeature(feature.id, feature.enabled, val)
                                }}
                              />
                              {feature.limitUnit && (
                                <span className="text-sm text-muted-foreground">
                                  {feature.limitUnit}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-4">
                    <div className="space-y-4 max-w-md">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>اسم الخطة (EN)</Label>
                          <Input 
                            value={selectedPlan.name} 
                            disabled 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>اسم الخطة (AR)</Label>
                          <Input 
                            value={selectedPlan.nameAr} 
                            disabled 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>الكود</Label>
                          <Input 
                            value={selectedPlan.code} 
                            disabled 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>السعر</Label>
                            <Input 
                              type="number"
                              value={selectedPlan.price} 
                              disabled 
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>العملة</Label>
                            <Input 
                              value={selectedPlan.currency} 
                              disabled 
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label>خطة شائعة</Label>
                          <Badge variant={selectedPlan.isPopular ? 'default' : 'secondary'}>
                            {selectedPlan.isPopular ? 'نعم' : 'لا'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label>خطة افتراضية</Label>
                          <Badge variant={selectedPlan.isDefault ? 'default' : 'secondary'}>
                            {selectedPlan.isDefault ? 'نعم' : 'لا'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <Label>نشطة</Label>
                          <Badge variant={selectedPlan.active ? 'default' : 'secondary'}>
                            {selectedPlan.active ? 'نعم' : 'لا'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">اختر خطة لعرض وتعديل الميزات</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* نافذة إنشاء خطة جديدة */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء خطة جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>الاسم (EN)</Label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Pro"
                />
              </div>
              <div className="grid gap-2">
                <Label>الاسم (AR)</Label>
                <Input
                  value={planForm.nameAr}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="المحترف"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>الكود</Label>
              <Input
                value={planForm.code}
                onChange={(e) => setPlanForm(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                placeholder="pro"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>الوصف (EN)</Label>
                <Textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Best for established businesses"
                />
              </div>
              <div className="grid gap-2">
                <Label>الوصف (AR)</Label>
                <Textarea
                  value={planForm.descriptionAr}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, descriptionAr: e.target.value }))}
                  placeholder="الأفضل للشركات الراسخة"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>السعر</Label>
                <Input
                  type="number"
                  value={planForm.price}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>العملة</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={planForm.currency}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <option value="EGP">جنيه مصري (EGP)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>دورة الفوترة</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={planForm.billingCycle}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, billingCycle: e.target.value }))}
                >
                  <option value="MONTHLY">شهري</option>
                  <option value="YEARLY">سنوي</option>
                </select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>أيام التجربة المجانية</Label>
              <Input
                type="number"
                value={planForm.trialDays}
                onChange={(e) => setPlanForm(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.isPopular}
                  onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, isPopular: checked }))}
                />
                <Label>خطة شائعة</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.isDefault}
                  onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, isDefault: checked }))}
                />
                <Label>خطة افتراضية</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.active}
                  onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, active: checked }))}
                />
                <Label>نشطة</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreatePlan} disabled={saving || !planForm.name || !planForm.code}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              إنشاء الخطة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
