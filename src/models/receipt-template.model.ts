/**
 * Receipt Template Model
 * نموذج قوالب الإيصالات
 */

import { CompanyReceiptTemplate, ReceiptPrintLog } from '@prisma/client'

// ============ Types ============

export type PaperSize = 'A4' | 'A4_THIRD' | 'A5' | 'THERMAL_80' | 'CUSTOM'

// ============ Input Types ============

export interface CreateReceiptTemplateInput {
  companyId: string
  branchId?: string
  name: string
  nameAr?: string
  templateJson: string | Record<string, unknown>
  isDefault?: boolean
  paperSize?: PaperSize
  customWidth?: number
  customHeight?: number
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  createdBy?: string
}

export interface UpdateReceiptTemplateInput {
  id: string
  companyId: string
  name?: string
  nameAr?: string
  templateJson?: string | Record<string, unknown>
  isDefault?: boolean
  paperSize?: PaperSize
  customWidth?: number
  customHeight?: number
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
}

// ============ Query Params ============

export interface ReceiptTemplateQueryParams {
  companyId: string
  branchId?: string
  includeInactive?: boolean
}

// ============ Response Types ============

export interface TemplateWithStats extends CompanyReceiptTemplate {
  printCount: number
  isFromMarketplace: boolean
  paperSizeLabel: string
  globalTemplate?: {
    id: string
    name: string
    nameAr: string | null
    previewImage: string | null
    templateType: string
  }
}

// ============ Export Types ============
export type { CompanyReceiptTemplate, ReceiptPrintLog }

// ============ Marketplace Types ============

export interface MarketplaceQueryParams {
  category?: string
  type?: string
  isFree?: boolean
  isFeatured?: boolean
  search?: string
  sortBy?: string
  limit?: number
  page?: number
}

export interface InstallTemplateInput {
  globalTemplateId: string
  companyId: string
  branchId?: string
  makeDefault?: boolean
}

export interface MarketplaceTemplate {
  id: string
  name: string
  nameAr: string | null
  description: string | null
  descriptionAr: string | null
  category: string
  templateType: string
  paperSize: string
  isFree: boolean
  price: number
  currency: string
  rating: number
  ratingCount: number
  installCount: number
  previewImage: string | null
  customWidth: number | null
  customHeight: number | null
  priceFormatted: string
  ratingAvg: string
  paperSizeLabel: string
  templateTypeLabel: string
}

// ============ Category Types ============

export interface CategoryWithCount {
  id: string
  name: string
  nameAr: string | null
  code: string
  icon: string | null
  sortOrder: number
  active: boolean
  templateCount: number
}

export interface CreateCategoryInput {
  name: string
  nameAr: string
  code: string
  icon?: string
  sortOrder?: number
}

// ============ Print Log Types ============

export interface PrintLogQueryParams {
  companyId: string
  branchId?: string
  installmentId?: string
  customerId?: string
  printedBy?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  page?: number
}

export interface CreatePrintLogInput {
  companyId: string
  branchId?: string
  templateId?: string
  installmentId: string
  invoiceId?: string
  customerId: string
  contractNumber?: string
  installmentNumber?: string
  printedBy: string
  printMethod?: string
  notes?: string
}

export interface PrintLogWithTemplate {
  id: string
  companyId: string
  branchId: string | null
  templateId: string | null
  installmentId: string
  invoiceId: string | null
  customerId: string
  contractNumber: string | null
  installmentNumber: string | null
  printedBy: string
  isReprint: boolean
  originalPrintId: string | null
  printCount: number
  printMethod: string
  notes: string | null
  printedAt: Date
  template: {
    id: string
    name: string
    nameAr: string | null
  } | null
}

// ============ Company Templates Types ============

export interface CompanyTemplateQueryParams {
  companyId: string
}

export interface CompanyTemplate {
  id: string
  name: string
  nameAr: string | null
  description: string | null
  descriptionAr: string | null
  category: string
  isFree: boolean
  price: number
  rating: number
  downloads: number
  isInstalled: boolean
  installedId?: string
  isDefault: boolean
  owned: boolean
  isCustom?: boolean
  paperSize?: string
  createdAt?: Date
}
