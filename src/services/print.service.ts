// ============================================
// Print Service - خدمة الطباعة
// ============================================

import { printRepository } from '@/repositories/print.repository'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import {
  PrintJobQueryParams,
  PrintTemplateQueryParams,
  CreatePrintJobInput,
  UpdatePrintJobInput,
  CreatePrintTemplateInput,
  UpdatePrintTemplateInput,
  PrintPreviewInput,
  BatchPrintPreviewInput,
  PrintPreviewResponse,
  BatchPrintPreviewResponse,
  DocumentType,
  PaperSize,
} from '@/models/print.model'

export const printService = {
  // ==================== Print Jobs ====================

  // جلب مهام الطباعة
  async getPrintJobs(params: PrintJobQueryParams & { userRole: string; userCompanyId?: string }) {
    // تطبيق فلترة الشركة
    if (params.userRole !== 'SUPER_ADMIN') {
      if (!params.userCompanyId) {
        return {
          jobs: [],
          pagination: { page: params.page || 1, limit: params.limit || 20, total: 0, totalPages: 0 },
        }
      }
      params.companyId = params.userCompanyId
    }

    const { jobs, total } = await printRepository.findJobs(params)

    // Parse document IDs and get user info
    const parsedJobs = await Promise.all(jobs.map(async (job: any) => {
      const documentIds = JSON.parse(job.documentIds)
      const { printRepository: pr } = await import('@/repositories/print.repository')
      
      // Get user who printed - we need db for this
      const printedByUser = await getPrintedByUser(job.printedBy)

      return {
        ...job,
        documentIds,
        printedByUser,
      }
    }))

    return {
      jobs: parsedJobs,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total,
        totalPages: Math.ceil(total / (params.limit || 20)),
      },
    }
  },

  // إنشاء مهمة طباعة
  async createPrintJob(data: CreatePrintJobInput & { userRole: string; userCompanyId?: string }) {
    // تحديد الشركة
    let targetCompanyId = data.companyId
    if (data.userRole === 'SUPER_ADMIN') {
      targetCompanyId = await printRepository.getCompanyIdFromDocuments(data.documentType, data.documentIds) || data.companyId
    } else {
      targetCompanyId = data.userCompanyId
    }

    if (!targetCompanyId) {
      throw new Error('Could not determine company')
    }

    // التحقق من القالب
    if (data.templateId) {
      const template = await printRepository.findTemplate(data.templateId)
      if (!template) {
        throw new Error('Template not found')
      }
      if (template.companyId !== targetCompanyId && data.userRole !== 'SUPER_ADMIN') {
        throw new Error('Template does not belong to your company')
      }
    }

    // إنشاء مهمة الطباعة
    const printJob = await printRepository.createJob({
      ...data,
      companyId: targetCompanyId,
    })

    // تسجيل في سجل التدقيق
    await auditLogRepository.createSimple({
      action: 'PRINT',
      entityType: data.documentType,
      entityId: data.documentIds[0],
      userId: data.printedBy,
      companyId: targetCompanyId,
      newData: {
        printJobId: printJob.id,
        documentIds: data.documentIds,
        copies: data.copies,
      },
    })

    return {
      ...printJob,
      documentIds: JSON.parse(printJob.documentIds),
    }
  },

  // تحديث مهمة طباعة
  async updatePrintJob(params: UpdatePrintJobInput & { userId: string; userRole: string; userCompanyId?: string }) {
    const existingJob = await printRepository.findJob(params.id)

    if (!existingJob) {
      throw new Error('Print job not found')
    }

    // التحقق من الصلاحيات
    if (params.userRole !== 'SUPER_ADMIN' && params.userCompanyId !== existingJob.companyId) {
      throw new Error('Forbidden')
    }

    const validStatuses = ['pending', 'completed', 'failed']
    if (!validStatuses.includes(params.status)) {
      throw new Error('Invalid status')
    }

    const printJob = await printRepository.updateJob(params)

    return {
      ...printJob,
      documentIds: JSON.parse(printJob.documentIds),
    }
  },

  // ==================== Print Templates ====================

  // جلب قوالب الطباعة
  async getPrintTemplates(params: PrintTemplateQueryParams & { userRole: string; userCompanyId?: string }) {
    // تطبيق فلترة الشركة
    if (params.userRole !== 'SUPER_ADMIN') {
      if (!params.userCompanyId) {
        return {
          templates: [],
          pagination: { page: params.page || 1, limit: params.limit || 50, total: 0, totalPages: 0 },
        }
      }
      params.companyId = params.userCompanyId
    }

    const { templates, total } = await printRepository.findTemplates(params)

    return {
      templates,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total,
        totalPages: Math.ceil(total / (params.limit || 50)),
      },
    }
  },

  // إنشاء قالب طباعة
  async createPrintTemplate(data: CreatePrintTemplateInput & { userId: string; userRole: string; userCompanyId?: string }) {
    // تحديد الشركة
    const targetCompanyId = data.userRole === 'SUPER_ADMIN' ? data.companyId : data.userCompanyId
    if (!targetCompanyId) {
      throw new Error('Company ID is required')
    }

    // إذا كان القالب افتراضي، إلغاء تعيين القوالب الأخرى
    if (data.isDefault) {
      await printRepository.unsetOtherDefaults(targetCompanyId, data.type)
    }

    const template = await printRepository.createTemplate({
      ...data,
      companyId: targetCompanyId,
    })

    // تسجيل في سجل التدقيق
    await auditLogRepository.createSimple({
      action: 'CREATE',
      entityType: 'PrintTemplate',
      entityId: template.id,
      userId: data.userId,
      companyId: targetCompanyId,
      newData: { name: data.name, type: data.type, paperSize: data.paperSize, orientation: data.orientation },
    })

    return template
  },

  // تحديث قالب طباعة
  async updatePrintTemplate(params: UpdatePrintTemplateInput & { userId: string; userRole: string; userCompanyId?: string }) {
    const existingTemplate = await printRepository.findTemplate(params.id)

    if (!existingTemplate) {
      throw new Error('Template not found')
    }

    // التحقق من الصلاحيات
    if (params.userRole !== 'SUPER_ADMIN' && params.userCompanyId !== existingTemplate.companyId) {
      throw new Error('Forbidden')
    }

    // إذا كان القالب افتراضي، إلغاء تعيين القوالب الأخرى
    if (params.isDefault) {
      await printRepository.unsetOtherDefaults(existingTemplate.companyId, params.type || existingTemplate.type, params.id)
    }

    const template = await printRepository.updateTemplate(params)

    // تسجيل في سجل التدقيق
    await auditLogRepository.createSimple({
      action: 'UPDATE',
      entityType: 'PrintTemplate',
      entityId: template.id,
      userId: params.userId,
      companyId: existingTemplate.companyId,
      oldData: existingTemplate,
      newData: template,
    })

    return template
  },

  // حذف قالب طباعة (soft delete)
  async deletePrintTemplate(id: string, params: { userId: string; userRole: string; userCompanyId?: string }) {
    const existingTemplate = await printRepository.findTemplate(id)

    if (!existingTemplate) {
      throw new Error('Template not found')
    }

    // التحقق من الصلاحيات
    if (params.userRole !== 'SUPER_ADMIN' && params.userCompanyId !== existingTemplate.companyId) {
      throw new Error('Forbidden')
    }

    // Soft delete
    const template = await printRepository.updateTemplate({ id, active: false })

    // تسجيل في سجل التدقيق
    await auditLogRepository.createSimple({
      action: 'DELETE',
      entityType: 'PrintTemplate',
      entityId: template.id,
      userId: params.userId,
      companyId: existingTemplate.companyId,
      oldData: existingTemplate,
    })

    return { success: true, message: 'Print template deleted successfully' }
  },

  // ==================== Preview ====================

  // إنشاء معاينة طباعة
  async generatePreview(params: PrintPreviewInput & { userRole: string; userCompanyId?: string }): Promise<PrintPreviewResponse> {
    const documentData = await printRepository.getDocumentData(params.documentType, params.documentId)
    
    if (!documentData) {
      throw new Error('Document not found')
    }

    // التحقق من الصلاحيات
    const targetCompanyId = documentData.companyId
    if (params.userRole !== 'SUPER_ADMIN' && params.userCompanyId !== targetCompanyId) {
      throw new Error('Forbidden')
    }

    // جلب القالب
    let template = null
    if (params.templateId) {
      template = await printRepository.findTemplate(params.templateId)
    }

    if (!template) {
      const templateType = params.documentType === 'PAYMENT_RECEIPT' ? 'RECEIPT' :
                          params.documentType === 'INSTALLMENT_SCHEDULE' ? 'CONTRACT' :
                          params.documentType
      template = await printRepository.findDefaultTemplate(targetCompanyId, templateType)
    }

    // توليد HTML
    const html = await generateHTML(params.documentType, documentData, template)
    const qrCodeUrl = await generateQRCodeUrl(params.documentType, params.documentId, targetCompanyId)

    return {
      html,
      css: template?.css || getDefaultCSS(template?.paperSize || 'A4'),
      paperSize: template?.paperSize || 'A4',
      orientation: template?.orientation || 'portrait',
      qrCodeUrl,
      documentData,
    }
  },

  // إنشاء معاينة طباعة متعددة
  async generateBatchPreview(params: BatchPrintPreviewInput & { userRole: string; userCompanyId?: string }): Promise<BatchPrintPreviewResponse> {
    // جلب بيانات جميع المستندات
    const documents = await Promise.all(
      params.documentIds.map(async (docId) => {
        const data = await printRepository.getDocumentData(params.documentType, docId)
        if (!data) return null

        // التحقق من الصلاحيات
        if (params.userRole !== 'SUPER_ADMIN' && params.userCompanyId !== data.companyId) {
          return null
        }
        return { id: docId, data }
      })
    )

    const validDocuments = documents.filter(Boolean) as Array<{ id: string; data: any }>

    // جلب القالب
    let template = null
    if (params.templateId) {
      template = await printRepository.findTemplate(params.templateId)
    }

    if (!template && validDocuments.length > 0) {
      const templateType = params.documentType === 'PAYMENT_RECEIPT' ? 'RECEIPT' :
                          params.documentType === 'INSTALLMENT_SCHEDULE' ? 'CONTRACT' :
                          params.documentType
      template = await printRepository.findDefaultTemplate(validDocuments[0].data.companyId, templateType)
    }

    // توليد HTML لكل مستند
    const previews = await Promise.all(
      validDocuments.map(async (doc) => {
        const html = await generateHTML(params.documentType, doc.data, template)
        const qrCodeUrl = await generateQRCodeUrl(params.documentType, doc.id, doc.data.companyId)
        return {
          id: doc.id,
          html,
          qrCodeUrl,
        }
      })
    )

    return {
      previews,
      css: template?.css || getDefaultCSS(template?.paperSize || 'A4'),
      paperSize: template?.paperSize || 'A4',
      orientation: template?.orientation || 'portrait',
    }
  },
}

