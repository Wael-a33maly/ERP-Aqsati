// ============================================
// Supplier Model - نموذج الموردين
// ============================================

export interface Supplier {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  code: string
  phone: string | null
  phone2: string | null
  email: string | null
  address: string | null
  taxNumber: string | null
  balance: number
  creditLimit: number
  paymentTerms: number
  notes: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Query Parameters
export interface SupplierQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  active?: boolean
}

// Input Types
export interface CreateSupplierInput {
  companyId: string
  name: string
  code: string
  nameAr?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  taxNumber?: string
  creditLimit?: number
  paymentTerms?: number
  notes?: string
}

export interface UpdateSupplierInput {
  id: string
  name?: string
  nameAr?: string
  code?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  taxNumber?: string
  creditLimit?: number
  paymentTerms?: number
  notes?: string
  active?: boolean
}

// Response Types
export interface SupplierWithDetails extends Supplier {
  Company?: {
    id: string
    name: string
  }
  _count?: {
    purchaseInvoices: number
  }
}

export interface SupplierListResponse {
  data: SupplierWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Supplier Statement
export interface SupplierStatementParams {
  supplierId: string
  startDate?: Date
  endDate?: Date
}

export interface SupplierStatementLine {
  date: Date
  referenceType: string
  referenceNumber: string
  debit: number
  credit: number
  balance: number
  notes?: string
}
