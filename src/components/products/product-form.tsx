'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Upload, Barcode } from 'lucide-react'

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
  categoryId?: string | null
}

interface Category {
  id: string
  name: string
  nameAr?: string | null
  children?: Category[]
}

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  product?: Product | null
  defaultCategoryId?: string | null
  onSuccess: () => void
}

interface FormData {
  sku: string
  name: string
  nameAr: string
  description: string
  unit: string
  costPrice: number
  sellPrice: number
  minPrice: number | null
  barcode: string
  categoryId: string
  active: boolean
}

const UNITS = [
  { value: 'piece', label: 'قطعة' },
  { value: 'kg', label: 'كيلوغرام' },
  { value: 'g', label: 'غرام' },
  { value: 'liter', label: 'لتر' },
  { value: 'ml', label: 'ميليلتر' },
  { value: 'meter', label: 'متر' },
  { value: 'cm', label: 'سنتيمتر' },
  { value: 'box', label: 'صندوق' },
  { value: 'pack', label: 'باكيج' },
  { value: 'set', label: 'طقم' },
]

export function ProductForm({
  open,
  onOpenChange,
  companyId,
  product,
  defaultCategoryId,
  onSuccess,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [imageUrl, setImageUrl] = useState<string>(product?.image || '')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      sku: product?.sku || '',
      name: product?.name || '',
      nameAr: product?.nameAr || '',
      description: product?.description || '',
      unit: product?.unit || 'piece',
      costPrice: product?.costPrice || 0,
      sellPrice: product?.sellPrice || 0,
      minPrice: product?.minPrice || null,
      barcode: product?.barcode || '',
      categoryId: product?.categoryId || defaultCategoryId || '',
      active: product?.active ?? true,
    },
  })

  useEffect(() => {
    if (open) {
      fetchCategories()
      reset({
        sku: product?.sku || '',
        name: product?.name || '',
        nameAr: product?.nameAr || '',
        description: product?.description || '',
        unit: product?.unit || 'piece',
        costPrice: product?.costPrice || 0,
        sellPrice: product?.sellPrice || 0,
        minPrice: product?.minPrice || null,
        barcode: product?.barcode || '',
        categoryId: product?.categoryId || defaultCategoryId || '',
        active: product?.active ?? true,
      })
      setImageUrl(product?.image || '')
    }
  }, [open, product, defaultCategoryId, reset])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?companyId=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const generateSKU = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    setValue('sku', `PRD-${timestamp}-${random}`)
  }

  const generateBarcode = () => {
    // Generate EAN-13 style barcode
    const digits = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')
    // Calculate check digit
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10
    setValue('barcode', digits + checkDigit)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImageUrl(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = '/api/products'
      const method = product ? 'PUT' : 'POST'
      const body = {
        ...(product ? { id: product.id } : {}),
        companyId,
        sku: data.sku,
        name: data.name,
        nameAr: data.nameAr || null,
        description: data.description || null,
        unit: data.unit,
        costPrice: Number(data.costPrice),
        sellPrice: Number(data.sellPrice),
        minPrice: data.minPrice ? Number(data.minPrice) : null,
        barcode: data.barcode || null,
        image: imageUrl || null,
        categoryId: data.categoryId || null,
        active: data.active,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(product ? 'تم تحديث المنتج بنجاح' : 'تم إنشاء المنتج بنجاح')
        onSuccess()
      } else {
        toast.error(result.error || 'خطأ في حفظ المنتج')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('خطأ في حفظ المنتج')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setImageUrl('')
    onOpenChange(false)
  }

  // Flatten categories for select
  const flattenCategories = (cats: Category[], level = 0): { id: string; name: string; level: number }[] => {
    return cats.reduce((acc, cat) => {
      acc.push({ id: cat.id, name: cat.nameAr || cat.name, level })
      if (cat.children?.length) {
        acc.push(...flattenCategories(cat.children, level + 1))
      }
      return acc
    }, [] as { id: string; name: string; level: number }[])
  }

  const flatCategories = flattenCategories(categories)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات المنتج
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="pricing">الأسعار</TabsTrigger>
              <TabsTrigger value="media">الصور والباركود</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* SKU */}
              <div className="grid gap-2">
                <Label htmlFor="sku">رمز المنتج (SKU) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    {...register('sku', { required: 'رمز المنتج مطلوب' })}
                    placeholder="PRD-001"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateSKU}>
                    توليد
                  </Button>
                </div>
                {errors.sku && (
                  <p className="text-sm text-destructive">{errors.sku.message}</p>
                )}
              </div>

              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">اسم المنتج (English) *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'اسم المنتج مطلوب' })}
                  placeholder="Product Name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Arabic Name */}
              <div className="grid gap-2">
                <Label htmlFor="nameAr">اسم المنتج (عربي)</Label>
                <Input
                  id="nameAr"
                  {...register('nameAr')}
                  placeholder="اسم المنتج"
                  dir="rtl"
                />
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="categoryId">الفئة</Label>
                <Select
                  value={watch('categoryId') || "none"}
                  onValueChange={(value) => setValue('categoryId', value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون فئة</SelectItem>
                    {flatCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.level)}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit */}
              <div className="grid gap-2">
                <Label htmlFor="unit">الوحدة</Label>
                <Select
                  value={watch('unit')}
                  onValueChange={(value) => setValue('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الوحدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="وصف المنتج..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              {/* Cost Price */}
              <div className="grid gap-2">
                <Label htmlFor="costPrice">سعر التكلفة *</Label>
                <div className="relative">
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    {...register('costPrice', {
                      required: 'سعر التكلفة مطلوب',
                      min: { value: 0, message: 'يجب أن يكون السعر صفر أو أكثر' },
                    })}
                    placeholder="0.00"
                    className="pl-16"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ر.س
                  </span>
                </div>
                {errors.costPrice && (
                  <p className="text-sm text-destructive">{errors.costPrice.message}</p>
                )}
              </div>

              {/* Sell Price */}
              <div className="grid gap-2">
                <Label htmlFor="sellPrice">سعر البيع *</Label>
                <div className="relative">
                  <Input
                    id="sellPrice"
                    type="number"
                    step="0.01"
                    {...register('sellPrice', {
                      required: 'سعر البيع مطلوب',
                      min: { value: 0, message: 'يجب أن يكون السعر صفر أو أكثر' },
                    })}
                    placeholder="0.00"
                    className="pl-16"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ر.س
                  </span>
                </div>
                {errors.sellPrice && (
                  <p className="text-sm text-destructive">{errors.sellPrice.message}</p>
                )}
              </div>

              {/* Min Price */}
              <div className="grid gap-2">
                <Label htmlFor="minPrice">الحد الأدنى للسعر</Label>
                <div className="relative">
                  <Input
                    id="minPrice"
                    type="number"
                    step="0.01"
                    {...register('minPrice')}
                    placeholder="0.00"
                    className="pl-16"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ر.س
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  أقل سعر مسموح به عند الخصم
                </p>
              </div>

              {/* Profit Margin */}
              {watch('costPrice') > 0 && watch('sellPrice') > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>هامش الربح:</span>
                    <span className="font-bold">
                      {(((watch('sellPrice') - watch('costPrice')) / watch('costPrice')) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>الربح للوحدة:</span>
                    <span className="font-bold">
                      {(watch('sellPrice') - watch('costPrice')).toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              {/* Barcode */}
              <div className="grid gap-2">
                <Label htmlFor="barcode">الباركود</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    {...register('barcode')}
                    placeholder="أدخل الباركود أو توليد"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateBarcode}>
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="grid gap-2">
                <Label>صورة المنتج</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {imageUrl ? (
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="Product"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 left-2"
                        onClick={() => setImageUrl('')}
                      >
                        إزالة
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                      <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        انقر لتحميل صورة
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WEBP حتى 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Active Toggle */}
          <div className="flex items-center justify-between mt-6 p-4 border rounded-lg">
            <Label htmlFor="active">المنتج نشط</Label>
            <Switch
              id="active"
              checked={watch('active')}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : product ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