// Helper functions
async function getPrintedByUser(userId: string) {
  const { db } = await import('@/lib/db')
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
}

async function generateHTML(documentType: DocumentType, data: any, template: any): Promise<string> {
  if (template && template.content) {
    return substituteTemplateVariables(template.content, data)
  }
  return generateDefaultHTML(documentType, data)
}

function substituteTemplateVariables(templateContent: string, data: any): string {
  let result = templateContent

  const variables: Record<string, any> = {
    '{{companyName}}': data.company?.name || '',
    '{{companyNameAr}}': data.company?.nameAr || '',
    '{{companyCode}}': data.company?.code || '',
    '{{companyLogo}}': data.company?.logo || '',
    '{{companyPhone}}': data.company?.phone || '',
    '{{companyEmail}}': data.company?.email || '',
    '{{companyAddress}}': data.company?.address || '',
    '{{companyTaxNumber}}': data.company?.taxNumber || '',
    '{{branchName}}': data.branch?.name || '',
    '{{branchCode}}': data.branch?.code || '',
    '{{branchAddress}}': data.branch?.address || '',
    '{{customerName}}': data.customer?.name || '',
    '{{customerNameAr}}': data.customer?.nameAr || '',
    '{{customerCode}}': data.customer?.code || '',
    '{{customerPhone}}': data.customer?.phone || '',
    '{{customerAddress}}': data.customer?.address || '',
    '{{customerNationalId}}': data.customer?.nationalId || '',
    '{{invoiceNumber}}': data.invoiceNumber || '',
    '{{invoiceDate}}': formatDate(data.invoiceDate),
    '{{dueDate}}': formatDate(data.dueDate),
    '{{subtotal}}': formatCurrency(data.subtotal),
    '{{discount}}': formatCurrency(data.discount),
    '{{taxAmount}}': formatCurrency(data.taxAmount),
    '{{total}}': formatCurrency(data.total),
    '{{paidAmount}}': formatCurrency(data.paidAmount),
    '{{remainingAmount}}': formatCurrency(data.remainingAmount),
    '{{paymentNumber}}': data.paymentNumber || '',
    '{{paymentDate}}': formatDate(data.paymentDate),
    '{{paymentMethod}}': data.method || '',
    '{{paymentAmount}}': formatCurrency(data.amount),
    '{{contractNumber}}': data.contractNumber || '',
    '{{contractDate}}': formatDate(data.contractDate),
    '{{totalAmount}}': formatCurrency(data.totalAmount),
    '{{downPayment}}': formatCurrency(data.downPayment),
    '{{financedAmount}}': formatCurrency(data.financedAmount),
    '{{numberOfPayments}}': data.numberOfPayments || '',
    '{{paymentFrequency}}': data.paymentFrequency || '',
    '{{interestRate}}': data.interestRate ? `${data.interestRate}%` : '',
    '{{agentName}}': data.agent?.name || '',
    '{{currentDate}}': formatDate(new Date()),
    '{{currentTime}}': new Date().toLocaleTimeString(),
  }

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value))
  }

  return result
}

