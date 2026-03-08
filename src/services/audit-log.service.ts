// ============================================
// Audit Log Service - خدمة سجل التدقيق
// ============================================

import { auditLogRepository } from '@/repositories/audit-log.repository'
import { 
  AuditLogQueryParams,
  CreateAuditLogInput,
  AuditLogListResponse
} from '@/models/audit-log.model'

export const auditLogService = {
  // جلب سجلات التدقيق
  async getAuditLogs(params: AuditLogQueryParams): Promise<AuditLogListResponse> {
    const limit = params.limit || 50
    const { logs, total } = await auditLogRepository.findMany(params)

    return {
      logs,
      pagination: {
        total,
        page: params.page || 1,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  // إنشاء سجل تدقيق
  async createAuditLog(data: CreateAuditLogInput) {
    return auditLogRepository.create(data)
  },

  // إنشاء سجل تدقيق مبسط
  async createSimpleLog(data: {
    action: string
    entityType: string
    entityId?: string
    userId?: string
    companyId?: string
    branchId?: string
    oldData?: any
    newData?: any
    ipAddress?: string
    userAgent?: string
  }) {
    return auditLogRepository.create({
      action: data.action as any,
      entityType: data.entityType,
      entityId: data.entityId,
      oldData: data.oldData,
      newData: data.newData,
      userId: data.userId || '',
      companyId: data.companyId,
      branchId: data.branchId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    })
  },

  // تسجيل عملية PRINT
  async logPrint(data: {
    companyId: string
    userId: string
    documentType: string
    documentIds: string[]
    printJobId: string
    copies: number
  }) {
    await auditLogRepository.createSimple({
      action: 'PRINT',
      entityType: data.documentType,
      entityId: data.documentIds[0],
      userId: data.userId,
      companyId: data.companyId,
      newData: {
        printJobId: data.printJobId,
        documentIds: data.documentIds,
        copies: data.copies,
      },
    })

    // تسجيل كل مستند في حالة الطباعة المتعددة
    if (data.documentIds.length > 1) {
      for (const docId of data.documentIds) {
        await auditLogRepository.createSimple({
          action: 'PRINT',
          entityType: data.documentType,
          entityId: docId,
          userId: data.userId,
          companyId: data.companyId,
          newData: {
            printJobId: data.printJobId,
            batchIndex: data.documentIds.indexOf(docId),
          },
        })
      }
    }
  },
}
