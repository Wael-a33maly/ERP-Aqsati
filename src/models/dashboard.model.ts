// ============================================
// Dashboard Model - نموذج لوحة التحكم
// ============================================

export interface DashboardStats {
  users: number
  companies: number
  customers: number
  products: number
  invoices: number
  payments: number
  branches: number
  zones: number
  warehouses: number
  totalSales: number
  totalPaid: number
  pendingAmount: number
}

export interface RecentInvoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  customerId: string
  customer: { name: string }
}

export interface RecentPayment {
  id: string
  paymentNumber: string
  amount: number
  method: string
  customerId: string
  customer: { name: string }
}

// Response Types
export interface DashboardStatsResponse {
  success: boolean
  cached: boolean
  data: {
    stats: DashboardStats
    recentInvoices: RecentInvoice[]
    recentPayments: RecentPayment[]
    companyId: string | null
    isSuperAdmin: boolean
  }
}

// Cache
export interface CachedStats {
  data: DashboardStatsResponse
  companyId: string
  timestamp: number
}
