'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  RotateCcw,
  Settings2,
  Package,
  Calendar,
  User,
  Warehouse,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface Movement {
  id: string
  productId: string
  warehouseId: string
  type: 'IN' | 'OUT' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT'
  quantity: number
  referenceType?: string | null
  referenceId?: string | null
  notes?: string | null
  createdAt: string
  product: {
    id: string
    name: string
    nameAr?: string | null
    sku: string
    unit: string
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
    branch?: {
      id: string
      name: string
      nameAr?: string | null
    } | null
  }
  createdByUser?: {
    id: string
    name: string
    nameAr?: string | null
  } | null
}

interface Warehouse {
  id: string
  name: string
  nameAr?: string | null
  code: string
}

interface InventoryMovementsProps {
  companyId: string
}

const MOVEMENT_TYPES = {
  IN: { label: 'وارد', icon: ArrowDownCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  OUT: { label: 'صادر', icon: ArrowUpCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  TRANSFER: { label: 'نقل', icon: ArrowRightLeft, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  RETURN: { label: 'مرتجع', icon: RotateCcw, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ADJUSTMENT: { label: 'تعديل', icon: Settings2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
}

export function InventoryMovements({ companyId }: InventoryMovementsProps) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        companyId,
        page: page.toString(),
        limit: '30',
        ...(search && { search }),
        ...(warehouseFilter && { warehouseId: warehouseFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })

      const response = await fetch(`/api/inventory/movements?${params}`)
      const data = await response.json()

      if (data.success) {
        setMovements(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
      toast.error('خطأ في تحميل حركات المخزون')
    } finally {
      setLoading(false)
    }
  }, [companyId, page, search, warehouseFilter, typeFilter, startDate, endDate])

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
    fetchMovements()
  }, [fetchMovements])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  const exportToExcel = () => {
    const headers = ['التاريخ', 'النوع', 'المنتج', 'SKU', 'المستودع', 'الكمية', 'الملاحظات', 'المستخدم']
    const rows = movements.map(m => [
      format(new Date(m.createdAt), 'yyyy-MM-dd HH:mm'),
      MOVEMENT_TYPES[m.type].label,
      m.product.nameAr || m.product.name,
      m.product.sku,
      m.warehouse.nameAr || m.warehouse.name,
      m.quantity,
      m.notes || '',
      m.createdByUser?.nameAr || m.createdByUser?.name || '',
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `movements-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('تم تصدير البيانات')
  }

  const clearFilters = () => {
    setSearch('')
    setWarehouseFilter('')
    setTypeFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            حركات المخزون
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 ml-1" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالمنتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={warehouseFilter || "all"} onValueChange={(v) => setWarehouseFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="المستودع" />
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
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {Object.entries(MOVEMENT_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Calendar className="h-4 w-4" />
                التاريخ
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <label className="text-sm">من تاريخ</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">إلى تاريخ</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRightLeft className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>لا توجد حركات مخزون</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">المستودع</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">الملاحظات</TableHead>
                  <TableHead className="text-right">المستخدم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const typeInfo = MOVEMENT_TYPES[movement.type]
                  const Icon = typeInfo.icon
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(movement.createdAt), 'yyyy-MM-dd HH:mm', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${typeInfo.bgColor} ${typeInfo.color} border-0 gap-1`}
                        >
                          <Icon className="h-3 w-3" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.product.nameAr || movement.product.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {movement.product.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{movement.warehouse.nameAr || movement.warehouse.name}</div>
                            {movement.warehouse.branch && (
                              <div className="text-xs text-muted-foreground">
                                {movement.warehouse.branch.nameAr || movement.warehouse.branch.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${movement.type === 'OUT' ? 'text-red-600' : movement.type === 'IN' ? 'text-green-600' : ''}`}>
                          {movement.type === 'OUT' ? '-' : movement.type === 'IN' ? '+' : ''}
                          {movement.quantity.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground text-sm mr-1">
                          {movement.product.unit}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate text-sm text-muted-foreground">
                          {movement.notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.createdByUser ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {movement.createdByUser.nameAr || movement.createdByUser.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
    </Card>
  )
}
