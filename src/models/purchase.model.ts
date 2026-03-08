/**
 * Purchase Model
 * نموذج فواتير المشتريات والمرتجعات
 */

import { PurchaseInvoice, PurchaseInvoiceItem, PurchaseReturn, PurchaseReturnItem } from '@prisma/client'

// ============ Types ============

export type PurchaseInvoiceStatus = 'draft' | 'approved' | 'cancelled' | 'paid'
export type PurchaseReturnStatus = 'draft' | 'approved' | 'cancelled'
export type DiscountType = 'PERCENTAGE' | 'FIXED'

// ============ Input Types ============

export interface PurchaseInvoiceItemInput {
  productId: string
  description?: string
  quantity: number
  unitPrice: number
  discount?: number
  taxRate?: number
}

export interface CreatePurchaseInvoiceInput {
  companyId: string
  branchId?: string
  warehouseId: string
  supplierId: string
  supplierInvoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  status?: PurchaseInvoiceStatus
  items: PurchaseInvoiceItemInput[]
  taxRate?: number
  discountType?: DiscountType
  discountValue?: number
  additions?: number
  deductions?: number
  paidAmount?: number
  notes?: string
  createdBy?: string
}

export interface PurchaseReturnItemInput {
  purchaseInvoiceItemId?: string
  productId: string
  description?: string
  quantity: number
  unitPrice: number
  taxRate?: number
}

export interface CreatePurchaseReturnInput {
  companyId: string
  branchId?: string
  warehouseId: string
  supplierId: string
  purchaseInvoiceId?: string
  returnDate?: string
  status?: PurchaseReturnStatus
  reason?: string
  items: PurchaseReturnItemInput[]
  notes?: string
  createdBy?: string
}

// ============ Query Params ============

export interface PurchaseInvoiceQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId: string
  status?: string
  supplierId?: string
  branchId?: string
  warehouseId?: string
  fromDate?: string
  toDate?: string
}

export interface PurchaseReturnQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId: string
  status?: string
  supplierId?: string
}

// ============ Response Types ============

export interface PurchaseInvoiceWithRelations extends PurchaseInvoice {
  Supplier: {
    id: string
    name: string
    supplierCode: string | null
  }
  Branch: {
    id: string
    name: string
  } | null
  Warehouse: {
    id: string
    name: string
  }
  _count: {
    PurchaseInvoiceItem: number
  }
  PurchaseInvoiceItem?: PurchaseInvoiceItem[]
}

export interface PurchaseReturnWithRelations extends PurchaseReturn {
  Supplier: {
    id: string
    name: string
    supplierCode: string | null
  }
  Branch: {
    id: string
    name: string
  } | null
  Warehouse: {
    id: string
    name: string
  }
  PurchaseInvoice: {
    id: string
    invoiceNumber: string
  } | null
  _count: {
    PurchaseReturnItem: number
  }
  PurchaseReturnItem?: PurchaseReturnItem[]
}

// ============ Export Types ============
export type { PurchaseInvoice, PurchaseInvoiceItem, PurchaseReturn, PurchaseReturnItem }
