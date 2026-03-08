// ============================================
// Warehouse Repository - مستودع المخازن
// ============================================

import { db } from '@/lib/db'
import { 
  WarehouseQueryParams,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseWithStats
} from '@/models/warehouse.model'

export const warehouseRepository = {
  // جلب جميع المخازن
  async findMany(params: WarehouseQueryParams): Promise<WarehouseWithStats[]> {
    const where: any = {}
    
    if (params.companyId) where.companyId = params.companyId
    if (params.activeOnly !== false) where.active = true
    if (params.branchId) where.branchId = params.branchId
    if (params.mainOnly) where.isMain = true

    const warehouses = await db.warehouse.findMany({
      where,
      take: params.limit || 100,
      include: {
        company: {
          select: { id: true, name: true, code: true }
        },
        branch: {
          select: { id: true, name: true, nameAr: true, code: true }
        },
        ...(params.includeInventory && {
          inventory: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, unit: true, costPrice: true }
              }
            }
          }
        }),
        _count: {
          select: {
            inventory: true,
            movements: true
          }
        }
      },
      orderBy: [
        { isMain: 'desc' },
        { name: 'asc' }
      ]
    })

    // حساب إحصائيات المخزون
    return warehouses.map(warehouse => {
      if (params.includeInventory && (warehouse as any).inventory) {
        const inventory = (warehouse as any).inventory
        const totalItems = inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0)
        const totalValue = inventory.reduce(
          (sum: number, inv: any) => sum + (inv.quantity * (inv.product?.costPrice || 0)),
          0
        )
        return { ...warehouse, totalItems, totalValue } as WarehouseWithStats
      }
      return warehouse as WarehouseWithStats
    })
  },

  // جلب مخزن بالمعرف
  async findById(id: string) {
    return db.warehouse.findUnique({
      where: { id },
      include: {
        company: true,
        branch: true,
      }
    })
  },

  // التحقق من وجود الكود
  async findByCode(companyId: string, code: string, excludeId?: string) {
    return db.warehouse.findFirst({
      where: {
        companyId,
        code,
        ...(excludeId && { id: { not: excludeId } })
      }
    })
  },

  // إنشاء مخزن
  async create(data: CreateWarehouseInput) {
    return db.warehouse.create({
      data: {
        companyId: data.companyId,
        branchId: data.branchId || null,
        name: data.name,
        nameAr: data.nameAr || null,
        code: data.code,
        address: data.address || null,
        isMain: data.isMain || false,
        active: true
      },
      include: {
        branch: true
      }
    })
  },

  // تحديث مخزن
  async update(data: UpdateWarehouseInput) {
    const updateData: any = {}
    if (data.branchId !== undefined) updateData.branchId = data.branchId || null
    if (data.name !== undefined) updateData.name = data.name
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr
    if (data.code !== undefined) updateData.code = data.code
    if (data.address !== undefined) updateData.address = data.address
    if (data.isMain !== undefined) updateData.isMain = data.isMain
    if (data.active !== undefined) updateData.active = data.active

    return db.warehouse.update({
      where: { id: data.id },
      data: updateData,
      include: {
        branch: true
      }
    })
  },

  // إلغاء تعيين المخازن الرئيسية الأخرى
  async unsetOtherMainWarehouses(companyId: string, excludeId?: string) {
    return db.warehouse.updateMany({
      where: {
        companyId,
        isMain: true,
        ...(excludeId && { id: { not: excludeId } })
      },
      data: { isMain: false }
    })
  },

  // حذف مخزن (soft delete)
  async softDelete(id: string) {
    return db.warehouse.update({
      where: { id },
      data: { active: false }
    })
  },

  // التحقق من وجود مخزون
  async hasInventory(id: string) {
    const inventory = await db.inventory.findFirst({
      where: {
        warehouseId: id,
        quantity: { gt: 0 }
      }
    })
    return !!inventory
  }
}
