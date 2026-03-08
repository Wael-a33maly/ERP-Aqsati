/**
 * Supplier Model
 * نموذج الموردين
 */

import { Supplier, SupplierTransaction } from '@prisma/client'

// ============ Types ============

export type BalanceType = 'CREDIT' | 'DEBIT'
export type TransactionType = 'OPENING' | 'INVOICE' | 'RETURN' | 'PAYMENT' | 'ADJUSTMENT'

// ============ Input Types ============

export interface CreateSupplierInput {
  companyId: string
  name: string
  nameAr?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  city?: string
  taxNumber?: string
  commercialReg?: string
  creditLimit?: number
  openingBalance?: number
  balanceType?: BalanceType
  paymentTerms?: number
  currency?: string
  notes?: string
  active?: boolean
  hasOpeningBalance?: boolean
}

export interface UpdateSupplierInput {
  id: string
  name?: string
  nameAr?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  city?: string
  taxNumber?: string
  commercialReg?: string
  creditLimit?: number
  paymentTerms?: number
  currency?: string
  notes?: string
  active?: boolean
}

// ============ Query Params ============

export interface SupplierQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId: string
  active?: boolean
}

// ============ Response Types ============

export interface SupplierWithStats extends Supplier {
  _count: {
    PurchaseInvoice: number
    PurchaseReturn: number
    SupplierPayment: number
  }
}

export interface SupplierWithTransactions extends Supplier {
  transactions: SupplierTransaction[]
  totalDebit: number
  totalCredit: number
  currentBalance: number
}

// ============ Export Types ============
export type { Supplier, SupplierTransaction }
