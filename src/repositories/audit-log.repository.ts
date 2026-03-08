// ============================================
// Audit Log Repository - مستودع سجل التدقيق
// ============================================

import { db } from '@/lib/db'
import { 
  AuditLogQueryParams,
  CreateAuditLogInput,
  AuditLogWithRelations
} from '@/models/audit-log.model'

export const auditLogRepository = {
  // جلب سجلات التدقيق
  async findMany(params: AuditLogQueryParams): Promise<{ logs: AuditLogWithRelations[]; total: number }> {
    const where: any = {}
    const skip = ((params.page || 1) - 1) * (params.limit || 50)

    if (params.action) where.action = params.action
    if (params.entityType) where.entityType = params.entityType
    if (params.entityId) where.entityId = params.entityId
    if (params.userId) where.userId = params.userId
    if (params.companyId) where.companyId = params.companyId
    if (params.branchId) where.branchId = params.branchId

    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = new Date(params.startDate)
      if (params.endDate) where.createdAt.lte = new Date(params.endDate)
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 50,
        skip,
        include: {
          User: {
            select: { id: true, name: true, email: true },
          },
          Company: {
            select: { id: true, name: true },
          },
          Branch: {
            select: { id: true, name: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return { logs, total }
  },

  // إنشاء سجل تدقيق
  async create(data: CreateAuditLogInput) {
    return db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        oldData: data.oldData ? JSON.stringify(data.oldData) : null,
        newData: data.newData ? JSON.stringify(data.newData) : null,
        userId: data.userId,
        companyId: data.companyId || null,
        branchId: data.branchId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    })
  },

  // إنشاء سجل تدقيق مبسط
  async createSimple(data: {
    action: string
    entityType: string
    entityId?: string
    userId?: string
    companyId?: string
    branchId?: string
    oldData?: any
    newData?: any
  }) {
    return db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        oldData: data.oldData ? JSON.stringify(data.oldData) : null,
        newData: data.newData ? JSON.stringify(data.newData) : null,
        userId: data.userId || null,
        companyId: data.companyId || null,
        branchId: data.branchId || null,
      },
    })
  },
}
