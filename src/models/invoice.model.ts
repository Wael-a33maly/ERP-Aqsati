/**
 * Invoice Model
 */

export interface InvoiceQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  customerId?: string
  status?: string
  type?: string
  dateFrom?: string
  dateTo?: string
}

export interface InvoiceInput {
  customerId: string
  companyId: string
  branchId?: string
  agentId?: string
  type?: 'CASH' | 'INSTALLMENT'
  items: InvoiceItemInput[]
  discount?: number
  taxRate?: number
  paidAmount?: number
  notes?: string
}

export interface InvoiceItemInput {
  productId: string
  quantity: number
  unitPrice: number
  discount?: number
}
