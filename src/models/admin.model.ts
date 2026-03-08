/**
 * Admin Model
 * نماذج لوحة تحكم السوبر أدمن
 */

// === Admin Stats ===
export interface AdminStatsResponse {
  stats: {
    totalCompanies: number
    activeCompanies: number
    inactiveCompanies: number
    totalUsers: number
    totalCustomers: number
    totalInvoices: number
    totalRevenue: number
    activeSubscriptions: number
    trialSubscriptions: number
    expiredSubscriptions: number
  }
  planStats: Array<{
    id: string
    name: string
    nameAr: string
    price: number
    subscribers: number
  }>
  companies: Array<{
    id: string
    name: string
    nameAr: string
    code: string
    email: string
    phone: string | null
    active: boolean
    subscriptionStatus: string | null
    createdAt: Date
    admin: {
      id: string
      name: string
      email: string
      phone: string | null
    } | null
    subscription: {
      planName: string
      status: string
      endDate: Date | null
      finalPrice: number | null
    } | null
    counts: {
      users: number
      customers: number
      invoices: number
      products: number
      branches: number
    }
  }>
  recentPayments: Array<{
    id: string
    amount: number
    status: string
    paymentMethod: string | null
    createdAt: Date
    companyName: string | null
  }>
}

// === Payment Gateway ===
export interface PaymentGatewayQueryParams {
  companyId?: string
}

export interface PaymentGatewayInput {
  gatewayType: string
  name: string
  nameAr?: string
  companyId?: string
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
}

export interface PaymentGatewayUpdateInput {
  id: string
  gatewayType?: string
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
}

export interface GlobalPaymentSettings {
  defaultCurrency: string
  callbackBaseUrl: string
  webhookEnabled: boolean
  autoSettlement: boolean
  settlementSchedule: string
  notificationEmail: string
  fraudDetection: boolean
  maxRetryAttempts: number
}

// === Collections ===
export interface CollectionsQueryParams {
  period?: 'today' | 'week' | 'month' | 'year'
}

export interface CompanyCollection {
  id: string
  name: string
  nameAr: string
  code: string
  subscriptionStatus: string | null
  plan: string
  collected: number
  sales: number
  pending: number
  collectionRate: number
  byMethod: Record<string, number>
  counts: {
    customers: number
    invoices: number
    payments: number
    users: number
  }
}

export interface CollectionsResponse {
  period: string
  startDate: Date
  endDate: Date
  totals: {
    totalCollected: number
    totalSales: number
    totalPending: number
    totalCompanies: number
    activeCompanies: number
    trialCompanies: number
    expiredCompanies: number
  }
  companies: CompanyCollection[]
}

// === Backup ===
export interface BackupInfo {
  filename: string
  size: number
  createdAt: Date
  type: 'full' | 'company'
}

export interface BackupCreateInput {
  type: 'full' | 'company'
  companyId?: string
}

export interface BackupResponse {
  success: boolean
  filename?: string
  size?: number
  message?: string
  error?: string
}

// === Restore ===
export interface RestoreInput {
  filename: string
  confirmDelete?: boolean
}

export interface RestoreResponse {
  success: boolean
  message?: string
  error?: string
  requiresConfirmation?: boolean
  backupInfo?: {
    type: string
    createdAt: string
    companyName?: string
  }
}

// === Danger Zone ===
export interface DangerDeleteInput {
  scope: 'all' | 'company'
  companyId?: string
  confirmation: string
}

// === Impersonate ===
export interface ImpersonateInput {
  companyId: string
}

export interface ImpersonateResponse {
  success: boolean
  session?: {
    companyId: string
    companyName: string
    branchId?: string
    branchName?: string
  }
  error?: string
}
