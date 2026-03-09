'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, ArrowRight, Package, AlertTriangle } from 'lucide-react'

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
    unit: string
    costPrice: number
    sellPrice: number
  }
  warehouse: {
    id: string
    name: string
    nameAr?: string | null
    code: string
  }
}

interface StockAdjustmentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  item: InventoryItem | null
  onSuccess: () => void
}

type AdjustmentType = 'set' | 'add' | 'subtract'

interface FormData {
  adjustmentType: AdjustmentType
  quantity: number
  minQuantity: number
  maxQuantity: number | null
  notes: string
}

export function StockAdjustment({
  open,
  onOpenChange,
  companyId,
  item,
  onSuccess,
}: StockAdjustmentProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      adjustmentType: 'set',
      quantity: item?.quantity || 0,
      minQuantity: item?.minQuantity || 0,
      maxQuantity: item?.maxQuantity || null,
      notes: '',
    },
  })

  // Reset form when item changes
  useState(() => {
    if (item) {
      reset({
        adjustmentType: 'set',
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        notes: '',
      })
    }
  })

  const adjustmentType = watch('adjustmentType')
  const quantity = watch('quantity')

  const calculateNewQuantity = () => {
    if (!item) return 0
    switch (adjustmentType) {
      case 'add':
        return item.quantity + quantity
      case 'subtract':
        return Math.max(0, item.quantity - quantity)
      default:
        return quantity
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!item) return

    setLoading(true)
    try {
      const newQuantity = calculateNewQuantity()

      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: newQuantity,
          minQuantity: data.minQuantity,
          maxQuantity: data.maxQuantity || null,
          notes: data.notes,
          companyId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('تم تعديل المخزون بنجاح')
        onSuccess()
      } else {
        toast.error(result.error || 'خطأ في تعديل المخزون')
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('خطأ في تعديل المخزون')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  if (!item) return null

  const newQuantity = calculateNewQuantity()
  const diff = newQuantity - item.quantity

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل المخزون</DialogTitle>
          <DialogDescription>
            تعديل كمية {item.product.nameAr || item.product.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Product Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-md">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{item.product.nameAr || item.product.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {item.product.sku}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-sm text-muted-foreground">الكمية الحالية:</span>
                <span className="font-bold">{item.quantity.toLocaleString()} {item.product.unit}</span>
              </div>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>نوع التعديل</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={(value) => setValue('adjustmentType', value as AdjustmentType)}
                className="grid grid-cols-3 gap-2"
              >
                <div>
                  <RadioGroupItem
                    value="set"
                    id="set"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="set"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4 mb-1" />
                    تعيين
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="add"
                    id="add"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="add"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <ArrowUp className="h-4 w-4 mb-1 text-green-600" />
                    إضافة
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="subtract"
                    id="subtract"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="subtract"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <ArrowDown className="h-4 w-4 mb-1 text-red-600" />
                    خصم
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="quantity">
                {adjustmentType === 'set' ? 'الكمية الجديدة' : adjustmentType === 'add' ? 'الكمية المضافة' : 'الكمية المخصومة'}
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', {
                  required: 'الكمية مطلوبة',
                  min: { value: 0, message: 'يجب أن تكون الكمية صفر أو أكثر' },
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            {/* New Quantity Preview */}
            <div className={`p-3 rounded-lg ${diff > 0 ? 'bg-green-50' : diff < 0 ? 'bg-red-50' : 'bg-muted'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">الكمية الجديدة:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{newQuantity.toLocaleString()}</span>
                  {diff !== 0 && (
                    <Badge
                      variant={diff > 0 ? 'default' : 'destructive'}
                      className={diff > 0 ? 'bg-green-500' : ''}
                    >
                      {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Min Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="minQuantity">الحد الأدنى للتنبيه</Label>
              <Input
                id="minQuantity"
                type="number"
                step="0.01"
                {...register('minQuantity', {
                  min: { value: 0, message: 'يجب أن يكون صفر أو أكثر' },
                })}
              />
            </div>

            {/* Max Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="maxQuantity">الحد الأقصى (اختياري)</Label>
              <Input
                id="maxQuantity"
                type="number"
                step="0.01"
                {...register('maxQuantity')}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="سبب التعديل..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التعديل'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
