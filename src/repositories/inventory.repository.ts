// ============================================
// Inventory Repository - مستودع المخزون
// ============================================

import { db } from '@/lib/db'
import { 
  InventoryQueryParams,
  CreateInventoryInput,
  UpdateInventoryInput,
  AdjustInventoryInput,
  InventoryWithDetails,
  InventoryMovementQueryParams
} from '@/models/inventory.model'

export const inventoryRepository = {
  // جلب المخزون
  async findMany(params: InventoryQueryParams): Promise<{ data: InventoryWithDetails[]; total: number; lowStockCount: number }> {
    const skip = ((params.page || 1) - 1) * (params.limit || 10)
    const where: any = {}

    if (params.search) {
      where.product = {
        OR: [
          { name: { contains: params.search } },
          { sku: { contains: params.search } }
        ]
      }
    }
    if (params.warehouseId) where.warehouseId = params.warehouseId
    if (params.productId) where.productId = params.productId

    const [inventory, total, lowStockCount] = await Promise.all([
      db.inventory.findMany({
        where,
        skip,
        take: params.limit || 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, unit: true, sellPrice: true, costPrice: true }
          },
          warehouse: {
            select: { id: true, name: true }
          }
        }
      }),
      db.inventory.count({ where }),
      db.inventory.count({
        where: {
          quantity: { lte: db.inventory.fields.minQuantity }
        }
      })
    ])

    return { data: inventory as InventoryWithDetails[], total, lowStockCount }
  },

  // جلب مخزون بالمعرف
  async findById(id: string) {
    return db.inventory.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true
      }
    })
  },

  // جلب مخزون بالمنتج والمخزن
  async findByProductAndWarehouse(productId: string, warehouseId: string) {
    return db.inventory.findUnique({
      where: {
        productId_warehouseId: { productId, warehouseId }
      }
    })
  },

  // إنشاء سجل مخزون
  async create(data: CreateInventoryInput) {
    return db.inventory.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        minQuantity: data.minQuantity || 0,
        maxQuantity: data.maxQuantity || null
      }
    })
  },

  // تحديث سجل مخزون
  async update(id: string, data: UpdateInventoryInput) {
    return db.inventory.update({
      where: { id },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.minQuantity !== undefined && { minQuantity: data.minQuantity }),
        ...(data.maxQuantity !== undefined && { maxQuantity: data.maxQuantity }),
        updatedAt: new Date()
      }
    })
  },

  // تعديل الكمية
  async adjustQuantity(id: string, adjustment: number) {
    return db.inventory.update({
      where: { id },
      data: {
        quantity: { increment: adjustment },
        updatedAt: new Date()
      }
    })
  },

  // Upsert مخزون
  async upsert(productId: string, warehouseId: string, data: { quantity: number; minQuantity?: number }) {
    return db.inventory.upsert({
      where: {
        productId_warehouseId: { productId, warehouseId }
      },
      update: {
        quantity: data.quantity,
        updatedAt: new Date()
      },
      create: {
        productId,
        warehouseId,
        quantity: data.quantity,
        minQuantity: data.minQuantity || 0
      }
    })
  },

  // تسجيل حركة مخزون
  async createMovement(data: AdjustInventoryInput & { warehouseId: string }) {
    return db.inventoryMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        type: data.type as any,
        quantity: data.quantity,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
        notes: data.notes || null,
        createdBy: data.userId || null
      }
    })
  },

  // جلب حركات المخزون
  async getMovements(params: InventoryMovementQueryParams) {
    const skip = ((params.page || 1) - 1) * (params.limit || 20)
    const where: any = {}

    if (params.productId) where.productId = params.productId
    if (params.warehouseId) where.warehouseId = params.warehouseId
    if (params.type) where.type = params.type

    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = params.startDate
      if (params.endDate) where.createdAt.lte = params.endDate
    }

    const [movements, total] = await Promise.all([
      db.inventoryMovement.findMany({
        where,
        skip,
        take: params.limit || 20,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } }
        }
      }),
      db.inventoryMovement.count({ where })
    ])

    return { data: movements, total }
  }
}
