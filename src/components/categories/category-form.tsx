'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  nameAr?: string | null
  code: string
  parentId?: string | null
  active: boolean
}

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  category?: Category | null
  parentCategory?: Category | null
  onSuccess: () => void
}

interface FormData {
  name: string
  nameAr: string
  code: string
  parentId: string
  active: boolean
}

export function CategoryForm({
  open,
  onOpenChange,
  companyId,
  category,
  parentCategory,
  onSuccess,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: category?.name || '',
      nameAr: category?.nameAr || '',
      code: category?.code || '',
      parentId: category?.parentId || parentCategory?.id || '',
      active: category?.active ?? true,
    },
  })

  // Fetch categories for parent selection
  useState(() => {
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
    if (open) {
      fetchCategories()
    }
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = '/api/categories'
      const method = category ? 'PUT' : 'POST'
      const body = {
        ...(category ? { id: category.id } : {}),
        companyId,
        name: data.name,
        nameAr: data.nameAr || null,
        code: data.code,
        parentId: data.parentId || null,
        active: data.active,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(category ? 'تم تحديث الفئة بنجاح' : 'تم إنشاء الفئة بنجاح')
        reset()
        onSuccess()
      } else {
        toast.error(result.error || 'خطأ في حفظ الفئة')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('خطأ في حفظ الفئة')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  // Filter out current category and its descendants from parent options
  const availableParents = categories.filter(c => {
    if (!category) return true
    if (c.id === category.id) return false
    // Simple check - in production, you'd want to check all descendants
    return true
  })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'تعديل الفئة' : parentCategory ? `إضافة فئة فرعية تحت "${parentCategory.nameAr || parentCategory.name}"` : 'إضافة فئة جديدة'}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الفئة
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">اسم الفئة (English) *</Label>
              <Input
                id="name"
                {...register('name', { required: 'اسم الفئة مطلوب' })}
                placeholder="Category Name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Arabic Name */}
            <div className="grid gap-2">
              <Label htmlFor="nameAr">اسم الفئة (عربي)</Label>
              <Input
                id="nameAr"
                {...register('nameAr')}
                placeholder="اسم الفئة"
                dir="rtl"
              />
            </div>

            {/* Code */}
            <div className="grid gap-2">
              <Label htmlFor="code">رمز الفئة *</Label>
              <Input
                id="code"
                {...register('code', { required: 'رمز الفئة مطلوب' })}
                placeholder="CAT-001"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Parent Category */}
            <div className="grid gap-2">
              <Label htmlFor="parentId">الفئة الأب</Label>
              <Select
                value={watch('parentId') || "none"}
                onValueChange={(value) => setValue('parentId', value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة الأب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون أب (فئة رئيسية)</SelectItem>
                  {availableParents.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAr || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">نشط</Label>
              <Switch
                id="active"
                checked={watch('active')}
                onCheckedChange={(checked) => setValue('active', checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : category ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
