// نظام تسجيل العمليات التلقائي (Audit Logging)
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

interface AuditLogData {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT' | 'PRINT' | 'APPROVE' | 'REJECT'
  entityType: string
  entityId?: string
  oldData?: any
  newData?: any
  companyId?: string
  branchId?: string
  userId?: string
  request?: NextRequest
}

// تخزين مؤقت للجلسات
const sessionCache = new Map<string, { companyId?: string; branchId?: string; userId?: string }>()

// الحصول على معلومات المستخدم من الطلب
export function extractUserInfo(request?: NextRequest): {
  ipAddress?: string
  userAgent?: string
  userId?: string
  companyId?: string
  branchId?: string
} {
  if (!request) return {}

  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}

// تسجيل العملية
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const { action, entityType, entityId, oldData, newData, companyId, branchId, userId, request } = data
    
    const userInfo = extractUserInfo(request)
    
    await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        companyId: companyId || null,
        branchId: branchId || null,
        userId: userId || null,
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
      },
    })
  } catch (error) {
    console.error('Audit log error:', error)
    // لا نريد أن يفشل الطلب بسبب خطأ في السجل
  }
}

// Helper functions للعمليات الشائعة
export const AuditLogger = {
  // تسجيل إنشاء
  async logCreate(entityType: string, newData: any, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'CREATE',
      entityType,
      entityId: newData.id,
      newData,
      ...context,
    })
  },
  
  // تسجيل تحديث
  async logUpdate(entityType: string, entityId: string, oldData: any, newData: any, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'UPDATE',
      entityType,
      entityId,
      oldData,
      newData,
      ...context,
    })
  },
  
  // تسجيل حذف
  async logDelete(entityType: string, entityId: string, oldData: any, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'DELETE',
      entityType,
      entityId,
      oldData,
      ...context,
    })
  },
  
  // تسجيل تسجيل دخول
  async logLogin(userId: string, companyId?: string, branchId?: string, request?: NextRequest) {
    await logAudit({
      action: 'LOGIN',
      entityType: 'User',
      entityId: userId,
      newData: { loginTime: new Date() },
      companyId,
      branchId,
      userId,
      request,
    })
  },
  
  // تسجيل تسجيل خروج
  async logLogout(userId: string, companyId?: string, branchId?: string) {
    await logAudit({
      action: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      newData: { logoutTime: new Date() },
      companyId,
      branchId,
      userId,
    })
  },
  
  // تسجيل عرض
  async logView(entityType: string, entityId: string, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'VIEW',
      entityType,
      entityId,
      ...context,
    })
  },
  
  // تسجيل تصدير
  async logExport(entityType: string, count: number, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'EXPORT',
      entityType,
      newData: { count, exportTime: new Date() },
      ...context,
    })
  },
  
  // تسجيل طباعة
  async logPrint(entityType: string, entityId: string, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'PRINT',
      entityType,
      entityId,
      newData: { printTime: new Date() },
      ...context,
    })
  },
  
  // تسجيل موافقة
  async logApprove(entityType: string, entityId: string, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'APPROVE',
      entityType,
      entityId,
      newData: { approvedAt: new Date() },
      ...context,
    })
  },
  
  // تسجيل رفض
  async logReject(entityType: string, entityId: string, reason: string, context: { companyId?: string; branchId?: string; userId?: string }) {
    await logAudit({
      action: 'REJECT',
      entityType,
      entityId,
      newData: { rejectedAt: new Date(), reason },
      ...context,
    })
  },
}

// أنواع الكيانات
export const EntityTypes = {
  COMPANY: 'Company',
  BRANCH: 'Branch',
  USER: 'User',
  CUSTOMER: 'Customer',
  PRODUCT: 'Product',
  CATEGORY: 'ProductCategory',
  INVOICE: 'Invoice',
  INVOICE_ITEM: 'InvoiceItem',
  PAYMENT: 'Payment',
  INSTALLMENT_CONTRACT: 'InstallmentContract',
  INSTALLMENT: 'Installment',
  RETURN: 'Return',
  RETURN_ITEM: 'ReturnItem',
  WAREHOUSE: 'Warehouse',
  INVENTORY: 'Inventory',
  ZONE: 'Zone',
  COMMISSION_POLICY: 'CommissionPolicy',
  AGENT_COMMISSION: 'AgentCommission',
  PRINT_TEMPLATE: 'PrintTemplate',
  REPORT_TEMPLATE: 'ReportTemplate',
} as const

// الحصول على سجل العمليات
export async function getAuditLogs(filters: {
  companyId?: string
  branchId?: string
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const { companyId, branchId, userId, action, entityType, entityId, startDate, endDate, limit = 50, offset = 0 } = filters
  
  const where: any = {}
  
  if (companyId) where.companyId = companyId
  if (branchId) where.branchId = branchId
  if (userId) where.userId = userId
  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }
  
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        User: { select: { name: true, email: true } },
        Company: { select: { name: true } },
        Branch: { select: { name: true } },
      },
    }),
    db.auditLog.count({ where }),
  ])
  
  return { logs, total }
}
