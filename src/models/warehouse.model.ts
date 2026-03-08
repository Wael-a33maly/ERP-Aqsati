// ============================================
// Warehouse Model - نموذج المخازن
// ============================================

export interface Warehouse {
  id: string
  companyId: string
  branchId: string | null
  name: string
  nameAr: string | null
  code: string
  address: string | null
  isMain: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Query Parameters
export interface WarehouseQueryParams {
  companyId?: string
  branchId?: string
  activeOnly?: boolean
  includeInventory?: boolean
  mainOnly?: boolean
  limit?: number
}

// Input Types
export interface CreateWarehouseInput {
  companyId: string
  branchId?: string
  name: string
  nameAr?: string
  code: string
  address?: string
  isMain?: boolean
  userId?: string
}

export interface UpdateWarehouseInput {
  id: string
  companyId: string
  branchId?: string
  name?: string
  nameAr?: string
  code?: string
  address?: string
  isMain?: boolean
  active?: boolean
  userId?: string
}

// Response Types
export interface WarehouseWithStats extends Warehouse {
  company?: { id: string; name: string; code: string }
  branch?: { id: string; name: string; nameAr: string; code: string }
  totalItems?: number
  totalValue?: number
  _count?: {
    inventory: number
    movements: number
  }
}
