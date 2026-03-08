// ============================================
// Company Model - نموذج الشركات
// ============================================

export interface Company {
  id: string
  name: string
  nameAr: string | null
  code: string
  logo: string | null
  email: string | null
  phone: string | null
  address: string | null
  taxNumber: string | null
  discountEnabled: boolean
  taxRate: number
  currency: string
  settings: string | null
  subscriptionStatus: string
  planType: string
  trialEndsAt: Date | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Query Parameters
export interface CompanyQueryParams {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  subscriptionStatus?: string
}

// Input Types
export interface CreateCompanyInput {
  name: string
  nameAr?: string
  code: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  discountEnabled?: boolean
  taxRate?: number
  currency?: string
}

export interface UpdateCompanyInput {
  id: string
  name?: string
  nameAr?: string
  code?: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  discountEnabled?: boolean
  taxRate?: number
  currency?: string
  settings?: Record<string, any>
  active?: boolean
  subscriptionStatus?: string
  planType?: string
}

// Response Types
export interface CompanyWithDetails extends Company {
  _count?: {
    User: number
    Customer: number
    Product: number
    Branch: number
  }
  branches?: {
    id: string
    name: string
    code: string
  }[]
}

export interface CompanyListResponse {
  data: CompanyWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
