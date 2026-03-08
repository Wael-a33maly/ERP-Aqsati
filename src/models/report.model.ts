/**
 * Report Model
 * نموذج التقارير
 */

import { GeneratedReport, ReportTemplate } from '@prisma/client'

// ============ Types ============

export type ReportType = 'SALES' | 'COLLECTION' | 'INVENTORY' | 'COMMISSION' | 'FINANCIAL'
export type ReportFormat = 'PDF' | 'EXCEL' | 'HTML' | 'JSON'
export type ReportView = 'summary' | 'byAgent' | 'byBranch' | 'byProduct' | 'byCustomer' | 'byPeriod' | 'stockLevels' | 'lowStock' | 'movements' | 'overdue' | 'performance'

// ============ Input Types ============

export interface GenerateReportInput {
  templateId?: string
  companyId?: string
  branchId?: string
  name?: string
  type: ReportType
  parameters?: {
    dateFrom?: string
    dateTo?: string
    customerIds?: string[]
    agentIds?: string[]
    zoneIds?: string[]
    branchIds?: string[]
    productIds?: string[]
    categoryIds?: string[]
    status?: string[]
    warehouseId?: string
    lowStockOnly?: boolean
    [key: string]: unknown
  }
  format?: ReportFormat
}

// ============ Query Params ============

export interface ReportQueryParams {
  page?: number
  limit?: number
  companyId?: string
  type?: ReportType
  generatedBy?: string
  dateFrom?: string
  dateTo?: string
}

export interface SalesReportParams {
  companyId: string
  branchId?: string
  dateFrom?: string
  dateTo?: string
  view?: ReportView
}

export interface CollectionReportParams {
  companyId: string
  branchId?: string
  dateFrom?: string
  dateTo?: string
  view?: ReportView
}

export interface InventoryReportParams {
  companyId: string
  warehouseId?: string
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  view?: ReportView
}

// ============ Inventory Valuation Report ============

export interface InventoryValuationParams {
  companyId: string
  warehouseId?: string
  productId?: string
  categoryId?: string
  minQuantity?: number
  maxQuantity?: number
  showZeroStock?: boolean
}

export interface InventoryValuationItem {
  productId: string
  productSku: string
  productName: string
  productNameAr: string | null
  unit: string
  costPrice: number
  sellPrice: number
  category: {
    id: string
    name: string
    nameAr: string | null
  } | null
  supplier: {
    id: string
    name: string
    supplierCode: string | null
  } | null
  inventories: Array<{
    warehouseId: string
    warehouseName: string
    warehouseNameAr: string | null
    quantity: number
    reservedQuantity: number
    availableQuantity: number
    avgCost: number | null
    totalCost: number | null
    minQuantity: number
    maxQuantity: number
    lastPurchaseDate: Date | null
    lastPurchaseCost: number | null
    isLowStock: boolean
  }>
  totalQuantity: number
  totalValue: number
  avgUnitCost: number
}

export interface InventoryValuationSummary {
  totalProducts: number
  totalQuantity: number
  totalValue: number
  lowStockCount: number
  zeroStockCount: number
}

export interface InventoryValuationResponse {
  data: InventoryValuationItem[]
  summary: InventoryValuationSummary
}

// ============ Report Template ============

export const REPORT_TYPES = ['SALES', 'COLLECTION', 'INVENTORY', 'COMMISSION', 'FINANCIAL'] as const
type ReportTypeValue = typeof REPORT_TYPES[number]

export interface ReportTemplateConfig {
  title?: string
  description?: string
  groupBy?: string[]
  sortBy?: string
  showTotals?: boolean
  showSubtotals?: boolean
  dateFormat?: string
  currency?: string
}

export interface ReportTemplateFilter {
  field: string
  label: string
  type: 'text' | 'date' | 'select' | 'number'
  options?: { value: string; label: string }[]
  required?: boolean
  defaultValue?: string | number
}

export interface ReportTemplateColumn {
  field: string
  label: string
  width?: number
  align?: 'left' | 'center' | 'right'
  format?: 'number' | 'currency' | 'date' | 'percent'
  sortable?: boolean
  visible?: boolean
}

export interface CreateReportTemplateInput {
  companyId: string
  name: string
  nameAr?: string
  type: ReportTypeValue
  config?: ReportTemplateConfig
  filters?: ReportTemplateFilter[]
  columns?: ReportTemplateColumn[]
  isDefault?: boolean
}

export interface UpdateReportTemplateInput {
  id: string
  name?: string
  nameAr?: string
  type?: ReportTypeValue
  config?: ReportTemplateConfig
  filters?: ReportTemplateFilter[]
  columns?: ReportTemplateColumn[]
  isDefault?: boolean
  active?: boolean
}

export interface ReportTemplateQueryParams {
  page?: number
  limit?: number
  companyId?: string
  type?: ReportTypeValue
  isDefault?: boolean
  active?: boolean
}

// ============ Export Types ============
export type { GeneratedReport, ReportTemplate }
