/**
 * Receipt Preview Model
 * نموذج معاينة الإيصالات
 */

// ============ Types ============

export interface ReceiptPreviewParams {
  branchId?: string
  agentId?: string
  customerId?: string
  customerCodeFrom?: string
  customerCodeTo?: string
  dateFrom?: string
  dateTo?: string
  companyId?: string
}

export interface ReceiptPreviewItem {
  id: string
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date | null
  status: string
  total: number
  paidAmount: number
  remainingAmount: number
  customer: {
    id: string
    code: string | null
    name: string
    nameAr: string | null
    phone: string | null
    phone2: string | null
    address: string | null
    nationalId: string | null
    zone: string | null
  }
  branch: {
    id: string
    name: string
    nameAr: string | null
    phone: string | null
  }
  company: {
    id: string
    name: string
    nameAr: string | null
    phone: string | null
    logo: string | null
  }
  agent: {
    id: string
    name: string
    nameAr: string | null
    phone: string | null
  } | null
  installments: {
    total: number
    paid: number
    current: {
      number: number
      amount: number
      dueDate: Date
    } | null
    remainingAfterCurrent: number
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    total: number
  }>
  downPayment: number
}

export interface ReceiptPreviewResponse {
  success: boolean
  data: ReceiptPreviewItem[]
  meta: {
    total: number
    filters: ReceiptPreviewParams
  }
  error?: string
}
