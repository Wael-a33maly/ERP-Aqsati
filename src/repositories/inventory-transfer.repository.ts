/**
 * Inventory Transfer Repository
 * مستودع بيانات نقل المخزون
 */

import { db } from '@/lib/db'
import type { InventoryTransferQueryParams, InventoryTransferInput } from '@/models/inventory-transfer.model'

export const inventoryTransferRepository = {
  async findTransfers(params: InventoryTransferQueryParams) {
    const { page = 1, limit = 20, search, companyId, fromWarehouseId, toWarehouseId, status } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId
    if (toWarehouseId) where.toWarehouseId = toWarehouseId
    if (status) where.status = status

    if (search) {
      where.OR = [
        { transferNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [transfers, total] = await Promise.all([
      db.inventoryTransfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          FromWarehouse: { select: { id: true, name: true, nameAr: true } },
          To_warehouse: { select: { id: true, name: true, nameAr: true } },
          User: { select: { id: true, name: true } },
          InventoryTransferItem: {
            include: {
              Product: { select: { id: true, name: true, sku: true } }
            }
          }
        }
      }),
      db.inventoryTransfer.count({ where })
    ])

    return { data: transfers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findTransferById(id: string) {
    return db.inventoryTransfer.findUnique({
      where: { id },
      include: {
        From_warehouse: true,
        To_warehouse: true,
        User: true,
        InventoryTransferItem: {
          include: {
            Product: true
          }
        }
      }
    })
  },

  async createTransfer(data: InventoryTransferInput & { transferNumber: string; userId: string }) {
    return db.$transaction(async (tx) => {
      // Create transfer
      const transfer = await tx.inventoryTransfer.create({
        data: {
          transferNumber: data.transferNumber,
          companyId: data.companyId,
          branchId: data.branchId,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          transferDate: new Date(data.transferDate),
          notes: data.notes,
          status: 'pending',
          createdById: data.userId
        }
      })

      // Create items
      for (const item of data.items) {
        await tx.inventoryTransferItem.create({
          data: {
            transferId: transfer.id,
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes
          }
        })
      }

      return transfer
    })
  },

  async approveTransfer(id: string) {
    const transfer = await this.findTransferById(id)
    if (!transfer) throw new Error('أمر النقل غير موجود')
    if (transfer.status !== 'pending') throw new Error('لا يمكن الموافقة على هذا الأمر')

    return db.$transaction(async (tx) => {
      // Update transfer status
      const updated = await tx.inventoryTransfer.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() }
      })

      // Update inventory
      for (const item of transfer.InventoryTransferItem) {
        // Decrease from source warehouse
        await tx.inventory.updateMany({
          where: { productId: item.productId, warehouseId: transfer.fromWarehouseId },
          data: { quantity: { decrement: item.quantity } }
        })

        // Increase in destination warehouse
        const destInventory = await tx.inventory.findFirst({
          where: { productId: item.productId, warehouseId: transfer.toWarehouseId }
        })

        if (destInventory) {
          await tx.inventory.update({
            where: { id: destInventory.id },
            data: { quantity: { increment: item.quantity } }
          })
        } else {
          await tx.inventory.create({
            data: {
              productId: item.productId,
              warehouseId: transfer.toWarehouseId,
              quantity: item.quantity,
              minQuantity: 0,
              maxQuantity: 0,
              totalCost: 0
            }
          })
        }

        // Create inventory movements
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'TRANSFER',
            quantity: item.quantity,
            reference: transfer.transferNumber,
            referenceType: 'INVENTORY_TRANSFER',
            referenceId: transfer.id,
            notes: `نقل من ${transfer.From_warehouse?.name} إلى ${transfer.To_warehouse?.name}`
          }
        })
      }

      return updated
    })
  },

  async cancelTransfer(id: string) {
    return db.inventoryTransfer.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() }
    })
  }
}
