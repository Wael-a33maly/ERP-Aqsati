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

// ============ Export Types ============
export type { GeneratedReport, ReportTemplate }
