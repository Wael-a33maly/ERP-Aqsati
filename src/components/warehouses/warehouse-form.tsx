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
import { toast } from 'sonner'

interface Warehouse {
  id: string
  name: string
  nameAr?: string | null
  code: string
  address?: string | null
  branchId?: string | null
  isMain: boolean
  active: boolean
}

interface Branch {
  id: string
  name: string
  nameAr?: string | null
  code: string
}

interface WarehouseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  warehouse?: Warehouse | null
  onSuccess: () => void
}

interface FormData {
  name: string
  nameAr: string
  code: string
  address: string
  branchId: string
  isMain: boolean
  active: boolean
}

export function WarehouseForm({
  open,
  onOpenChange,
  companyId,
  warehouse,
  onSuccess,
}: WarehouseFormProps) {
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: warehouse?.name || '',
      nameAr: warehouse?.nameAr || '',
      code: warehouse?.code || '',
      address: warehouse?.address || '',
      branchId: warehouse?.branchId || '',
      isMain: warehouse?.isMain || false,
      active: warehouse?.active ?? true,
    },
  })

  useEffect(() => {
    if (open) {
      fetchBranches()
      reset({
        name: warehouse?.name || '',
        nameAr: warehouse?.nameAr || '',
        code: warehouse?.code || '',
        address: warehouse?.address || '',
        branchId: warehouse?.branchId || '',
        isMain: warehouse?.isMain || false,
        active: warehouse?.active ?? true,
      })
    }
  }, [open, warehouse, reset])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`/api/branches?companyId=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setBranches(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = '/api/warehouses'
      const method = warehouse ? 'PUT' : 'POST'
      const body = {
        ...(warehouse ? { id: warehouse.id } : {}),
        companyId,
        name: data.name,
        nameAr: data.nameAr || null,
        code: data.code,
        address: data.address || null,
        branchId: data.branchId || null,
        isMain: data.isMain,
        active: data.active,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(warehouse ? 'تم تحديث المستودع بنجاح' : 'تم إنشاء المستودع بنجاح')
        onSuccess()
      } else {
        toast.error(result.error || 'خطأ في حفظ المستودع')
      }
    } catch (error) {
      console.error('Error saving warehouse:', error)
      toast.error('خطأ في حفظ المستودع')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {warehouse ? 'تعديل المستودع' : 'إضافة مستودع جديد'}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات المستودع
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">اسم المستودع (English) *</Label>
              <Input
                id="name"
                {...register('name', { required: 'اسم المستودع مطلوب' })}
                placeholder="Warehouse Name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Arabic Name */}
            <div className="grid gap-2">
              <Label htmlFor="nameAr">اسم المستودع (عربي)</Label>
              <Input
                id="nameAr"
                {...register('nameAr')}
                placeholder="اسم المستودع"
                dir="rtl"
              />
            </div>

            {/* Code */}
            <div className="grid gap-2">
              <Label htmlFor="code">رمز المستودع *</Label>
              <Input
                id="code"
                {...register('code', { required: 'رمز المستودع مطلوب' })}
                placeholder="WH-001"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Branch */}
            <div className="grid gap-2">
              <Label htmlFor="branchId">الفرع</Label>
              <Select
                value={watch('branchId') || "none"}
                onValueChange={(value) => setValue('branchId', value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون فرع</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.nameAr || branch.name} ({branch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="عنوان المستودع..."
                rows={2}
              />
            </div>

            {/* Is Main Toggle */}
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <Label htmlFor="isMain">المستودع الرئيسي</Label>
                <p className="text-xs text-muted-foreground">
                  المستودع الرئيسي للشركة
                </p>
              </div>
              <Switch
                id="isMain"
                checked={watch('isMain')}
                onCheckedChange={(checked) => setValue('isMain', checked)}
              />
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
              {loading ? 'جاري الحفظ...' : warehouse ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
