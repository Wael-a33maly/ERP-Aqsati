// ============================================
// Purchase Model - نموذج المشتريات
// ============================================

export interface PurchaseInvoice {
  id: string
  companyId: string
  branchId: string | null
  supplierId: string | null
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date | null
  type: PurchaseType
  status: PurchaseStatus
  subtotal: number
  discount: number
  taxRate: number
  taxAmount: number
  total: number
  paidAmount: number
  remainingAmount: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseInvoiceItem {
  id: string
  invoiceId: string
  productId: string
  description: string | null
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string | null
}

export type PurchaseType = 'cash' | 'credit'
export type PurchaseStatus = 'pending' | 'partial' | 'paid' | 'cancelled'

// Purchase Return
export interface PurchaseReturn {
  id: string
  companyId: string
  branchId: string | null
  supplierId: string | null
  purchaseInvoiceId: string | null
  returnNumber: string
  returnDate: Date
  type: ReturnReason
  total: number
  status: PurchaseReturnStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type ReturnReason = 'defective' | 'wrong_item' | 'quality' | 'other'
export type PurchaseReturnStatus = 'pending' | 'approved' | 'completed' | 'cancelled'

// Query Parameters
export interface PurchaseInvoiceQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: PurchaseStatus
  supplierId?: string
  companyId?: string
  branchId?: string
  startDate?: Date
  endDate?: Date
}

export interface PurchaseReturnQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: PurchaseReturnStatus
  supplierId?: string
  companyId?: string
}

// Input Types
export interface CreatePurchaseInvoiceInput {
  companyId: string
  branchId?: string
  supplierId?: string
  invoiceDate: Date
  dueDate?: Date
  type?: PurchaseType
  subtotal: number
  discount?: number
  taxRate?: number
  taxAmount?: number
  total: number
  notes?: string
  items: CreatePurchaseInvoiceItemInput[]
}

export interface CreatePurchaseInvoiceItemInput {
  productId: string
  description?: string
  quantity: number
  unitPrice: number
  discount?: number
  taxRate?: number
  taxAmount?: number
  total: number
  notes?: string
}

export interface CreatePurchaseReturnInput {
  companyId: string
  branchId?: string
  supplierId?: string
  purchaseInvoiceId?: string
  returnDate: Date
  type?: ReturnReason
  total: number
  notes?: string
}

// Response Types
export interface PurchaseInvoiceWithDetails extends PurchaseInvoice {
  supplier?: {
    id: string
    name: string
    phone: string
  }
  branch?: {
    id: string
    name: string
  }
  items?: PurchaseInvoiceItem[]
}

export interface PurchaseReturnWithDetails extends PurchaseReturn {
  supplier?: {
    id: string
    name: string
  }
  purchaseInvoice?: {
    id: string
    invoiceNumber: string
  }
}

export interface PurchaseInvoiceListResponse {
  data: PurchaseInvoiceWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
