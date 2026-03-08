// ============================================
// Payment Model - نموذج المدفوعات
// ============================================

export interface Payment {
  id: string
  paymentNumber: string
  companyId: string | null
  branchId: string | null
  customerId: string | null
  invoiceId: string | null
  agentId: string | null
  paymentDate: Date
  method: PaymentMethod
  amount: number
  reference: string | null
  notes: string | null
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_WALLET' | 'OTHER'
export type PaymentStatus = 'pending' | 'completed' | 'cancelled' | 'refunded'

// Query Parameters
export interface PaymentQueryParams {
  page?: number
  limit?: number
  search?: string
  method?: PaymentMethod
  status?: PaymentStatus
  customerId?: string
  invoiceId?: string
  companyId?: string
  branchId?: string
  startDate?: Date
  endDate?: Date
}

// Input Types
export interface CreatePaymentInput {
  customerId: string
  branchId?: string
  invoiceId?: string
  agentId?: string
  method?: PaymentMethod
  amount: number
  reference?: string
  notes?: string
}

export interface UpdatePaymentInput {
  id: string
  method?: PaymentMethod
  amount?: number
  reference?: string
  notes?: string
  status?: PaymentStatus
}

// Response Types
export interface PaymentWithDetails extends Payment {
  Customer?: {
    id: string
    name: string
    phone: string
    companyId: string
  }
  Branch?: {
    id: string
    name: string
  }
  User?: {
    id: string
    name: string
  }
  Invoice?: {
    id: string
    invoiceNumber: string
    total: number
  }
}

export interface PaymentListResponse {
  data: PaymentWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
