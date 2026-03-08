'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Loader2, Edit, Trash2, Building2, Phone, Mail, CreditCard, FileText, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

// Types
interface Supplier {
  id: string
  supplierCode: string
  name: string
  nameAr?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  city?: string
  taxNumber?: string
  commercialReg?: string
  creditLimit: number
  currentBalance: number
  balanceType: string
  paymentTerms: number
  currency: string
  notes?: string
  active: boolean
  createdAt: string
  _count?: {
    PurchaseInvoice: number
    PurchaseReturn: number
    SupplierPayment: number
  }
}

// Empty supplier template
const emptySupplier: Partial<Supplier> = {
  name: '',
  nameAr: '',
  phone: '',
  phone2: '',
  email: '',
  address: '',
  city: '',
  taxNumber: '',
  commercialReg: '',
  creditLimit: 0,
  currentBalance: 0,
  balanceType: 'CREDIT',
  paymentTerms: 0,
  currency: 'EGP',
  notes: '',
  active: true,
  hasOpeningBalance: false,
  openingBalance: 0
}

export default function SuppliersManagement() {
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<Partial<Supplier>>(emptySupplier)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || '')

  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/suppliers?companyId=${selectedCompanyId}&search=${search}`)
      const data = await res.json()
      if (data.success) {
        setSuppliers(data.data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error('فشل في جلب الموردين')
    } finally {
      setLoading(false)
    }
  }

  // Fetch companies for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchCompanies = async () => {
        try {
          const res = await fetch('/api/companies')
          const data = await res.json()
          if (data.success) {
            setCompanies(data.data)
            if (data.data.length > 0 && !selectedCompanyId) {
              setSelectedCompanyId(data.data[0].id)
            }
          }
        } catch (error) {
          console.error('Error fetching companies:', error)
        }
      }
      fetchCompanies()
    }
  }, [isSuperAdmin])

  useEffect(() => {
    if (selectedCompanyId) {
      fetchSuppliers()
    }
  }, [selectedCompanyId, search])

  // Open dialog for new supplier
  const handleAdd = () => {
    setSelectedSupplier(null)
    setFormData({ ...emptySupplier, companyId: selectedCompanyId })
    setDialogOpen(true)
  }

  // Open dialog for edit
  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({ ...supplier, hasOpeningBalance: false, openingBalance: 0 })
    setDialogOpen(true)
  }

  // Save supplier
  const handleSave = async () => {
    if (!formData.name) {
      toast.error('اسم المورد مطلوب')
      return
    }

    setSaving(true)
    try {
      const url = selectedSupplier 
        ? `/api/suppliers/${selectedSupplier.id}`
        : '/api/suppliers'
      
      const method = selectedSupplier ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, companyId: selectedCompanyId })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(selectedSupplier ? 'تم تحديث المورد' : 'تم إضافة المورد')
        setDialogOpen(false)
        fetchSuppliers()
      } else {
        toast.error(data.error || 'فشل في الحفظ')
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      toast.error('فشل في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  // Delete supplier
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return

    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم حذف المورد')
        fetchSuppliers()
      } else {
        toast.error(data.error || 'فشل في الحذف')
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('فشل في الحذف')
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة الموردين</h2>
          <p className="text-muted-foreground">إدارة بيانات الموردين وأرصدتهم</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSuperAdmin && (
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر الشركة" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مورد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموردين</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الموردين النشطين</p>
                <p className="text-2xl font-bold text-green-600">{suppliers.filter(s => s.active).length}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرصدة</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(suppliers.reduce((sum, s) => sum + s.currentBalance, 0))}</p>
              </div>
              <CreditCard className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حدود الائتمان</p>
                <p className="text-lg font-bold">{formatCurrency(suppliers.reduce((sum, s) => sum + (s.creditLimit || 0), 0))}</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا يوجد موردين</p>
              <Button className="mt-4" onClick={handleAdd}>
                <Plus className="h-4 w-4 ml-2" />إضافة مورد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الفواتير</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono">{supplier.supplierCode}</TableCell>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell>
                        <span className={supplier.currentBalance > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                          {formatCurrency(supplier.currentBalance)}
                        </span>
                        {supplier.currentBalance > 0 && (
                          <span className="text-xs text-muted-foreground mr-1">
                            ({supplier.balanceType === 'CREDIT' ? 'دائن' : 'مدين'})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.active ? 'default' : 'secondary'}>
                          {supplier.active ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline">{supplier._count?.PurchaseInvoice || 0} فواتير</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(supplier.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>اسم المورد *</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="اسم المورد"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربي</Label>
                <Input
                  value={formData.nameAr || ''}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="الاسم بالعربي"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><Phone className="h-4 w-4 inline ml-1" />الهاتف</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                />
              </div>
              <div className="space-y-2">
                <Label>هاتف إضافي</Label>
                <Input
                  value={formData.phone2 || ''}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="رقم هاتف إضافي"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><Mail className="h-4 w-4 inline ml-1" />البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="المدينة"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>العنوان</Label>
              <Textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="العنوان التفصيلي"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><FileText className="h-4 w-4 inline ml-1" />الرقم الضريبي</Label>
                <Input
                  value={formData.taxNumber || ''}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder="الرقم الضريبي"
                />
              </div>
              <div className="space-y-2">
                <Label>السجل التجاري</Label>
                <Input
                  value={formData.commercialReg || ''}
                  onChange={(e) => setFormData({ ...formData, commercialReg: e.target.value })}
                  placeholder="رقم السجل التجاري"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><CreditCard className="h-4 w-4 inline ml-1" />حد الائتمان</Label>
                <Input
                  type="number"
                  value={formData.creditLimit || 0}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>شروط السداد (أيام)</Label>
                <Input
                  type="number"
                  value={formData.paymentTerms || 0}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Opening Balance - Only for new supplier */}
            {!selectedSupplier && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Switch
                    checked={formData.hasOpeningBalance || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasOpeningBalance: checked })}
                  />
                  <Label>هل يوجد رصيد أول المدة؟</Label>
                </div>

                {formData.hasOpeningBalance && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>قيمة الرصيد</Label>
                      <Input
                        type="number"
                        value={formData.openingBalance || 0}
                        onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع الرصيد</Label>
                      <Select
                        value={formData.balanceType || 'CREDIT'}
                        onValueChange={(value) => setFormData({ ...formData, balanceType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT">دائن (الشركة مدينة للمورد)</SelectItem>
                          <SelectItem value="DEBIT">مدين (المورد مدين للشركة)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.active !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label>مورد نشط</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
