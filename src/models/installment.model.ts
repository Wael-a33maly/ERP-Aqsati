/**
 * Installment Model
 * نماذج الأقساط والعقود
 */

import { Installment, InstallmentContract, InstallmentPayment } from '@prisma/client'

// ============ Types ============

export type InstallmentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'defaulted'
export type PaymentFrequency = 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY'
export type PaymentMethod = 'CASH' | 'BANK' | 'CHECK' | 'MOBILE'

// ============ Input Types ============

export interface CreateContractInput {
  invoiceId: string
  customerId: string
  agentId?: string
  contractDate?: string
  downPayment: number
  numberOfPayments: number
  paymentFrequency: PaymentFrequency
  interestRate?: number
  startDate: string
  notes?: string
}

export interface UpdateContractInput {
  id: string
  agentId?: string
  startDate?: string
  notes?: string
  status?: ContractStatus
}

export interface CollectPaymentInput {
  installmentId: string
  amount: number
  method: PaymentMethod
  notes?: string
  paymentDate?: string
}

export interface CreateInstallmentPaymentInput {
  agentId?: string
  paymentDate?: string
  amount: number
  method: PaymentMethod
  reference?: string
  notes?: string
  includeLateFee?: boolean
}

// ============ Query Params ============

export interface InstallmentQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  companyId?: string
  customerId?: string
  agentId?: string
  dateFrom?: string
  dateTo?: string
  paymentFrequency?: string
}

export interface ContractQueryParams extends InstallmentQueryParams {
  contractStatus?: ContractStatus
}

export interface InstallmentPaymentQueryParams {
  installmentId: string
}

// ============ Response Types ============

export interface InstallmentWithRelations extends Installment {
  contract: InstallmentContract & {
    customer: {
      id: string
      code: string | null
      name: string
      nameAr: string | null
      phone: string | null
      phone2: string | null
      balance: number
    }
    agent: {
      id: string
      name: string
      nameAr: string | null
    } | null
    invoice: {
      id: string
      invoiceNumber: string
      total: number
      companyId: string
      branchId: string | null
    }
  }
  payments: InstallmentPayment[]
}

export interface ContractWithRelations extends InstallmentContract {
  Invoice: {
    id: string
    invoiceNumber: string
    invoiceDate: Date
    total: number
    companyId: string
    branchId: string | null
    Branch: {
      id: string
      name: string
      code: string | null
    } | null
  } | null
  Customer: {
    id: string
    code: string | null
    name: string
    nameAr: string | null
    phone: string | null
    phone2: string | null
    balance: number
  } | null
  User: {
    id: string
    name: string
    nameAr: string | null
    email: string
    phone: string | null
  } | null
  Installment: Array<{
    id: string
    installmentNumber: number
    dueDate: Date
    amount: number
    paidAmount: number
    remainingAmount: number
    status: string
    lateFee: number
  }>
}

export interface ContractStats {
  totalPaid: number
  totalRemaining: number
  paidInstallments: number
  pendingInstallments: number
  overdueInstallments: number
  progressPercentage: number
  nextDueDate: Date | null
  nextDueAmount: number
}

export interface ContractSummary {
  totalContracts: number
  totalAmount: number
  totalDownPayments: number
  totalFinanced: number
  totalInterest: number
  overdueInstallments: number
}

// ============ Export Types ============
export type { Installment, InstallmentContract, InstallmentPayment }
