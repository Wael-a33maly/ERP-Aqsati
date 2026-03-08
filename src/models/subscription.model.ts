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
