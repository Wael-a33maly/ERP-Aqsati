/**
 * Egyptian Payment Model
 * نموذج بوابات الدفع المصرية
 */

import { PaymentMethod } from '@/lib/egyptian-payments'

// ============ Types ============

export interface EgyptianPaymentInput {
  method: PaymentMethod
  amount: number
  customerId: string
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  description?: string
  invoiceId?: string
  installmentId?: string
  companyId?: string
  branchId?: string
  userId?: string
}

export interface EgyptianPaymentStatusInput {
  method: PaymentMethod
  reference: string
  companyId?: string
}

export interface EgyptianRefundInput {
  method: PaymentMethod
  referenceNumber: string
  amount: number
  reason?: string
  companyId?: string
}

export interface PaymentRequest {
  amount: number
  currency: string
  customerId: string
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  description?: string
  referenceId?: string
}

export interface PaymentResult {
  success: boolean
  referenceNumber?: string
  paymentUrl?: string
  status?: string
  data?: any
  error?: string
}
