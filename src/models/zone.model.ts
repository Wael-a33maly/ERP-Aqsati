// ============================================
// Zone Model - نموذج المناطق
// ============================================

export interface Zone {
  id: string
  companyId: string
  branchId: string | null
  name: string
  code: string
  description: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Query Parameters
export interface ZoneQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  branchId?: string
  active?: boolean
}

// Input Types
export interface CreateZoneInput {
  name: string
  code: string
  description?: string
  companyId: string
  branchId?: string
}

export interface UpdateZoneInput {
  id: string
  name?: string
  code?: string
  description?: string
  active?: boolean
}

// Response Types
export interface ZoneWithDetails extends Zone {
  Company?: {
    id: string
    name: string
  }
  Branch?: {
    id: string
    name: string
  }
  _count?: {
    Customer: number
  }
}
