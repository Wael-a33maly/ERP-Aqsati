// ============================================
// Print Repository - مستودع الطباعة
// ============================================

import { db } from '@/lib/db'
import {
  PrintJobQueryParams,
  PrintTemplateQueryParams,
  CreatePrintJobInput,
  UpdatePrintJobInput,
  CreatePrintTemplateInput,
  UpdatePrintTemplateInput,
  PrintJobWithRelations,
  PrintTemplateWithRelations,
  DocumentType,
  ReceiptPrintLogQueryParams,
  CreateReceiptPrintLogInput,
} from '@/models/print.model'

export const printRepository = {
  // ==================== Print Jobs ====================

  // جلب مهام الطباعة
  async findJobs(params: PrintJobQueryParams): Promise<{ jobs: any[]; total: number }> {
    const where: any = {}
    const skip = ((params.page || 1) - 1) * (params.limit || 20)

    if (params.companyId) where.companyId = params.companyId
    if (params.documentType) where.documentType = params.documentType
    if (params.status) where.status = params.status
    if (params.printedBy) where.printedBy = params.printedBy

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom)
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo)
    }

    const [jobs, total] = await Promise.all([
      db.printJob.findMany({
        where,
        skip,
        take: params.limit || 20,
        include: {
          template: {
            select: { id: true, name: true, type: true, paperSize: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.printJob.count({ where }),
    ])

    return { jobs, total }
  },

  // إنشاء مهمة طباعة
  async createJob(data: CreatePrintJobInput) {
    return db.printJob.create({
      data: {
        templateId: data.templateId || null,
        companyId: data.companyId,
        documentType: data.documentType,
        documentIds: JSON.stringify(data.documentIds),
        printedBy: data.printedBy,
        copies: data.copies || 1,
        status: 'pending',
      },
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
      },
    })
  },

  // تحديث مهمة طباعة
  async updateJob(params: UpdatePrintJobInput) {
    const updateData: any = { status: params.status }
    if (params.status === 'completed') {
      updateData.printedAt = params.printedAt || new Date()
    }

    return db.printJob.update({
      where: { id: params.id },
      data: updateData,
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
      },
    })
  },

  // جلب مهمة طباعة
  async findJob(id: string) {
    return db.printJob.findUnique({
      where: { id },
    })
  },

  // ==================== Print Templates ====================

  // جلب قوالب الطباعة
  async findTemplates(params: PrintTemplateQueryParams): Promise<{ templates: any[]; total: number }> {
    const where: any = {}
    const skip = ((params.page || 1) - 1) * (params.limit || 50)

    if (params.companyId) where.companyId = params.companyId
    if (params.type) where.type = params.type
    if (params.isDefault !== undefined) where.isDefault = params.isDefault
    if (params.active !== undefined) where.active = params.active

    const [templates, total] = await Promise.all([
      db.printTemplate.findMany({
        where,
        skip,
        take: params.limit || 50,
        include: {
          company: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { printJobs: true },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      db.printTemplate.count({ where }),
    ])

    return { templates, total }
  },

  // جلب قالب طباعة
  async findTemplate(id: string) {
    return db.printTemplate.findUnique({
      where: { id },
    })
  },

  // جلب القالب الافتراضي
  async findDefaultTemplate(companyId: string, type: string) {
    return db.printTemplate.findFirst({
      where: {
        companyId,
        type: type as any,
        isDefault: true,
        active: true,
      },
    })
  },

  // إنشاء قالب طباعة
  async createTemplate(data: CreatePrintTemplateInput) {
    return db.printTemplate.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        nameAr: data.nameAr || null,
        type: data.type,
        content: data.content,
        css: data.css || null,
        paperSize: data.paperSize || 'A4',
        orientation: data.orientation || 'portrait',
        isDefault: data.isDefault || false,
        active: true,
      },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
      },
    })
  },

  // تحديث قالب طباعة
  async updateTemplate(params: UpdatePrintTemplateInput) {
    const updateData: any = {}
    if (params.name !== undefined) updateData.name = params.name
    if (params.nameAr !== undefined) updateData.nameAr = params.nameAr
    if (params.type !== undefined) updateData.type = params.type
    if (params.content !== undefined) updateData.content = params.content
    if (params.css !== undefined) updateData.css = params.css || null
    if (params.paperSize !== undefined) updateData.paperSize = params.paperSize
    if (params.orientation !== undefined) updateData.orientation = params.orientation
    if (params.isDefault !== undefined) updateData.isDefault = params.isDefault
    if (params.active !== undefined) updateData.active = params.active

    return db.printTemplate.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
      },
    })
  },

  // إلغاء تعيين القوالب الافتراضية الأخرى
  async unsetOtherDefaults(companyId: string, type: string, excludeId?: string) {
    return db.printTemplate.updateMany({
      where: {
        companyId,
        type: type as any,
        id: excludeId ? { not: excludeId } : undefined,
      },
      data: { isDefault: false },
    })
  },

  // ==================== Document Data ====================

  // جلب بيانات المستند
  async getDocumentData(documentType: DocumentType, documentId: string): Promise<any> {
    switch (documentType) {
      case 'INVOICE':
        return await db.invoice.findUnique({
          where: { id: documentId },
          include: {
            company: true,
            branch: true,
            customer: true,
            agent: { select: { id: true, name: true, nameAr: true } },
            items: {
              include: {
                product: { select: { id: true, sku: true, name: true, nameAr: true, unit: true } },
              },
            },
            installmentContract: {
              include: {
                installments: { orderBy: { installmentNumber: 'asc' } },
              },
            },
          },
        })

      case 'PAYMENT_RECEIPT':
        return await db.payment.findUnique({
          where: { id: documentId },
          include: {
            company: true,
            branch: true,
            customer: true,
            agent: { select: { id: true, name: true, nameAr: true } },
            invoice: { select: { id: true, invoiceNumber: true, total: true } },
          },
        })

      case 'CONTRACT':
      case 'INSTALLMENT_SCHEDULE':
        return await db.installmentContract.findUnique({
          where: { id: documentId },
          include: {
            invoice: {
              include: {
                company: true,
                branch: true,
                items: {
                  include: {
                    product: { select: { id: true, sku: true, name: true, nameAr: true } },
                  },
                },
              },
            },
            customer: true,
            agent: { select: { id: true, name: true, nameAr: true } },
            installments: {
              orderBy: { installmentNumber: 'asc' },
              include: {
                payments: true,
              },
            },
          },
        })

      case 'REPORT':
        return await db.generatedReport.findUnique({
          where: { id: documentId },
          include: {
            company: true,
            template: true,
          },
        })

      default:
        return null
    }
  },

  // جلب معرف الشركة من المستندات
  async getCompanyIdFromDocuments(documentType: DocumentType, documentIds: string[]): Promise<string | null> {
    switch (documentType) {
      case 'INVOICE':
        const invoice = await db.invoice.findFirst({
          where: { id: { in: documentIds } },
          select: { companyId: true },
        })
        return invoice?.companyId || null

      case 'PAYMENT_RECEIPT':
        const payment = await db.payment.findFirst({
          where: { id: { in: documentIds } },
          select: { companyId: true },
        })
        return payment?.companyId || null

      case 'CONTRACT':
      case 'INSTALLMENT_SCHEDULE':
        const contract = await db.installmentContract.findFirst({
          where: { id: { in: documentIds } },
          include: { invoice: { select: { companyId: true } } },
        })
        return contract?.invoice?.companyId || null

      case 'REPORT':
        const report = await db.generatedReport.findFirst({
          where: { id: { in: documentIds } },
          select: { companyId: true },
        })
        return report?.companyId || null

      default:
        return null
    }
  },

  // ==================== Receipt Print Logs ====================

  // جلب سجلات طباعة الإيصالات
  async findReceiptPrintLogs(params: ReceiptPrintLogQueryParams) {
    const where: any = {}
    if (params.companyId) where.companyId = params.companyId
    if (params.invoiceId) where.invoiceId = params.invoiceId
    if (params.installmentId) where.installmentId = params.installmentId

    return db.receiptPrintLog.findMany({
      where,
      orderBy: { printedAt: 'desc' },
      take: params.limit || 50,
    })
  },

  // جلب آخر طباعة لإيصال
  async findLatestReceiptPrint(companyId: string, installmentId?: string) {
    if (!installmentId) return null
    
    return db.receiptPrintLog.findFirst({
      where: {
        companyId,
        installmentId,
      },
      orderBy: { printedAt: 'desc' }
    })
  },

  // إنشاء سجل طباعة إيصال
  async createReceiptPrintLog(data: CreateReceiptPrintLogInput & { printCount: number }) {
    return db.receiptPrintLog.create({
      data: {
        companyId: data.companyId,
        branchId: data.branchId,
        installmentId: data.installmentId,
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        contractNumber: data.contractNumber,
        installmentNumber: data.installmentNumber,
        printedBy: data.printedBy,
        templateId: data.templateId,
        isReprint: data.isReprint || false,
        originalPrintId: data.originalPrintId,
        printCount: data.printCount,
        printMethod: data.printMethod || 'PRINT',
        notes: data.notes,
      }
    })
  }
}
