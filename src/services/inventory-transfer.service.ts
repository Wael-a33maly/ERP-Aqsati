/**
 * Inventory Transfer Service
 * خدمات نقل المخزون
 */

import { inventoryTransferRepository } from '@/repositories/inventory-transfer.repository'
import type { InventoryTransferInput } from '@/models/inventory-transfer.model'

export const inventoryTransferService = {
  async getTransfers(params: any) {
    return inventoryTransferRepository.findTransfers(params)
  },

  async getTransferById(id: string) {
    const transfer = await inventoryTransferRepository.findTransferById(id)
    if (!transfer) {
      throw new Error('أمر النقل غير موجود')
    }
    return transfer
  },

  async createTransfer(data: InventoryTransferInput & { companyId: string; userId: string }) {
    // Generate transfer number
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const transferNumber = `TR-${year}-${random}`

    return inventoryTransferRepository.createTransfer({
      ...data,
      transferNumber
    })
  },

  async approveTransfer(id: string) {
    return inventoryTransferRepository.approveTransfer(id)
  },

  async cancelTransfer(id: string) {
    return inventoryTransferRepository.cancelTransfer(id)
  }
}
