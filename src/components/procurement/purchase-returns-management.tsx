'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Loader2, Trash2, RotateCcw, Check, X, Eye, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface PurchaseReturn {
  id: string
  returnNumber: string
  returnDate: string
  status: string
  subtotal: number
  taxAmount: number
  total: number
  reason?: string
  Supplier?: { id: string; name: string }
  Warehouse?: { id: string; name: string }
  PurchaseInvoice?: { id: string; invoiceNumber: string }
  PurchaseReturnItem?: any[]
}

type ViewMode = 'list' | 'add' | 'view'

export default function PurchaseReturnsManagement() {
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const [returns, setReturns] = useState<PurchaseReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null)

  // Form data
  const [formData, setFormData] = useState<any>({
    supplierId: '',
    warehouseId: '',
    purchaseInvoiceId: '',
    returnDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, taxRate: 14 }]
  })

  // Reference data
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || '')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

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
          console.error('Error:', error)
        }
      }
      fetchCompanies()
    }
  }, [isSuperAdmin])

  // Fetch data when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      fetchReturns()
      fetchSuppliers()
      fetchWarehouses()
      fetchProducts()
      fetchInvoices()
    }
  }, [selectedCompanyId])

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/purchase-returns?companyId=${selectedCompanyId}&search=${search}`)
      const data = await res.json()
      if (data.success) setReturns(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في جلب المرتجعات')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`/api/suppliers?companyId=${selectedCompanyId}`)
      const data = await res.json()
      if (data.success) setSuppliers(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`/api/warehouses?companyId=${selectedCompanyId}`)
      const data = await res.json()
      if (data.success) setWarehouses(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?companyId=${selectedCompanyId}&limit=1000`)
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`/api/purchase-invoices?companyId=${selectedCompanyId}&status=approved&limit=100`)
      const data = await res.json()
      if (data.success) setInvoices(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0
    let taxAmount = 0
    
    formData.items.forEach((item: any) => {
      const itemTotal = item.quantity * item.unitPrice
      const itemTax = itemTotal * ((item.taxRate || 14) / 100)
      subtotal += itemTotal
      taxAmount += itemTax
    })
    
    return { subtotal, taxAmount, total: subtotal + taxAmount }
  }

  // Add item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, taxRate: 14 }]
    })
  }

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_: any, i: number) => i !== index)
      })
    }
  }

  // Update item
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].unitPrice = product.costPrice || 0
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  // Save return
  const handleSave = async (status: string = 'draft') => {
    if (!formData.supplierId || !formData.warehouseId) {
      toast.error('يجب اختيار المورد والمخزن')
      return
    }

    if (!formData.items.some((item: any) => item.productId && item.quantity > 0)) {
      toast.error('يجب إضافة صنف واحد على الأقل')
      return
    }

    setSaving(true)
    try {
      const totals = calculateTotals()
      
      const res = await fetch('/api/purchase-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: selectedCompanyId,
          status,
          ...totals
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(status === 'approved' ? 'تم اعتماد المرتجع' : 'تم حفظ المرتجع')
        setViewMode('list')
        resetForm()
        fetchReturns()
      } else {
        toast.error(data.error || 'فشل في الحفظ')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  // Approve return
  const handleApprove = async (id: string) => {
    if (!confirm('هل أنت متأكد من اعتماد هذا المرتجع؟')) return
    
    try {
      const res = await fetch(`/api/purchase-returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('تم اعتماد المرتجع')
        fetchReturns()
      } else {
        toast.error(data.error || 'فشل في الاعتماد')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في الاعتماد')
    }
  }

  // Delete return
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرتجع؟')) return

    try {
      const res = await fetch(`/api/purchase-returns/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم حذف المرتجع')
        fetchReturns()
      } else {
        toast.error(data.error || 'فشل في الحذف')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في الحذف')
    }
  }

  // View return
  const handleView = async (ret: PurchaseReturn) => {
    try {
      const res = await fetch(`/api/purchase-returns/${ret.id}`)
      const data = await res.json()
      if (data.success) {
        setSelectedReturn(data.data)
        setViewMode('view')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      supplierId: '',
      warehouseId: '',
      purchaseInvoiceId: '',
      returnDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0, taxRate: 14 }]
    })
  }

  const formatCurrency = (amount: number) => `${amount.toLocaleString('ar-EG')} ج.م`

  const statusColors: any = {
    draft: 'bg-gray-500/10 text-gray-600',
    pending: 'bg-yellow-500/10 text-yellow-600',
    approved: 'bg-green-500/10 text-green-600',
    cancelled: 'bg-red-500/10 text-red-600'
  }

  const statusLabels: any = {
    draft: 'مسودة',
    pending: 'معلقة',
    approved: 'معتمدة',
    cancelled: 'ملغاة'
  }

  const totals = calculateTotals()

  // List View
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">مرتجعات المشتريات</h2>
            <p className="text-muted-foreground">إدارة مرتجعات المشتريات للموردين</p>
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
            <Button onClick={() => { resetForm(); setViewMode('add') }}>
              <Plus className="h-4 w-4 ml-2" />
              مرتجع جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي المرتجعات</p>
              <p className="text-2xl font-bold">{returns.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">قيمة المرتجعات</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(returns.reduce((sum, r) => sum + r.total, 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">المعتمدة</p>
              <p className="text-2xl font-bold text-green-600">{returns.filter(r => r.status === 'approved').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : returns.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <RotateCcw className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد مرتجعات</p>
                <Button className="mt-4" onClick={() => { resetForm(); setViewMode('add') }}>
                  <Plus className="h-4 w-4 ml-2" />إنشاء مرتجع
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم المرتجع</TableHead>
                      <TableHead className="text-right">المورد</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-mono">{ret.returnNumber}</TableCell>
                        <TableCell>{ret.Supplier?.name || '-'}</TableCell>
                        <TableCell>{new Date(ret.returnDate).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(ret.total)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[ret.status] || statusColors.draft}>
                            {statusLabels[ret.status] || ret.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(ret)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {ret.status === 'draft' && (
                              <>
                                <Button variant="ghost" size="icon" className="text-green-500" onClick={() => handleApprove(ret.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(ret.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
      </div>
    )
  }

  // Add View
  if (viewMode === 'add') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewMode('list')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <h2 className="text-2xl font-bold">مرتجع مشتريات جديد</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">بيانات المرتجع</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>المورد *</Label>
                  <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المخزن *</Label>
                  <Select value={formData.warehouseId} onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>فاتورة المشتريات</Label>
                  <Select value={formData.purchaseInvoiceId || ''} onValueChange={(v) => setFormData({ ...formData, purchaseInvoiceId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفاتورة (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map(inv => (
                        <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ المرتجع</Label>
                  <Input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>سبب الإرجاع</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="سبب الإرجاع"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">الأصناف</CardTitle>
                  <Button size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 ml-1" />إضافة صنف
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-80">الصنف</TableHead>
                        <TableHead className="w-28">الكمية</TableHead>
                        <TableHead className="w-32">السعر</TableHead>
                        <TableHead className="w-24">الضريبة %</TableHead>
                        <TableHead className="w-32">الإجمالي</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item: any, index: number) => {
                        const itemTotal = item.quantity * item.unitPrice
                        const itemTax = itemTotal * ((item.taxRate || 14) / 100)
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Select value={item.productId} onValueChange={(v) => updateItem(index, 'productId', v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الصنف" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.taxRate}
                                onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell className="font-bold">
                              {formatCurrency(itemTotal + itemTax)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-4">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات..."
                  rows={2}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">الإجماليات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة:</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>الإجمالي:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button className="w-full" onClick={() => handleSave('approved')} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  <Check className="h-4 w-4 ml-2" />
                  اعتماد المرتجع
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleSave('draft')} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  حفظ مسودة
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setViewMode('list'); resetForm() }}>
                  إلغاء
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // View Mode
  if (viewMode === 'view' && selectedReturn) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedReturn(null) }}>
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <h2 className="text-2xl font-bold">تفاصيل المرتجع</h2>
          <Badge className={statusColors[selectedReturn.status]}>
            {statusLabels[selectedReturn.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Return Info */}
            <Card>
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم المرتجع</Label>
                  <p className="font-mono font-bold text-lg">{selectedReturn.returnNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المورد</Label>
                  <p className="font-bold">{selectedReturn.Supplier?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المخزن</Label>
                  <p>{selectedReturn.Warehouse?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p>{new Date(selectedReturn.returnDate).toLocaleDateString('ar-EG')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">الأصناف</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الصنف</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn.PurchaseReturnItem?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.Product?.name || item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{formatCurrency(selectedReturn.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة:</span>
                  <span>{formatCurrency(selectedReturn.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>الإجمالي:</span>
                  <span>{formatCurrency(selectedReturn.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return null
}
