// ============================================
// Inventory Service - خدمة المخزون
// ============================================

import { inventoryRepository } from '@/repositories/inventory.repository'
import { 
  InventoryQueryParams,
  CreateInventoryInput,
  AdjustInventoryInput
} from '@/models/inventory.model'

export const inventoryService = {
  // جلب المخزون
  async getInventory(params: InventoryQueryParams) {
    const { data, total, lowStockCount } = await inventoryRepository.findMany(params)
    
    return {
      data,
      lowStockCount,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total,
        totalPages: Math.ceil(total / (params.limit || 10))
      }
    }
  },

  // جلب سجل مخزون بالمعرف
  async getInventoryById(id: string) {
    return inventoryRepository.findById(id)
  },

  // إنشاء سجل مخزون
  async createInventory(data: CreateInventoryInput) {
    // التحقق من عدم وجود سجل مسبق
    const existing = await inventoryRepository.findByProductAndWarehouse(
      data.productId,
      data.warehouseId
    )

    if (existing) {
      // تحديث السجل الموجود
      return inventoryRepository.update(existing.id, {
        quantity: existing.quantity + data.quantity
      })
    }

    return inventoryRepository.create(data)
  },

  // تعديل المخزون
  async adjustInventory(data: AdjustInventoryInput) {
    // جلب السجل الحالي
    let inventory = await inventoryRepository.findByProductAndWarehouse(
      data.productId,
      data.warehouseId
    )

    if (!inventory) {
      // إنشاء سجل جديد
      inventory = await inventoryRepository.create({
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: data.type === 'subtract' ? -data.quantity : data.quantity,
        minQuantity: 0
      })
    } else {
      // حساب الكمية الجديدة
      let newQuantity = inventory.quantity
      switch (data.type) {
        case 'add':
          newQuantity += data.quantity
          break
        case 'subtract':
          newQuantity -= data.quantity
          break
        case 'set':
          newQuantity = data.quantity
          break
      }

      await inventoryRepository.update(inventory.id, { quantity: newQuantity })
    }

    // تسجيل الحركة
    await inventoryRepository.createMovement({
      ...data,
      warehouseId: data.warehouseId
    })

    return inventory
  },

  // جلب حركات المخزون
  async getMovements(params: any) {
    return inventoryRepository.getMovements(params)
  }
}
