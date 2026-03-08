// ============================================
// Sync Model - نموذج المزامنة
// ============================================

export type SyncOperationType = 
  | 'create_customer'
  | 'update_customer'
  | 'create_invoice'
  | 'create_payment'
  | 'collect_installment'
  | 'update_inventory'

export interface SyncOperation {
  id: string
  agentId: string | null
  action: string
  entityType: string
  entityId: string | null
  data: string
  status: SyncStatus
  error: string | null
  retries: number
  createdAt: Date
  syncedAt: Date | null
}

export type SyncStatus = 'pending' | 'synced' | 'failed'

// Input Types
export interface SyncRequest {
  operationType: SyncOperationType
  data: SyncData
  operationId?: string
}

export interface SyncData {
  id?: string
  companyId: string
  branchId?: string
  customerId?: string
  agentId?: string
  invoiceId?: string
  installmentId?: string
  productId?: string
  warehouseId?: string
  [key: string]: any
}

// Response Types
export interface SyncResponse {
  success: boolean
  operationId?: string
  result?: SyncResult
  syncedAt?: string
  error?: string
  conflict?: boolean
}

export interface SyncResult {
  customerId?: string
  invoiceId?: string
  paymentId?: string
  installmentId?: string
  duplicate?: boolean
  success?: boolean
}

export interface SyncStatusResponse {
  success: boolean
  pendingCount: number
  pendingOperations: Array<{
    id: string
    action: string
    entityType: string
    createdAt: Date
  }>
}

// Sync Data Interfaces
export interface SyncCustomerData extends SyncData {
  code: string
  name: string
  nameAr?: string
  phone?: string
  phone2?: string
  address?: string
  nationalId?: string
  creditLimit?: number
  balance?: number
  notes?: string
}

export interface SyncInvoiceData extends SyncData {
  invoiceNumber: string
  invoiceDate: string
  type?: string
  status?: string
  subtotal: number
  discount?: number
  taxRate?: number
  taxAmount?: number
  total: number
  paidAmount?: number
  remainingAmount?: number
  notes?: string
  items?: SyncInvoiceItem[]
}

export interface SyncInvoiceItem {
  id?: string
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

export interface SyncPaymentData extends SyncData {
  paymentNumber: string
  paymentDate: string
  method?: string
  amount: number
  reference?: string
  notes?: string
}

export interface SyncInstallmentData extends SyncData {
  amount: number
  method?: string
  reference?: string
  notes?: string
  remainingAmount: number
}

export interface SyncInventoryData extends SyncData {
  quantity: number
  minQuantity?: number
  maxQuantity?: number
  quantityChange?: number
  movementType?: string
  syncId?: string
  notes?: string
}
