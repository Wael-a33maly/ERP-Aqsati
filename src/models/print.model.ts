/**
 * Print Model
 * نماذج الطباعة والقوالب
 */

export interface PrintTemplateQueryParams {
  companyId?: string
  type?: 'INVOICE' | 'RECEIPT' | 'CONTRACT' | 'REPORT'
  isDefault?: boolean
}

export interface PrintTemplateInput {
  name: string
  nameAr?: string
  type: 'INVOICE' | 'RECEIPT' | 'CONTRACT' | 'REPORT'
  companyId?: string
  content: string
  css?: string
  paperSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Thermal80mm' | 'Thermal58mm'
  orientation?: 'portrait' | 'landscape'
  isDefault?: boolean
  active?: boolean
}

export interface PrintJobInput {
  documentType: string
  documentIds: string[]
  templateId?: string
  copies?: number
}

export interface ReceiptPrintInput {
  paymentId?: string
  invoiceId?: string
  templateType?: string
}