function generateDefaultHTML(documentType: DocumentType, data: any): string {
  // Simple default HTML templates
  switch (documentType) {
    case 'INVOICE':
      return generateInvoiceHTML(data)
    case 'PAYMENT_RECEIPT':
      return generatePaymentReceiptHTML(data)
    case 'CONTRACT':
    case 'INSTALLMENT_SCHEDULE':
      return generateContractHTML(data)
    default:
      return '<p>Unsupported document type</p>'
  }
}

function generateInvoiceHTML(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h1>${data.company?.name || 'Company'}</h1>
      <h2>INVOICE: ${data.invoiceNumber}</h2>
      <p>Date: ${formatDate(data.invoiceDate)}</p>
      <p>Customer: ${data.customer?.name || ''}</p>
      <p>Total: ${formatCurrency(data.total)}</p>
    </div>
  `
}

function generatePaymentReceiptHTML(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
      <h2>${data.company?.name || 'Company'}</h2>
      <h3>RECEIPT: ${data.paymentNumber}</h3>
      <p>Date: ${formatDate(data.paymentDate)}</p>
      <p>Customer: ${data.customer?.name || ''}</p>
      <p>Amount: ${formatCurrency(data.amount)}</p>
    </div>
  `
}

function generateContractHTML(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h1>${data.invoice?.company?.name || 'Company'}</h1>
      <h2>INSTALLMENT CONTRACT: ${data.contractNumber}</h2>
      <p>Customer: ${data.customer?.name || ''}</p>
      <p>Total Amount: ${formatCurrency(data.totalAmount)}</p>
      <p>Number of Payments: ${data.numberOfPayments}</p>
    </div>
  `
}

async function generateQRCodeUrl(documentType: string, documentId: string, companyId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verify.example.com'
  const verificationUrl = `${baseUrl}/verify/${documentType.toLowerCase()}/${documentId}?company=${companyId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`
}

function formatDate(date: any): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(amount: any): string {
  if (amount === null || amount === undefined) return '0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function getDefaultCSS(paperSize: PaperSize): string {
  const sizes: Record<PaperSize, string> = {
    'A4': '210mm 297mm',
    'A5': '148mm 210mm',
    'Letter': '8.5in 11in',
    'Legal': '8.5in 14in',
    'Thermal80mm': '80mm auto',
    'Thermal58mm': '58mm auto',
  }

  return `
    @page { size: ${sizes[paperSize] || sizes['A4']}; margin: 10mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; }
  `
}
