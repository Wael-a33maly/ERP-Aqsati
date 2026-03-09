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
import { Plus, Search, Loader2, Trash2, FileText, Check, X, Eye, UserPlus, ArrowRight, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  supplierInvoiceNumber?: string
  invoiceDate: string
  dueDate?: string
  status: string
  paymentStatus: string
  subtotal: number
  discount: number
  taxAmount: number
  total: number
  paidAmount: number
  remainingAmount: number
  notes?: string
  Supplier?: { id: string; name: string; supplierCode: string }
  Warehouse?: { id: string; name: string }
  Branch?: { id: string; name: string }
  PurchaseInvoiceItem?: any[]
}

type ViewMode = 'list' | 'add' | 'view'

export default function PurchaseInvoicesManagement() {
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<any>({
    supplierId: '',
    warehouseId: '',
    branchId: '',
    supplierInvoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 14 }]
  })

  // Reference data
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || '')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  // Supplier panel
  const [showSupplierPanel, setShowSupplierPanel] = useState(false)
  const [supplierFormData, setSupplierFormData] = useState<any>({
    name: '',
    nameAr: '',
    phone: '',
    phone2: '',
    email: '',
    city: '',
    address: '',
    taxNumber: '',
    commercialReg: '',
    creditLimit: 0,
    active: true
  })
  const [savingSupplier, setSavingSupplier] = useState(false)

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

  // Fetch data when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      fetchInvoices()
      fetchSuppliers()
      fetchWarehouses()
      fetchBranches()
      fetchProducts()
    }
  }, [selectedCompanyId])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/purchase-invoices?companyId=${selectedCompanyId}&search=${search}`)
      const data = await res.json()
      if (data.success) {
        setInvoices(data.data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('فشل في جلب الفواتير')
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
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`/api/warehouses?companyId=${selectedCompanyId}`)
      const data = await res.json()
      if (data.success) setWarehouses(data.data)
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch(`/api/branches?companyId=${selectedCompanyId}`)
      const data = await res.json()
      if (data.success) setBranches(data.data)
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?companyId=${selectedCompanyId}&limit=1000`)
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  useEffect(() => {
    if (search && viewMode === 'list') {
      const timeout = setTimeout(fetchInvoices, 300)
      return () => clearTimeout(timeout)
    }
  }, [search])

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0
    let taxAmount = 0
    
    formData.items.forEach((item: any) => {
      const itemTotal = item.quantity * item.unitPrice - (item.discount || 0)
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
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 14 }]
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

  // Save invoice
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
      
      const res = await fetch('/api/purchase-invoices', {
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
        toast.success(status === 'approved' ? 'تم اعتماد الفاتورة' : 'تم حفظ الفاتورة')
        setViewMode('list')
        resetForm()
        fetchInvoices()
      } else {
        toast.error(data.error || 'فشل في الحفظ')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('فشل في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  // Approve invoice
  const handleApprove = async (id: string) => {
    if (!confirm('هل أنت متأكد من اعتماد هذه الفاتورة؟')) return
    
    try {
      const res = await fetch(`/api/purchase-invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('تم اعتماد الفاتورة')
        fetchInvoices()
      } else {
        toast.error(data.error || 'فشل في الاعتماد')
      }
    } catch (error) {
      console.error('Error approving invoice:', error)
      toast.error('فشل في الاعتماد')
    }
  }

  // Delete invoice
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return

    try {
      const res = await fetch(`/api/purchase-invoices/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم حذف الفاتورة')
        fetchInvoices()
      } else {
        toast.error(data.error || 'فشل في الحذف')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('فشل في الحذف')
    }
  }

  // View invoice
  const handleView = async (invoice: PurchaseInvoice) => {
    try {
      const res = await fetch(`/api/purchase-invoices/${invoice.id}`)
      const data = await res.json()
      if (data.success) {
        setSelectedInvoice(data.data)
        setViewMode('view')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    }
  }

  // Add new supplier
  const handleAddSupplier = async () => {
    if (!supplierFormData.name) {
      toast.error('اسم المورد مطلوب')
      return
    }

    setSavingSupplier(true)
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...supplierFormData, companyId: selectedCompanyId })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('تم إضافة المورد')
        setShowSupplierPanel(false)
        setSupplierFormData({ 
          name: '', nameAr: '', phone: '', phone2: '', email: '', city: '', 
          address: '', taxNumber: '', commercialReg: '', creditLimit: 0, active: true 
        })
        fetchSuppliers()
        setFormData({ ...formData, supplierId: data.data.id })
      } else {
        toast.error(data.error || 'فشل في إضافة المورد')
      }
    } catch (error) {
      console.error('Error adding supplier:', error)
      toast.error('فشل في إضافة المورد')
    } finally {
      setSavingSupplier(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      supplierId: '',
      warehouseId: '',
      branchId: '',
      supplierInvoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 14 }]
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
            <h2 className="text-2xl font-bold">فواتير المشتريات</h2>
            <p className="text-muted-foreground">إدارة فواتير المشتريات من الموردين</p>
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
              فاتورة جديدة
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي القيمة</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">المستحق</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">المدفوع</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(invoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الفاتورة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد فواتير مشتريات</p>
                <Button className="mt-4" onClick={() => { resetForm(); setViewMode('add') }}>
                  <Plus className="h-4 w-4 ml-2" />إنشاء فاتورة
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">المورد</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.Supplier?.name || '-'}</TableCell>
                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(invoice.total)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[invoice.status] || statusColors.draft}>
                            {statusLabels[invoice.status] || invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(invoice)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invoice.status === 'draft' && (
                              <>
                                <Button variant="ghost" size="icon" className="text-green-500" onClick={() => handleApprove(invoice.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(invoice.id)}>
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

  // Add/Edit View
  if (viewMode === 'add') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewMode('list')}>
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <h2 className="text-2xl font-bold">فاتورة مشتريات جديدة</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-4">
            {/* Invoice Header */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">بيانات الفاتورة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>المورد *</Label>
                  <div className="flex gap-2">
                    <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="اختر المورد" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowSupplierPanel(true)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
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
                  <Label>الفرع</Label>
                  <Select value={formData.branchId || ''} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>رقم فاتورة المورد</Label>
                  <Input
                    value={formData.supplierInvoiceNumber}
                    onChange={(e) => setFormData({ ...formData, supplierInvoiceNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الفاتورة</Label>
                  <Input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الاستحقاق</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0)
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

          {/* Sidebar - Totals & Actions */}
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
                  اعتماد الفاتورة
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

        {/* Supplier Panel Overlay */}
        {showSupplierPanel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-4">
            <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>إضافة مورد جديد</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowSupplierPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المورد *</Label>
                    <Input
                      value={supplierFormData.name}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                      placeholder="اسم المورد"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم بالعربي</Label>
                    <Input
                      value={supplierFormData.nameAr}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, nameAr: e.target.value })}
                      placeholder="الاسم بالعربي"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الهاتف</Label>
                    <Input
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                      placeholder="رقم الهاتف"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>هاتف إضافي</Label>
                    <Input
                      value={supplierFormData.phone2}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, phone2: e.target.value })}
                      placeholder="رقم هاتف إضافي"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المدينة</Label>
                    <Input
                      value={supplierFormData.city}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, city: e.target.value })}
                      placeholder="المدينة"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Textarea
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                    placeholder="العنوان التفصيلي"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الرقم الضريبي</Label>
                    <Input
                      value={supplierFormData.taxNumber}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, taxNumber: e.target.value })}
                      placeholder="الرقم الضريبي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السجل التجاري</Label>
                    <Input
                      value={supplierFormData.commercialReg}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, commercialReg: e.target.value })}
                      placeholder="رقم السجل التجاري"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>حد الائتمان</Label>
                  <Input
                    type="number"
                    value={supplierFormData.creditLimit || 0}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, creditLimit: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleAddSupplier} disabled={savingSupplier}>
                    {savingSupplier && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                    حفظ
                  </Button>
                  <Button variant="outline" onClick={() => setShowSupplierPanel(false)}>إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // View Mode
  if (viewMode === 'view' && selectedInvoice) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedInvoice(null) }}>
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <h2 className="text-2xl font-bold">تفاصيل الفاتورة</h2>
          <Badge className={statusColors[selectedInvoice.status]}>
            {statusLabels[selectedInvoice.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Invoice Info */}
            <Card>
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم الفاتورة</Label>
                  <p className="font-mono font-bold text-lg">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المورد</Label>
                  <p className="font-bold">{selectedInvoice.Supplier?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المخزن</Label>
                  <p>{selectedInvoice.Warehouse?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p>{new Date(selectedInvoice.invoiceDate).toLocaleDateString('ar-EG')}</p>
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
                        <TableHead>الضريبة</TableHead>
                        <TableHead>الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.PurchaseInvoiceItem?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.Product?.name || item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.taxAmount)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {selectedInvoice.notes && (
              <Card>
                <CardContent className="p-4">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <p className="mt-1">{selectedInvoice.notes}</p>
                </CardContent>
              </Card>
            )}
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
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة:</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>الإجمالي:</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>المدفوع:</span>
                  <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold border-t pt-3">
                  <span>المستحق:</span>
                  <span>{formatCurrency(selectedInvoice.remainingAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full">
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return null
}
