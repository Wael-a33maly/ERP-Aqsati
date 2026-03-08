// ============================================
// Branch Model - نموذج الفروع
// ============================================

export interface Branch {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  code: string
  address: string | null
  phone: string | null
  isMain: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Query Parameters
export interface BranchQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  active?: boolean
}

// Input Types
export interface CreateBranchInput {
  companyId: string
  name: string
  code: string
  address?: string
  phone?: string
  isMain?: boolean
}

export interface UpdateBranchInput {
  id: string
  name?: string
  nameAr?: string
  code?: string
  address?: string
  phone?: string
  isMain?: boolean
  active?: boolean
}

// Response Types
export interface BranchWithDetails extends Branch {
  Company?: {
    id: string
    name: string
    code: string
  }
  _count?: {
    User: number
    Customer: number
  }
}

export interface BranchListResponse {
  data: BranchWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
