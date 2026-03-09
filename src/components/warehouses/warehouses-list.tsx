'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Warehouse as WarehouseIcon,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  MapPin,
  Package,
  Star,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WarehouseForm } from './warehouse-form'
import { toast } from 'sonner'

interface Warehouse {
  id: string
  name: string
  nameAr?: string | null
  code: string
  address?: string | null
  isMain: boolean
  active: boolean
  branch?: {
    id: string
    name: string
    nameAr?: string | null
  } | null
  _count?: {
    inventory: number
    movements: number
  }
  totalItems?: number
  totalValue?: number
}

interface WarehousesListProps {
  companyId: string
  onSelect?: (warehouse: Warehouse) => void
  selectedWarehouseId?: string | null
}

export function WarehousesList({
  companyId,
  onSelect,
  selectedWarehouseId,
}: WarehousesListProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null)

  const fetchWarehouses = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/warehouses?companyId=${companyId}&includeInventory=true`
      )
      const data = await response.json()

      if (data.success) {
        setWarehouses(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      toast.error('خطأ في تحميل المستودعات')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) {
      fetchWarehouses()
    }
  }, [companyId, fetchWarehouses])

  const handleAddWarehouse = () => {
    setEditingWarehouse(null)
    setFormOpen(true)
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormOpen(true)
  }

  const handleDeleteClick = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!warehouseToDelete) return

    try {
      const response = await fetch(
        `/api/warehouses?id=${warehouseToDelete.id}&companyId=${companyId}`,
        { method: 'DELETE' }
      )
      const data = await response.json()

      if (data.success) {
        toast.success('تم حذف المستودع بنجاح')
        fetchWarehouses()
      } else {
        toast.error(data.error || 'خطأ في حذف المستودع')
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error)
      toast.error('خطأ في حذف المستودع')
    } finally {
      setDeleteDialogOpen(false)
      setWarehouseToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingWarehouse(null)
    fetchWarehouses()
  }

  const handleSetMain = async (warehouse: Warehouse) => {
    try {
      const response = await fetch('/api/warehouses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: warehouse.id,
          companyId,
          isMain: true,
        }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success('تم تعيين المستودع كرئيسي')
        fetchWarehouses()
      } else {
        toast.error(data.error || 'خطأ في تحديث المستودع')
      }
    } catch (error) {
      console.error('Error setting main warehouse:', error)
      toast.error('خطأ في تحديث المستودع')
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <WarehouseIcon className="h-5 w-5" />
            المستودعات
          </CardTitle>
          <Button size="sm" onClick={handleAddWarehouse}>
            <Plus className="h-4 w-4 ml-1" />
            إضافة
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <WarehouseIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>لا توجد مستودعات</p>
                <Button variant="link" size="sm" onClick={handleAddWarehouse}>
                  إضافة مستودع جديد
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {warehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedWarehouseId === warehouse.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelect?.(warehouse)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${warehouse.isMain ? 'bg-amber-100' : 'bg-muted'}`}>
                          <WarehouseIcon className={`h-5 w-5 ${warehouse.isMain ? 'text-amber-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {warehouse.nameAr || warehouse.name}
                            </span>
                            {warehouse.isMain && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <Star className="h-3 w-3 ml-1" />
                                رئيسي
                              </Badge>
                            )}
                            {!warehouse.active && (
                              <Badge variant="secondary">غير نشط</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-mono">{warehouse.code}</span>
                            {warehouse.branch && (
                              <span className="mx-2">•</span>
                            )}
                            {warehouse.branch && (
                              <span className="flex items-center gap-1 inline-flex">
                                <Building2 className="h-3 w-3" />
                                {warehouse.branch.nameAr || warehouse.branch.name}
                              </span>
                            )}
                          </div>
                          {warehouse.address && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {warehouse.address}
                            </div>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleEditWarehouse(warehouse)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          {!warehouse.isMain && (
                            <DropdownMenuItem onClick={() => handleSetMain(warehouse)}>
                              <Star className="h-4 w-4 ml-2" />
                              تعيين كرئيسي
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(warehouse)}
                            disabled={warehouse._count?.inventory && warehouse._count.inventory > 0}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">الأصناف</div>
                          <div className="font-medium">{warehouse._count?.inventory || 0}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">الكمية الكلية</div>
                          <div className="font-medium">{warehouse.totalItems?.toLocaleString() || 0}</div>
                        </div>
                      </div>
                      {warehouse.totalValue !== undefined && (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm text-muted-foreground">القيمة</div>
                            <div className="font-medium">{warehouse.totalValue?.toLocaleString()} ر.س</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Warehouse Form Dialog */}
      <WarehouseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        companyId={companyId}
        warehouse={editingWarehouse}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف مستودع &quot;{warehouseToDelete?.nameAr || warehouseToDelete?.name}&quot;؟
              {warehouseToDelete?._count?.inventory && warehouseToDelete._count.inventory > 0 && (
                <div className="mt-2 text-destructive">
                  تحذير: هذا المستودع يحتوي على {warehouseToDelete._count.inventory} صنف ولا يمكن حذفه.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
