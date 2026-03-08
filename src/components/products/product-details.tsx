'use client'

import {
  Package,
  Barcode,
  Tag,
  DollarSign,
  Layers,
  Hash,
  Calendar,
  Warehouse,
  Edit,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Product {
  id: string
  sku: string
  name: string
  nameAr?: string | null
  description?: string | null
  unit: string
  costPrice: number
  sellPrice: number
  minPrice?: number | null
  barcode?: string | null
  image?: string | null
  active: boolean
  category?: {
    id: string
    name: string
    nameAr?: string | null
  } | null
  inventory?: {
    warehouseId: string
    warehouse: {
      id: string
      name: string
      nameAr?: string | null
    }
    quantity: number
    minQuantity: number
  }[]
  totalStock?: number
  createdAt: string
  updatedAt: string
}

interface ProductDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onEdit: () => void
}

const UNIT_LABELS: Record<string, string> = {
  piece: 'قطعة',
  kg: 'كيلوغرام',
  g: 'غرام',
  liter: 'لتر',
  ml: 'ميليلتر',
  meter: 'متر',
  cm: 'سنتيمتر',
  box: 'صندوق',
  pack: 'باكيج',
  set: 'طقم',
}

export function ProductDetails({
  open,
  onOpenChange,
  product,
  onEdit,
}: ProductDetailsProps) {
  if (!product) return null

  const totalStock = product.totalStock ?? product.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) ?? 0
  const isLowStock = product.inventory?.some(inv => inv.quantity <= inv.minQuantity) ?? false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            تفاصيل المنتج
            {!product.active && (
              <Badge variant="secondary">غير نشط</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {product.nameAr || product.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Product Image and Basic Info */}
            <div className="flex gap-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-32 h-32 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center border">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-xl font-bold">{product.nameAr || product.name}</h3>
                  {product.nameAr && (
                    <p className="text-muted-foreground">{product.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    <Hash className="h-3 w-3 ml-1" />
                    {product.sku}
                  </Badge>
                  {product.barcode && (
                    <Badge variant="outline" className="font-mono">
                      <Barcode className="h-3 w-3 ml-1" />
                      {product.barcode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Alert */}
            {isLowStock && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="font-medium">تنبيه: المخزون منخفض</span>
              </div>
            )}

            {/* Pricing Section */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                الأسعار
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">سعر التكلفة</div>
                  <div className="text-lg font-bold">{product.costPrice.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">ر.س</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center border border-green-200">
                  <div className="text-sm text-green-600">سعر البيع</div>
                  <div className="text-lg font-bold text-green-700">{product.sellPrice.toLocaleString()}</div>
                  <div className="text-xs text-green-600">ر.س</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">الحد الأدنى</div>
                  <div className="text-lg font-bold">{product.minPrice?.toLocaleString() || '-'}</div>
                  <div className="text-xs text-muted-foreground">ر.س</div>
                </div>
              </div>
              {product.costPrice > 0 && product.sellPrice > 0 && (
                <div className="flex justify-center gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">هامش الربح: </span>
                    <span className="font-bold text-green-600">
                      {(((product.sellPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الربح: </span>
                    <span className="font-bold text-green-600">
                      {(product.sellPrice - product.costPrice).toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Category and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  الفئة
                </div>
                <div className="font-medium">
                  {product.category?.nameAr || product.category?.name || 'بدون فئة'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  الوحدة
                </div>
                <div className="font-medium">
                  {UNIT_LABELS[product.unit] || product.unit}
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold">الوصف</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Inventory by Warehouse */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                المخزون حسب المستودع
              </h4>
              {product.inventory && product.inventory.length > 0 ? (
                <div className="space-y-2">
                  {product.inventory.map((inv) => {
                    const isLow = inv.quantity <= inv.minQuantity
                    return (
                      <div
                        key={inv.warehouseId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isLow ? 'bg-amber-50 border-amber-200' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <span>{inv.warehouse.nameAr || inv.warehouse.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className={`text-lg font-bold ${isLow ? 'text-amber-700' : ''}`}>
                              {inv.quantity.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              الحد الأدنى: {inv.minQuantity}
                            </div>
                          </div>
                          {isLow && (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border">
                    <span className="font-semibold">إجمالي المخزون</span>
                    <span className="text-xl font-bold">{totalStock.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted rounded-lg">
                  <Warehouse className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا يوجد مخزون مسجل</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>تاريخ الإنشاء: {new Date(product.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>آخر تحديث: {new Date(product.updatedAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 ml-1" />
            تعديل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
