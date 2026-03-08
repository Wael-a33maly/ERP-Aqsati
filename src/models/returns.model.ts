// ============================================
// Returns Model - نموذج المرتجعات
// ============================================

export interface Return {
  id: string
  returnNumber: string
  companyId: string | null
  branchId: string | null
  customerId: string | null
  invoiceId: string | null
  agentId: string | null
  type: ReturnType
  reason: string | null
  total: number
  status: ReturnStatus
  createdAt: Date
  updatedAt: Date
}

export type ReturnType = 'FULL' | 'PARTIAL' | 'EXCHANGE'
export type ReturnStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'

// Query Parameters
export interface ReturnQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: ReturnStatus
  type?: ReturnType
  customerId?: string
  invoiceId?: string
  companyId?: string
  branchId?: string
  startDate?: Date
  endDate?: Date
}

// Input Types
export interface CreateReturnInput {
  customerId: string
  branchId?: string
  invoiceId?: string
  agentId?: string
  type?: ReturnType
  reason?: string
  total?: number
  items?: CreateReturnItemInput[]
}

export interface CreateReturnItemInput {
  productId: string
  quantity: number
  unitPrice: number
  discount?: number
  taxAmount?: number
  total: number
  reason?: string
}

export interface UpdateReturnInput {
  id: string
  status?: ReturnStatus
  reason?: string
}

// Response Types
export interface ReturnWithDetails extends Return {
  customer?: {
    id: string
    name: string
    phone: string
  }
  branch?: {
    id: string
    name: string
  }
  invoice?: {
    id: string
    invoiceNumber: string
  }
  items?: ReturnItem[]
}

export interface ReturnItem {
  id: string
  returnId: string
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  taxAmount: number
  total: number
  reason: string | null
  product?: {
    id: string
    name: string
    sku: string
  }
}

export interface ReturnListResponse {
  data: ReturnWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
