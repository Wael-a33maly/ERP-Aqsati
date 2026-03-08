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
import { Plus, Search, Loader2, Trash2, ArrowLeftRight, Check, X, Eye, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface InventoryTransfer {
  id: string
  transferNumber: string
  transferDate: string
  transferType: string
  status: string
  subtotal: number
  totalItems: number
  reason?: string
  FromWarehouse?: { id: string; name: string; code: string }
  ToWarehouse?: { id: string; name: string; code: string }
  FromBranch?: { id: string; name: string }
  ToBranch?: { id: string; name: string }
  InventoryTransferItem?: any[]
}

type ViewMode = 'list' | 'add' | 'view'

export default function InventoryTransfersManagement() {
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTransfer, setSelectedTransfer] = useState<InventoryTransfer | null>(null)

  // Form data
  const [formData, setFormData] = useState<any>({
    fromWarehouseId: '',
    toWarehouseId: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitCost: 0 }]
  })

  // Reference data
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || '')
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

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
      fetchTransfers()
      fetchWarehouses()
      fetchProducts()
    }
  }, [selectedCompanyId])

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory-transfers?companyId=${selectedCompanyId}&search=${search}`)
      const data = await res.json()
      if (data.success) setTransfers(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في جلب التحويلات')
    } finally {
      setLoading(false)
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

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0
    formData.items.forEach((item: any) => {
      subtotal += item.quantity * (item.unitCost || 0)
    })
    return { subtotal, totalItems: formData.items.length }
  }

  // Add item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitCost: 0 }]
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
        newItems[index].unitCost = product.costPrice || 0
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  // Save transfer
  const handleSave = async (status: string = 'draft') => {
    if (!formData.fromWarehouseId || !formData.toWarehouseId) {
      toast.error('يجب اختيار المخزن المصدر والمخزن المستقبل')
      return
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast.error('لا يمكن التحويل من وإلى نفس المخزن')
      return
    }

    if (!formData.items.some((item: any) => item.productId && item.quantity > 0)) {
      toast.error('يجب إضافة صنف واحد على الأقل')
      return
    }

    setSaving(true)
    try {
      const totals = calculateTotals()
      
      const res = await fetch('/api/inventory-transfers', {
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
        toast.success(status === 'approved' ? 'تم اعتماد التحويل' : 'تم حفظ التحويل')
        setViewMode('list')
        resetForm()
        fetchTransfers()
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

  // Approve transfer
  const handleApprove = async (id: string) => {
    if (!confirm('هل أنت متأكد من اعتماد هذا التحويل؟')) return
    
    try {
      const res = await fetch(`/api/inventory-transfers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('تم اعتماد التحويل')
        fetchTransfers()
      } else {
        toast.error(data.error || 'فشل في الاعتماد')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في الاعتماد')
    }
  }

  // Complete transfer
  const handleComplete = async (id: string) => {
    if (!confirm('هل أنت متأكد من استلام هذا التحويل؟')) return
    
    try {
      const res = await fetch(`/api/inventory-transfers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('تم استلام التحويل')
        fetchTransfers()
      } else {
        toast.error(data.error || 'فشل في الاستلام')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في الاستلام')
    }
  }

  // Delete transfer
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التحويل؟')) return

    try {
      const res = await fetch(`/api/inventory-transfers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم حذف التحويل')
        fetchTransfers()
      } else {
        toast.error(data.error || 'فشل في الحذف')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في الحذف')
    }
  }

  // View transfer
  const handleView = async (transfer: InventoryTransfer) => {
    try {
      const res = await fetch(`/api/inventory-transfers/${transfer.id}`)
      const data = await res.json()
      if (data.success) {
        setSelectedTransfer(data.data)
        setViewMode('view')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      fromWarehouseId: '',
      toWarehouseId: '',
      transferDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      items: [{ productId: '', quantity: 1, unitCost: 0 }]
    })
  }

  const formatCurrency = (amount: number) => `${amount.toLocaleString('ar-EG')} ج.م`

  const statusColors: any = {
    draft: 'bg-gray-500/10 text-gray-600',
    pending: 'bg-yellow-500/10 text-yellow-600',
    approved: 'bg-blue-500/10 text-blue-600',
    completed: 'bg-green-500/10 text-green-600',
    cancelled: 'bg-red-500/10 text-red-600'
  }

  const statusLabels: any = {
    draft: 'مسودة',
    pending: 'معلقة',
    approved: 'في الطريق',
    completed: 'مكتملة',
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
            <h2 className="text-2xl font-bold">التحويلات بين المخازن</h2>
            <p className="text-muted-foreground">إدارة التحويلات بين المخازن والفروع</p>
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
              تحويل جديد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
              <p className="text-2xl font-bold">{transfers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">في الطريق</p>
              <p className="text-2xl font-bold text-blue-600">{transfers.filter(t => t.status === 'approved').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">مكتملة</p>
              <p className="text-2xl font-bold text-green-600">{transfers.filter(t => t.status === 'completed').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">عدد الأصناف المحولة</p>
              <p className="text-2xl font-bold">{transfers.reduce((sum, t) => sum + t.totalItems, 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم التحويل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transfers.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد تحويلات</p>
                <Button className="mt-4" onClick={() => { resetForm(); setViewMode('add') }}>
                  <Plus className="h-4 w-4 ml-2" />إنشاء تحويل
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم التحويل</TableHead>
                      <TableHead className="text-right">من</TableHead>
                      <TableHead className="text-right">إلى</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الأصناف</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-mono">{transfer.transferNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transfer.FromWarehouse?.name}</p>
                            {transfer.FromBranch && (
                              <p className="text-xs text-muted-foreground">{transfer.FromBranch.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transfer.ToWarehouse?.name}</p>
                            {transfer.ToBranch && (
                              <p className="text-xs text-muted-foreground">{transfer.ToBranch.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(transfer.transferDate).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{transfer.totalItems}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[transfer.status] || statusColors.draft}>
                            {statusLabels[transfer.status] || transfer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(transfer)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transfer.status === 'draft' && (
                              <>
                                <Button variant="ghost" size="icon" className="text-blue-500" onClick={() => handleApprove(transfer.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(transfer.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {transfer.status === 'approved' && (
                              <Button variant="ghost" size="icon" className="text-green-500" onClick={() => handleComplete(transfer.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
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
          <h2 className="text-2xl font-bold">تحويل جديد بين المخازن</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">بيانات التحويل</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>المخزن المصدر *</Label>
                  <Select value={formData.fromWarehouseId} onValueChange={(v) => setFormData({ ...formData, fromWarehouseId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن المصدر" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id} disabled={w.id === formData.toWarehouseId}>
                          {w.name} {w.Branch && `(${w.Branch.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المخزن المستقبل *</Label>
                  <Select value={formData.toWarehouseId} onValueChange={(v) => setFormData({ ...formData, toWarehouseId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن المستقبل" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id} disabled={w.id === formData.fromWarehouseId}>
                          {w.name} {w.Branch && `(${w.Branch.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ التحويل</Label>
                  <Input
                    type="date"
                    value={formData.transferDate}
                    onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>سبب التحويل</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="سبب التحويل"
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
                        <TableHead className="w-32">التكلفة</TableHead>
                        <TableHead className="w-32">الإجمالي</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item: any, index: number) => (
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
                              value={item.unitCost}
                              onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(item.quantity * item.unitCost)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                  <span>عدد الأصناف:</span>
                  <span>{totals.totalItems}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>إجمالي التكلفة:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button className="w-full" onClick={() => handleSave('approved')} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  <Check className="h-4 w-4 ml-2" />
                  اعتماد التحويل
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
  if (viewMode === 'view' && selectedTransfer) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedTransfer(null) }}>
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <h2 className="text-2xl font-bold">تفاصيل التحويل</h2>
          <Badge className={statusColors[selectedTransfer.status]}>
            {statusLabels[selectedTransfer.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Transfer Info */}
            <Card>
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم التحويل</Label>
                  <p className="font-mono font-bold text-lg">{selectedTransfer.transferNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">من مخزن</Label>
                  <p className="font-bold">{selectedTransfer.FromWarehouse?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">إلى مخزن</Label>
                  <p className="font-bold">{selectedTransfer.ToWarehouse?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p>{new Date(selectedTransfer.transferDate).toLocaleDateString('ar-EG')}</p>
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
                        <TableHead>التكلفة</TableHead>
                        <TableHead>الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransfer.InventoryTransferItem?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.Product?.name || item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitCost)}</TableCell>
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
                  <span>عدد الأصناف:</span>
                  <span>{selectedTransfer.totalItems}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>إجمالي التكلفة:</span>
                  <span>{formatCurrency(selectedTransfer.subtotal)}</span>
                </div>
              </CardContent>
            </Card>

            {selectedTransfer.status === 'approved' && (
              <Card>
                <CardContent className="p-4">
                  <Button className="w-full" onClick={() => handleComplete(selectedTransfer.id)}>
                    <Check className="h-4 w-4 ml-2" />
                    تأكيد الاستلام
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
