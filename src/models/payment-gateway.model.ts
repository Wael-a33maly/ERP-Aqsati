/**
 * Payment Gateway Model
 * نموذج بوابات الدفع
 */

import { CompanyPaymentGateway } from '@prisma/client'
import { nanoid } from 'nanoid'

// ============ Types ============

export type GatewayType =
  | 'PAYMOB'
  | 'FAWRY'
  | 'VODAFONE_CASH'
  | 'INSTAPAY'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'CUSTOM'

export type PaperSize = 'A4' | 'A4_THIRD' | 'A5' | 'THERMAL_80' | 'CUSTOM'

// ============ Input Types ============

export interface CreatePaymentGatewayInput {
  companyId: string
  gatewayType: GatewayType
  name: string
  nameAr?: string
  merchantId?: string
  merchantSecret?: string
  apiKey?: string
  apiSecret?: string
  walletNumber?: string
  accountNumber?: string
  bankCode?: string
  callbackUrl?: string
  webhookSecret?: string
  isLive?: boolean
  isActive?: boolean
  isDefault?: boolean
  feesPercent?: number
  feesFixed?: number
  minAmount?: number
  maxAmount?: number
  settlementDays?: number
  settings?: Record<string, unknown>
}

export interface UpdatePaymentGatewayInput {
  id: string
  companyId: string
  name?: string
  nameAr?: string
  merchantId?: string
  merchantSecret?: string
  apiKey?: string
  apiSecret?: string
  walletNumber?: string
  accountNumber?: string
  bankCode?: string
  callbackUrl?: string
  webhookSecret?: string
  isLive?: boolean
  isActive?: boolean
  isDefault?: boolean
  feesPercent?: number
  feesFixed?: number
  minAmount?: number
  maxAmount?: number
  settlementDays?: number
  settings?: Record<string, unknown>
}

// ============ Query Params ============

export interface PaymentGatewayQueryParams {
  companyId: string
}

// ============ Response Types ============

export interface MaskedPaymentGateway extends Omit<CompanyPaymentGateway, 'merchantSecret' | 'apiSecret' | 'webhookSecret'> {
  merchantSecret: string | null
  apiSecret: string | null
  webhookSecret: string | null
}

// ============ Export Types ============
export type { CompanyPaymentGateway }
