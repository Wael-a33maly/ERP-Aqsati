// ============================================
// Installment Model - نموذج الأقساط
// ============================================

export interface InstallmentContract {
  id: string
  invoiceId: string
  customerId: string
  agentId: string | null
  contractNumber: string
  contractDate: Date
  totalAmount: number
  downPayment: number
  financedAmount: number
  numberOfPayments: number
  paymentFrequency: PaymentFrequency
  interestRate: number
  interestAmount: number
  startDate: Date
  endDate: Date
  status: ContractStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Installment {
  id: string
  contractId: string
  installmentNumber: number
  dueDate: Date
  amount: number
  paidAmount: number
  remainingAmount: number
  lateFee: number
  status: InstallmentStatus
  paidDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type PaymentFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'
export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'defaulted'
export type InstallmentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'

// Query Parameters
export interface InstallmentQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: InstallmentStatus | ContractStatus
  customerId?: string
  agentId?: string
  companyId?: string
  branchId?: string
  dueFromDate?: Date
  dueToDate?: Date
}

// Input Types
export interface CreateInstallmentContractInput {
  invoiceId: string
  customerId: string
  agentId?: string
  downPayment: number
  numberOfPayments: number
  paymentFrequency: PaymentFrequency
  interestRate?: number
  startDate: Date
  notes?: string
}

export interface CollectInstallmentInput {
  installmentId: string
  amount: number
  method?: string
  reference?: string
  notes?: string
  agentId?: string
}

export interface InstallmentPaymentInput {
  installmentId: string
  amount: number
  method?: string
  reference?: string
  notes?: string
}

// Response Types
export interface InstallmentContractWithDetails extends InstallmentContract {
  invoice?: {
    id: string
    invoiceNumber: string
    total: number
    company?: { id: string; name: string }
    branch?: { id: string; name: string }
  }
  customer?: {
    id: string
    name: string
    phone: string
  }
  agent?: {
    id: string
    name: string
  }
  installments?: Installment[]
}

export interface InstallmentWithDetails extends Installment {
  InstallmentContract?: {
    id: string
    contractNumber: string
    customerId: string
    Customer?: { name: string }
  }
  payments?: InstallmentPayment[]
}

export interface InstallmentPayment {
  id: string
  installmentId: string
  agentId: string | null
  paymentDate: Date
  amount: number
  method: string
  reference: string | null
  notes: string | null
}

export interface InstallmentListResponse {
  data: InstallmentWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
