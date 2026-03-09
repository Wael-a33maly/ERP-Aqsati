'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, FileText, Building2, AlertTriangle, Loader2, Download, Package, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

export default function InventoryReportsPage() {
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(user?.companyId || '')
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  
  // Report data
  const [inventoryReport, setInventoryReport] = useState<any>(null)
  const [supplierStatement, setSupplierStatement] = useState<any>(null)
  
  // Dialogs
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

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

  // Fetch warehouses and suppliers
  useEffect(() => {
    if (selectedCompanyId) {
      fetchWarehouses()
      fetchSuppliers()
    }
  }, [selectedCompanyId])

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`/api/warehouses?companyId=${selectedCompanyId}`)
      const data = await res.json()
      if (data.success) {
        setWarehouses(data.data)
        if (data.data.length > 0) {
          setSelectedWarehouseId('')
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`/api/suppliers?companyId=${selectedCompanyId}`)
      const data = await res.json()
      if (data.success) {
        setSuppliers(data.data)
        if (data.data.length > 0) {
          setSelectedSupplierId('')
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Run inventory report
  const runInventoryReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/inventory/valuation?companyId=${selectedCompanyId}&warehouseId=${selectedWarehouseId}`)
      const data = await res.json()
      
      if (data.success) {
        setInventoryReport(data.data)
        setInventoryDialogOpen(true)
      } else {
        toast.error(data.error || 'فشل في إنشاء التقرير')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في إنشاء التقرير')
    } finally {
      setLoading(false)
    }
  }

  // Run supplier statement
  const runSupplierStatement = async () => {
    if (!selectedSupplierId) {
      toast.error('يجب اختيار المورد')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/suppliers/statement?supplierId=${selectedSupplierId}&companyId=${selectedCompanyId}`)
      const data = await res.json()
      
      if (data.success) {
        setSupplierStatement(data.data)
        setSupplierDialogOpen(true)
      } else {
        toast.error(data.error || 'فشل في إنشاء التقرير')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('فشل في إنشاء التقرير')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `${amount.toLocaleString('ar-EG')} ج.م`

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    const csv = headers + '\n' + rows
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('تم تصدير التقرير')
  }

  const reportCards = [
    {
      title: 'أرصدة المخازن',
      description: 'عرض أرصدة جميع المخازن والمنتجات',
      icon: Calculator,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      onClick: runInventoryReport
    },
    {
      title: 'كشف حساب مورد',
      description: 'تقرير حساب المورد والفواتير والدفعات',
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      onClick: () => {
        if (selectedSupplierId) {
          runSupplierStatement()
        } else {
          toast.error('اختر المورد أولاً')
        }
      }
    },
    {
      title: 'المنتجات منخفضة المخزون',
      description: 'عرض المنتجات التي وصلت للحد الأدنى',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      onClick: async () => {
        setLoading(true)
        try {
          const res = await fetch(`/api/reports/inventory/valuation?companyId=${selectedCompanyId}&minQuantity=0`)
          const data = await res.json()
          if (data.success) {
            const lowStock = data.data.filter((p: any) => 
              p.inventories.some((inv: any) => inv.isLowStock)
            )
            setInventoryReport({ ...data, data: lowStock, summary: { ...data.summary, totalProducts: lowStock.length } })
            setInventoryDialogOpen(true)
          }
        } catch (error) {
          toast.error('فشل في إنشاء التقرير')
        } finally {
          setLoading(false)
        }
      }
    },
    {
      title: 'ملخص المخزون',
      description: 'ملخص شامل لحالة المخزون',
      icon: Package,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      onClick: runInventoryReport
    },
    {
      title: 'تقرير الأصناف',
      description: 'تقرير تفصيلي بجميع الأصناف',
      icon: FileText,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      onClick: runInventoryReport
    },
    {
      title: 'تحليل المشتريات',
      description: 'تحليل عمليات الشراء',
      icon: BarChart3,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      onClick: runInventoryReport
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">تقارير المخازن</h2>
          <p className="text-muted-foreground">تقارير شاملة عن المخزون والموردين</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>المخزن</Label>
              <Select value={selectedWarehouseId || "all"} onValueChange={(v) => setSelectedWarehouseId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المخازن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المخازن</SelectItem>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المورد</Label>
              <Select value={selectedSupplierId || "none"} onValueChange={(v) => setSelectedSupplierId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">اختر المورد</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((report, i) => (
          <Card 
            key={i} 
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            onClick={report.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${report.bgColor} flex items-center justify-center`}>
                  <report.icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>جاري تحميل التقرير...</span>
          </div>
        </div>
      )}

      {/* Inventory Report Dialog */}
      <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>تقرير أرصدة المخازن</DialogTitle>
              <Button variant="outline" size="sm" onClick={() => inventoryReport && exportToCSV(inventoryReport.data, 'inventory-report')}>
                <Download className="h-4 w-4 ml-2" />تصدير
              </Button>
            </div>
          </DialogHeader>

          {inventoryReport && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">عدد المنتجات</p>
                  <p className="text-xl font-bold">{inventoryReport.summary?.totalProducts || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">إجمالي الكمية</p>
                  <p className="text-xl font-bold">{inventoryReport.summary?.totalQuantity?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">إجمالي القيمة</p>
                  <p className="text-xl font-bold">{formatCurrency(inventoryReport.summary?.totalValue || 0)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">منخفض المخزون</p>
                  <p className="text-xl font-bold text-red-600">{inventoryReport.summary?.lowStockCount || 0}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>المخزن</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>متوسط التكلفة</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryReport.data?.map((product: any) => (
                      product.inventories?.map((inv: any, idx: number) => (
                        <TableRow key={`${product.productId}-${idx}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">{product.productSku}</p>
                            </div>
                          </TableCell>
                          <TableCell>{inv.warehouseName}</TableCell>
                          <TableCell>{inv.quantity}</TableCell>
                          <TableCell>{formatCurrency(inv.avgCost)}</TableCell>
                          <TableCell>{formatCurrency(inv.totalCost)}</TableCell>
                          <TableCell>
                            {inv.isLowStock ? (
                              <Badge variant="destructive">منخفض</Badge>
                            ) : inv.quantity === 0 ? (
                              <Badge variant="secondary">نفذ</Badge>
                            ) : (
                              <Badge variant="default">متوفر</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Supplier Statement Dialog */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>كشف حساب المورد</DialogTitle>
              <Button variant="outline" size="sm" onClick={() => supplierStatement && exportToCSV(supplierStatement.transactions, 'supplier-statement')}>
                <Download className="h-4 w-4 ml-2" />تصدير
              </Button>
            </div>
          </DialogHeader>

          {supplierStatement && (
            <div className="space-y-4">
              {/* Supplier Info */}
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">المورد</p>
                    <p className="font-bold">{supplierStatement.supplier?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">كود المورد</p>
                    <p className="font-mono">{supplierStatement.supplier?.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                    <p className="font-bold text-xl text-red-600">{formatCurrency(supplierStatement.summary?.currentBalance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">نوع الرصيد</p>
                    <p className="font-bold">{supplierStatement.summary?.balance}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="grid gap-4 grid-cols-3">
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                  <p className="text-xl font-bold">{formatCurrency(supplierStatement.invoices?.total || 0)}</p>
                  <p className="text-xs text-muted-foreground">{supplierStatement.invoices?.count || 0} فاتورة</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(supplierStatement.payments?.total || 0)}</p>
                  <p className="text-xs text-muted-foreground">{supplierStatement.payments?.count || 0} دفعة</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">المرتجعات</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(supplierStatement.returns?.total || 0)}</p>
                  <p className="text-xs text-muted-foreground">{supplierStatement.returns?.count || 0} مرتجع</p>
                </div>
              </div>

              {/* Aging */}
              <div className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">أعمار الديون</h3>
                <div className="grid gap-2 grid-cols-5">
                  <div className="text-center p-2 rounded bg-green-500/10">
                    <p className="text-xs text-muted-foreground">حالي</p>
                    <p className="font-bold">{formatCurrency(supplierStatement.aging?.current || 0)}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-yellow-500/10">
                    <p className="text-xs text-muted-foreground">30 يوم</p>
                    <p className="font-bold">{formatCurrency(supplierStatement.aging?.days30 || 0)}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-orange-500/10">
                    <p className="text-xs text-muted-foreground">60 يوم</p>
                    <p className="font-bold">{formatCurrency(supplierStatement.aging?.days60 || 0)}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-red-500/10">
                    <p className="text-xs text-muted-foreground">90+ يوم</p>
                    <p className="font-bold">{formatCurrency(supplierStatement.aging?.days90 || 0)}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-gray-500/10">
                    <p className="text-xs text-muted-foreground">الإجمالي</p>
                    <p className="font-bold">{formatCurrency(supplierStatement.aging?.total || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div>
                <h3 className="font-semibold mb-2">الحركات</h3>
                <div className="overflow-x-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الرقم</TableHead>
                        <TableHead>مدين</TableHead>
                        <TableHead>دائن</TableHead>
                        <TableHead>الرصيد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierStatement.transactions?.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.date).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{t.type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{t.number}</TableCell>
                          <TableCell className="text-red-600">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</TableCell>
                          <TableCell className="text-green-600">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(t.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
