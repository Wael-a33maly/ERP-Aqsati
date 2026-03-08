/**
 * Payment Link Model
 * نماذج روابط الدفع
 */

export interface PaymentLinkQueryParams {
  page?: number
  limit?: number
  companyId?: string
  status?: 'active' | 'paid' | 'expired' | 'cancelled'
}

export interface PaymentLinkInput {
  companyId: string
  amount: number
  currency?: string
  description: string
  customerId?: string
  invoiceId?: string
  expiresInDays?: number
  maxUses?: number
  metadata?: any
}

export interface PaymentLinkVerifyInput {
  linkId: string
  paymentMethod: string
  transactionId?: string
}
