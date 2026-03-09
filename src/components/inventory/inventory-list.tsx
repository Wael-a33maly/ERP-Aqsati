'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  AlertTriangle,
  Package,
  Filter,
  Download,
  Warehouse,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StockAdjustment } from './stock-adjustment'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  minQuantity: number
  maxQuantity?: number | null
  product: {
    id: string
    name: string
    nameAr?: string | null
    sku: string
    barcode?: string | null
    unit: string
    costPrice: number
    sellPrice: number
    category?: {
      id: string
      name: string
      nameAr?: string | null
    } | null
  }
  warehouse: {
    id: string
    name: string
    nameAr?: string | null
    code: string
  }
  isLowStock?: boolean
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'
}

interface Warehouse {
  id: string
  name: string
  nameAr?: string | null
  code: string
}

interface InventoryListProps {
  companyId: string
  preselectedWarehouseId?: string | null
}

export function InventoryList({ companyId, preselectedWarehouseId }: InventoryListProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState<string>(preselectedWarehouseId || '')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        companyId,
        page: page.toString(),
        limit: '30',
        ...(search && { search }),
        ...(warehouseFilter && { warehouseId: warehouseFilter }),
        ...(lowStockOnly && { lowStock: 'true' }),
      })

      const response = await fetch(`/api/inventory?${params}`)
      const data = await response.json()

      if (data.success) {
        setInventory(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('خطأ في تحميل المخزون')
    } finally {
      setLoading(false)
    }
  }, [companyId, page, search, warehouseFilter, lowStockOnly])

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await fetch(`/api/warehouses?companyId=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setWarehouses(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }, [companyId])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  useEffect(() => {
    setWarehouseFilter(preselectedWarehouseId || '')
  }, [preselectedWarehouseId])

  const handleAdjustment = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustmentOpen(true)
  }

  const handleAdjustmentSuccess = () => {
    setAdjustmentOpen(false)
    setSelectedItem(null)
    fetchInventory()
  }

  const exportToExcel = () => {
    const headers = ['SKU', 'المنتج', 'المستودع', 'الكمية', 'الحد الأدنى', 'الحالة', 'سعر التكلفة', 'القيمة']
    const rows = inventory.map(item => [
      item.product.sku,
      item.product.nameAr || item.product.name,
      item.warehouse.nameAr || item.warehouse.name,
      item.quantity,
      item.minQuantity,
      item.stockStatus === 'in_stock' ? 'متوفر' : item.stockStatus === 'low_stock' ? 'منخفض' : 'نفذ',
      item.product.costPrice,
      item.quantity * item.product.costPrice,
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('تم تصدير البيانات')
  }

  const getStockStatusBadge = (item: InventoryItem) => {
    const status = item.stockStatus
    if (status === 'out_of_stock') {
      return { label: 'نفذ المخزون', variant: 'destructive' as const, className: '' }
    }
    if (status === 'low_stock') {
      return { label: 'مخزون منخفض', variant: 'secondary' as const, className: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' }
    }
    return { label: 'متوفر', variant: 'default' as const, className: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' }
  }

  // Calculate summary stats
  const totalItems = inventory.length
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.product.costPrice), 0)
  const lowStockCount = inventory.filter(item => item.stockStatus !== 'in_stock').length

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            المخزون
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 ml-1" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BarChart3 className="h-4 w-4" />
              إجمالي الأصناف
            </div>
            <div className="text-2xl font-bold mt-1">{totalItems}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Package className="h-4 w-4" />
              إجمالي الكمية
            </div>
            <div className="text-2xl font-bold mt-1">{totalQuantity.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              إجمالي القيمة
            </div>
            <div className="text-2xl font-bold mt-1">{totalValue.toLocaleString()} ر.س</div>
          </div>
          <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-amber-50' : 'bg-muted'}`}>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
              تنبيهات المخزون
            </div>
            <div className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : ''}`}>
              {lowStockCount}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، SKU، الباركود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={warehouseFilter || "all"} onValueChange={(v) => setWarehouseFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 ml-1" />
              <SelectValue placeholder="كل المستودعات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستودعات</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.nameAr || wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={lowStockOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="gap-1"
          >
            <AlertTriangle className="h-4 w-4" />
            المخزون المنخفض
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مخزون</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">المستودع</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">الحد الأدنى</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const status = getStockStatusBadge(item)
                  return (
                    <TableRow key={item.id} className={item.stockStatus !== 'in_stock' ? 'bg-amber-50/50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product.nameAr || item.product.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {item.product.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          {item.warehouse.nameAr || item.warehouse.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${item.stockStatus !== 'in_stock' ? 'text-amber-600' : ''}`}>
                            {item.quantity.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {item.product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.minQuantity}</TableCell>
                      <TableCell>{(item.quantity * item.product.costPrice).toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className={status.className}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustment(item)}
                        >
                          <ArrowUpDown className="h-4 w-4 ml-1" />
                          تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              صفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              التالي
            </Button>
          </div>
        )}
      </CardContent>

      {/* Stock Adjustment Dialog */}
      <StockAdjustment
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        companyId={companyId}
        item={selectedItem}
        onSuccess={handleAdjustmentSuccess}
      />
    </Card>
  )
}
