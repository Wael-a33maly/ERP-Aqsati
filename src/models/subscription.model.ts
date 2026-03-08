/**
 * Subscription Model
 * نماذج الاشتراكات
 */

export interface SubscriptionQueryParams {
  page?: number
  limit?: number
  status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  planId?: string
}

export interface SubscriptionInput {
  companyId: string
  planId: string
  billingCycle: 'monthly' | 'yearly'
  originalPrice: number
  discountPercent?: number
  finalPrice: number
  currency?: string
  startDate: Date | string
  endDate: Date | string
  trialEnd?: Date | string
}

export interface SubscriptionPlanInput {
  name: string
  nameAr?: string
  code: string
  description?: string
  descriptionAr?: string
  price: number
  currency?: string
  billingCycle: 'monthly' | 'yearly'
  trialDays?: number
  features?: any
  limits?: any
  isPopular?: boolean
  isDefault?: boolean
  active?: boolean
}

export interface SubscriptionPaymentInput {
  subscriptionId: string
  companyId: string
  amount: number
  currency?: string
  paymentMethod: string
  transactionId?: string
  referenceNumber?: string
}

// طرق الدفع المتاحة
export const PAYMENT_METHODS = [
  { code: 'FAWRY', name: 'فوري', nameEn: 'Fawry', icon: 'fawry' },
  { code: 'INSTAPAY', name: 'انستا باي', nameEn: 'InstaPay', icon: 'instapay' },
  { code: 'VODAFONE_CASH', name: 'فودافون كاش', nameEn: 'Vodafone Cash', icon: 'vodafone' },
  { code: 'ORANGE_MONEY', name: 'أورنج موني', nameEn: 'Orange Money', icon: 'orange' },
  { code: 'ETISALAT_CASH', name: 'اتصالات كاش', nameEn: 'Etisalat Cash', icon: 'etisalat' },
  { code: 'BANK_TRANSFER', name: 'تحويل بنكي', nameEn: 'Bank Transfer', icon: 'bank' },
  { code: 'CASH', name: 'نقدي', nameEn: 'Cash', icon: 'cash' }
] as const

export interface PaymentTransactionQueryParams {
  companyId?: string
  subscriptionId?: string
}

export interface CreatePaymentTransactionInput {
  subscriptionId: string
  companyId?: string
  amount?: number
  paymentMethod: string
  currency?: string
}

export interface UpdatePaymentTransactionInput {
  id: string
  action?: 'confirm' | 'reject' | 'refund'
  transactionId?: string
  notes?: string
}
