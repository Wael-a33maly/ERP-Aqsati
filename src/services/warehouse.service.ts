// ============================================
// Warehouse Service - خدمة المخازن
// ============================================

import { warehouseRepository } from '@/repositories/warehouse.repository'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { 
  WarehouseQueryParams,
  CreateWarehouseInput,
  UpdateWarehouseInput
} from '@/models/warehouse.model'

export const warehouseService = {
  // جلب جميع المخازن
  async getWarehouses(params: WarehouseQueryParams) {
    return warehouseRepository.findMany(params)
  },

  // جلب مخزن بالمعرف
  async getWarehouse(id: string) {
    return warehouseRepository.findById(id)
  },

  // إنشاء مخزن
  async createWarehouse(data: CreateWarehouseInput) {
    // التحقق من عدم تكرار الكود
    const existing = await warehouseRepository.findByCode(data.companyId, data.code)
    if (existing) {
      throw new Error('كود المخزن موجود مسبقاً')
    }

    // إذا كان المخزن الرئيسي، إلغاء تعيين المخازن الرئيسية الأخرى
    if (data.isMain) {
      await warehouseRepository.unsetOtherMainWarehouses(data.companyId)
    }

    const warehouse = await warehouseRepository.create(data)

    // تسجيل في سجل التدقيق
    await auditLogRepository.createSimple({
      action: 'CREATE',
      entityType: 'Warehouse',
      entityId: warehouse.id,
      userId: data.userId,
      companyId: data.companyId,
      branchId: data.branchId,
      newData: warehouse
    })

    return warehouse
  },

  // تحديث مخزن
  async updateWarehouse(data: UpdateWarehouseInput) {
    // التحقق من وجود المخزن
    const existing = await warehouseRepository.findById(data.id)
    if (!existing) {
      throw new Error('المخزن غير موجود')
    }

    // التحقق من عدم تكرار الكود
    if (data.code && data.code !== existing.code) {
      const duplicate = await warehouseRepository.findByCode(data.companyId, data.code, data.id)
      if (duplicate) {
        throw new Error('كود المخزن موجود مسبقاً')
      }
    }

    // إذا كان المخزن الرئيسي، إلغاء تعيين المخازن الرئيسية الأخرى
    if (data.isMain && !existing.isMain) {
      await warehouseRepository.unsetOtherMainWarehouses(data.companyId, data.id)
    }

    const warehouse = await warehouseRepository.update(data)

    // تسجيل في سجل التدقيق
    await auditLogRepository.createSimple({
      action: 'UPDATE',
      entityType: 'Warehouse',
      entityId: warehouse.id,
      userId: data.userId,
      companyId: data.companyId,
      branchId: data.branchId,
      oldData: existing,
      newData: warehouse
    })

    return warehouse
  },

  // حذف مخزن
  async deleteWarehouse(id: string, companyId: string, userId?: string) {
    // التحقق من وجود المخزن
    const existing = await warehouseRepository.findById(id)
    if (!existing) {
      throw new Error('المخزن غير موجود')
    }

    // التحقق من عدم وجود مخزون
    const hasInventory = await warehouseRepository.hasInventory(id)
    if (hasInventory) {
      throw new Error('لا يمكن حذف مخزن يحتوي على مخزون')
    }

    // حذف المخزن (soft delete)
    const warehouse = await warehouseRepository.softDelete(id)

    // تسجيل في سجل التدقيق
    await auditLogRepository.createSimple({
      action: 'DELETE',
      entityType: 'Warehouse',
      entityId: warehouse.id,
      userId,
      companyId,
      branchId: existing.branchId || undefined,
      oldData: existing
    })

    return warehouse
  }
}
