/**
 * Inventory Transfer Model
 * نماذج نقل المخزون
 */

export interface InventoryTransferQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  fromWarehouseId?: string
  toWarehouseId?: string
  status?: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  dateFrom?: string
  dateTo?: string
}

export interface InventoryTransferInput {
  companyId: string
  branchId?: string
  fromWarehouseId: string
  toWarehouseId: string
  transferDate: Date | string
  notes?: string
  items: TransferItemInput[]
}

export interface TransferItemInput {
  productId: string
  quantity: number
  notes?: string
}
