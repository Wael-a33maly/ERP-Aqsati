// ============================================
// Inventory Model - نموذج المخزون
// ============================================

export interface Inventory {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  minQuantity: number
  maxQuantity: number | null
  updatedAt: Date
}

// Query Parameters
export interface InventoryQueryParams {
  page?: number
  limit?: number
  search?: string
  warehouseId?: string
  productId?: string
  lowStock?: boolean
}

// Input Types
export interface CreateInventoryInput {
  productId: string
  warehouseId: string
  quantity: number
  minQuantity?: number
  maxQuantity?: number
}

export interface UpdateInventoryInput {
  id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
}

export interface AdjustInventoryInput {
  productId: string
  warehouseId: string
  quantity: number
  type: 'add' | 'subtract' | 'set'
  referenceType?: string
  referenceId?: string
  notes?: string
  userId?: string
}

// Response Types
export interface InventoryWithDetails extends Inventory {
  product?: {
    id: string
    name: string
    sku: string
    unit: string
    sellPrice: number
    costPrice: number
  }
  warehouse?: {
    id: string
    name: string
  }
}

export interface InventoryListResponse {
  data: InventoryWithDetails[]
  lowStockCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Inventory Movement
export interface InventoryMovement {
  id: string
  productId: string
  warehouseId: string
  type: MovementType
  quantity: number
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  createdBy: string | null
  createdAt: Date
}

export type MovementType = 
  | 'purchase'
  | 'sale'
  | 'return'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment'
  | 'initial'

export interface InventoryMovementQueryParams {
  page?: number
  limit?: number
  productId?: string
  warehouseId?: string
  type?: MovementType
  startDate?: Date
  endDate?: Date
}
