// ============================================
// Print Model - نموذج الطباعة
// ============================================

export type DocumentType = 
  | 'INVOICE'
  | 'RECEIPT'
  | 'CONTRACT'
  | 'REPORT'
  | 'INSTALLMENT_SCHEDULE'
  | 'PAYMENT_RECEIPT'

export type TemplateType = 
  | 'INVOICE'
  | 'RECEIPT'
  | 'CONTRACT'
  | 'REPORT'

export type PaperSize = 'A4' | 'A5' | 'Letter' | 'Legal' | 'Thermal80mm' | 'Thermal58mm'
export type Orientation = 'portrait' | 'landscape'
export type PrintJobStatus = 'pending' | 'completed' | 'failed'

// Print Job
export interface PrintJob {
  id: string
  templateId: string | null
  companyId: string
  documentType: DocumentType
  documentIds: string
  printedBy: string
  copies: number
  status: PrintJobStatus
  printedAt: Date | null
  createdAt: Date
}

export interface PrintJobWithRelations extends PrintJob {
  template?: {
    id: string
    name: string
    type: TemplateType
    paperSize: PaperSize
  } | null
  printedByUser?: {
    id: string
    name: string
    email: string
  } | null
}

// Print Template
export interface PrintTemplate {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  type: TemplateType
  content: string
  css: string | null
  paperSize: PaperSize
  orientation: Orientation
  isDefault: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PrintTemplateWithRelations extends PrintTemplate {
  company?: {
    id: string
    name: string
    code: string
  } | null
  _count?: {
    printJobs: number
  }
}

// Query Parameters
export interface PrintJobQueryParams {
  companyId?: string
  documentType?: DocumentType
  status?: PrintJobStatus
  printedBy?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

export interface PrintTemplateQueryParams {
  companyId?: string
  type?: TemplateType
  isDefault?: boolean
  active?: boolean
  page?: number
  limit?: number
}

// Input Types
export interface CreatePrintJobInput {
  templateId?: string
  documentType: DocumentType
  documentIds: string[]
  copies?: number
  companyId: string
  printedBy: string
}

export interface UpdatePrintJobInput {
  id: string
  status: PrintJobStatus
  printedAt?: Date
}

export interface CreatePrintTemplateInput {
  companyId: string
  name: string
  nameAr?: string
  type: TemplateType
  content: string
  css?: string
  paperSize?: PaperSize
  orientation?: Orientation
  isDefault?: boolean
}

export interface UpdatePrintTemplateInput {
  id: string
  name?: string
  nameAr?: string
  type?: TemplateType
  content?: string
  css?: string
  paperSize?: PaperSize
  orientation?: Orientation
  isDefault?: boolean
  active?: boolean
}

// Preview Types
export interface PrintPreviewInput {
  documentType: DocumentType
  documentId: string
  templateId?: string
}

export interface BatchPrintPreviewInput {
  documentType: DocumentType
  documentIds: string[]
  templateId?: string
}

export interface PrintPreviewResponse {
  html: string
  css: string
  paperSize: PaperSize
  orientation: Orientation
  qrCodeUrl: string
  documentData?: any
}

export interface BatchPrintPreviewResponse {
  previews: Array<{
    id: string
    html: string
    qrCodeUrl: string
  }>
  css: string
  paperSize: PaperSize
  orientation: Orientation
}
