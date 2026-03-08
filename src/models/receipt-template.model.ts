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
