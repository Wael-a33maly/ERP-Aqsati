// نظام تسجيل العمليات التلقائي المحسن
// Enhanced Automatic Audit Logging System

import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

// ===================== TYPES =====================
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT' | 'PRINT' | 'APPROVE' | 'REJECT' | 'SYNC' | 'BULK_DELETE' | 'BULK_UPDATE'

interface AuditContext {
  userId?: string
  companyId?: string
  branchId?: string
  request?: NextRequest
  ipAddress?: string
  userAgent?: string
}

interface AuditEntry {
  action: AuditAction
  entityType: string
  entityId?: string
  oldData?: any
  newData?: any
  description?: string
}

// ===================== DECORATOR FACTORY =====================
// إنشاء decorator للتسجيل التلقائي
export function Auditable(action: AuditAction, entityType: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const context: AuditContext = args[args.length - 1] || {}
      const result = await originalMethod.apply(this, args)
      
      // تسجيل العملية
      await logAudit({
        action,
        entityType,
        entityId: result?.id,
        newData: result,
        ...context
      })
      
      return result
    }
    
    return descriptor
  }
}

// ===================== AUTO LOGGING WRAPPERS =====================
// دوال مُغلفة للتسجيل التلقائي

export const AuditableDb = {
  // ===================== CUSTOMERS =====================
  async createCustomer(data: any, context: AuditContext) {
    const customer = await db.customer.create({ data })
    await logAudit({
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      newData: customer,
      description: `تم إنشاء عميل جديد: ${customer.name}`,
      ...context
    })
    return customer
  },
  
  async updateCustomer(id: string, data: any, context: AuditContext) {
    const oldData = await db.customer.findUnique({ where: { id } })
    const customer = await db.customer.update({ where: { id }, data })
    await logAudit({
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: id,
      oldData,
      newData: customer,
      description: `تم تحديث العميل: ${customer.name}`,
      ...context
    })
    return customer
  },
  
  async deleteCustomer(id: string, context: AuditContext) {
    const customer = await db.customer.findUnique({ where: { id } })
    await db.customer.delete({ where: { id } })
    await logAudit({
      action: 'DELETE',
      entityType: 'Customer',
      entityId: id,
      oldData: customer,
      description: `تم حذف العميل: ${customer?.name}`,
      ...context
    })
  },
  
  // ===================== INVOICES =====================
  async createInvoice(data: any, items: any[], context: AuditContext) {
    const invoice = await db.invoice.create({
      data: {
        ...data,
        InvoiceItem: {
          create: items
        }
      },
      include: { InvoiceItem: true }
    })
    
    await logAudit({
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      newData: invoice,
      description: `تم إنشاء فاتورة رقم: ${invoice.invoiceNumber}`,
      ...context
    })
    
    return invoice
  },
  
  async updateInvoiceStatus(id: string, status: string, context: AuditContext) {
    const oldData = await db.invoice.findUnique({ where: { id } })
    const invoice = await db.invoice.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    })
    
    await logAudit({
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: id,
      oldData: { status: oldData?.status },
      newData: { status },
      description: `تم تغيير حالة الفاتورة ${invoice.invoiceNumber} إلى: ${status}`,
      ...context
    })
    
    return invoice
  },
  
  async cancelInvoice(id: string, reason: string, context: AuditContext) {
    const oldData = await db.invoice.findUnique({ where: { id } })
    const invoice = await db.invoice.update({
      where: { id },
      data: { status: 'cancelled', notes: reason, updatedAt: new Date() }
    })
    
    await logAudit({
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: id,
      oldData,
      newData: { status: 'cancelled', reason },
      description: `تم إلغاء الفاتورة ${invoice.invoiceNumber}`,
      ...context
    })
    
    return invoice
  },
  
  // ===================== PAYMENTS =====================
  async createPayment(data: any, context: AuditContext) {
    const payment = await db.payment.create({ data })
    
    await logAudit({
      action: 'CREATE',
      entityType: 'Payment',
      entityId: payment.id,
      newData: payment,
      description: `تم تسجيل دفعة رقم: ${payment.paymentNumber} بقيمة ${payment.amount}`,
      ...context
    })
    
    // تحديث الفاتورة إذا كانت مرتبطة
    if (payment.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: payment.invoiceId }
      })
      
      if (invoice) {
        const newPaidAmount = invoice.paidAmount + payment.amount
        const newRemaining = invoice.total - newPaidAmount
        
        await db.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: Math.max(0, newRemaining),
            status: newRemaining <= 0 ? 'paid' : 'partial',
            updatedAt: new Date()
          }
        })
      }
    }
    
    return payment
  },
  
  // ===================== INSTALLMENTS =====================
  async collectInstallment(
    installmentId: string,
    amount: number,
    method: string,
    context: AuditContext
  ) {
    const oldData = await db.installment.findUnique({
      where: { id: installmentId },
      include: { InstallmentContract: true }
    })
    
    const installment = await db.installment.update({
      where: { id: installmentId },
      data: {
        paidAmount: { increment: amount },
        remainingAmount: { decrement: amount },
        status: (oldData?.remainingAmount || 0) - amount <= 0 ? 'paid' : 'partial',
        paidDate: new Date(),
        updatedAt: new Date()
      }
    })
    
    // إنشاء سجل الدفع
    await db.installmentPayment.create({
      data: {
        id: crypto.randomUUID(),
        installmentId,
        agentId: context.userId,
        paymentDate: new Date(),
        amount,
        method
      }
    })
    
    await logAudit({
      action: 'UPDATE',
      entityType: 'Installment',
      entityId: installmentId,
      oldData: { paidAmount: oldData?.paidAmount, remainingAmount: oldData?.remainingAmount },
      newData: { paidAmount: installment.paidAmount, remainingAmount: installment.remainingAmount, collectedAmount: amount },
      description: `تم تحصيل قسط بقيمة ${amount} - ${method}`,
      ...context
    })
    
    return installment
  },
  
  // ===================== PRODUCTS =====================
  async createProduct(data: any, context: AuditContext) {
    const product = await db.product.create({ data })
    
    await logAudit({
      action: 'CREATE',
      entityType: 'Product',
      entityId: product.id,
      newData: product,
      description: `تم إنشاء منتج: ${product.name}`,
      ...context
    })
    
    return product
  },
  
  async updateProduct(id: string, data: any, context: AuditContext) {
    const oldData = await db.product.findUnique({ where: { id } })
    const product = await db.product.update({ where: { id }, data })
    
    await logAudit({
      action: 'UPDATE',
      entityType: 'Product',
      entityId: id,
      oldData,
      newData: product,
      description: `تم تحديث المنتج: ${product.name}`,
      ...context
    })
    
    return product
  },
  
  async deleteProduct(id: string, context: AuditContext) {
    const product = await db.product.findUnique({ where: { id } })
    await db.product.delete({ where: { id } })
    
    await logAudit({
      action: 'DELETE',
      entityType: 'Product',
      entityId: id,
      oldData: product,
      description: `تم حذف المنتج: ${product?.name}`,
      ...context
    })
  },
  
  // ===================== INVENTORY =====================
  async adjustInventory(
    productId: string,
    warehouseId: string,
    quantityChange: number,
    reason: string,
    context: AuditContext
  ) {
    const existing = await db.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } }
    })
    
    const oldQuantity = existing?.quantity || 0
    const newQuantity = oldQuantity + quantityChange
    
    let inventory
    if (existing) {
      inventory = await db.inventory.update({
        where: { id: existing.id },
        data: { quantity: newQuantity, updatedAt: new Date() }
      })
    } else {
      inventory = await db.inventory.create({
        data: {
          id: crypto.randomUUID(),
          productId,
          warehouseId,
          quantity: newQuantity,
          updatedAt: new Date()
        }
      })
    }
    
    // تسجيل حركة المخزون
    await db.inventoryMovement.create({
      data: {
        id: crypto.randomUUID(),
        productId,
        warehouseId,
        type: quantityChange > 0 ? 'in' : 'out',
        quantity: Math.abs(quantityChange),
        referenceType: 'adjustment',
        notes: reason,
        createdBy: context.userId,
        createdAt: new Date()
      }
    })
    
    await logAudit({
      action: 'UPDATE',
      entityType: 'Inventory',
      entityId: inventory.id,
      oldData: { quantity: oldQuantity },
      newData: { quantity: newQuantity, change: quantityChange },
      description: `تعديل المخزون: ${quantityChange > 0 ? '+' : ''}${quantityChange} - ${reason}`,
      ...context
    })
    
    return inventory
  },
  
  // ===================== USERS =====================
  async createUser(data: any, context: AuditContext) {
    const user = await db.user.create({ data })
    
    await logAudit({
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      newData: { ...user, password: '[REDACTED]' },
      description: `تم إنشاء مستخدم: ${user.name}`,
      ...context
    })
    
    return user
  },
  
  async updateUser(id: string, data: any, context: AuditContext) {
    const oldData = await db.user.findUnique({ where: { id } })
    const user = await db.user.update({
      where: { id },
      data: { ...data, password: data.password ? data.password : undefined }
    })
    
    await logAudit({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      oldData: { ...oldData, password: '[REDACTED]' },
      newData: { ...user, password: '[REDACTED]' },
      description: `تم تحديث المستخدم: ${user.name}`,
      ...context
    })
    
    return user
  },
  
  async deleteUser(id: string, context: AuditContext) {
    const user = await db.user.findUnique({ where: { id } })
    await db.user.delete({ where: { id } })
    
    await logAudit({
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      oldData: { ...user, password: '[REDACTED]' },
      description: `تم حذف المستخدم: ${user?.name}`,
      ...context
    })
  },
  
  // ===================== BULK OPERATIONS =====================
  async bulkDelete(entityType: string, ids: string[], context: AuditContext) {
    const results = []
    
    for (const id of ids) {
      try {
        switch (entityType) {
          case 'Customer':
            await db.customer.delete({ where: { id } })
            break
          case 'Product':
            await db.product.delete({ where: { id } })
            break
          case 'Invoice':
            await db.invoice.delete({ where: { id } })
            break
          // إضافة المزيد حسب الحاجة
        }
        results.push({ id, success: true })
      } catch (error: any) {
        results.push({ id, success: false, error: error.message })
      }
    }
    
    await logAudit({
      action: 'BULK_DELETE',
      entityType,
      newData: { count: ids.length, results },
      description: `تم حذف ${results.filter(r => r.success).length} من ${ids.length} ${entityType}`,
      ...context
    })
    
    return results
  },
  
  // ===================== AUTH =====================
  async login(userId: string, context: AuditContext) {
    await db.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: context.ipAddress,
        failedLoginAttempts: 0
      }
    })
    
    await logAudit({
      action: 'LOGIN',
      entityType: 'User',
      entityId: userId,
      newData: { loginTime: new Date() },
      description: 'تم تسجيل الدخول',
      ...context
    })
  },
  
  async logout(userId: string, context: AuditContext) {
    await logAudit({
      action: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      newData: { logoutTime: new Date() },
      description: 'تم تسجيل الخروج',
      ...context
    })
  },
  
  async failedLogin(email: string, context: AuditContext) {
    const user = await db.user.findUnique({ where: { email } })
    
    if (user) {
      const newAttempts = user.failedLoginAttempts + 1
      const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null
      
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: lockUntil
        }
      })
      
      await logAudit({
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        newData: { failed: true, attempts: newAttempts },
        description: `محاولة دخول فاشلة (${newAttempts}/5)`,
        ...context
      })
    }
  },
  
  // ===================== EXPORT & PRINT =====================
  async logExport(entityType: string, format: string, count: number, context: AuditContext) {
    await logAudit({
      action: 'EXPORT',
      entityType,
      newData: { format, count, exportTime: new Date() },
      description: `تم تصدير ${count} ${entityType} بصيغة ${format}`,
      ...context
    })
  },
  
  async logPrint(entityType: string, entityId: string, context: AuditContext) {
    await logAudit({
      action: 'PRINT',
      entityType,
      entityId,
      newData: { printTime: new Date() },
      description: `تمت طباعة ${entityType}`,
      ...context
    })
  }
}

// ===================== CORE LOG FUNCTION =====================
async function logAudit(data: AuditEntry & AuditContext): Promise<void> {
  try {
    const userInfo = data.request ? extractUserInfo(data.request) : {}
    
    await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldData: data.oldData ? JSON.stringify(data.oldData) : null,
        newData: data.newData ? JSON.stringify(data.newData) : null,
        companyId: data.companyId || null,
        branchId: data.branchId || null,
        userId: data.userId || null,
        ipAddress: data.ipAddress || userInfo.ipAddress,
        userAgent: data.userAgent || userInfo.userAgent,
      }
    })
  } catch (error) {
    console.error('Audit log error:', error)
    // لا نريد أن يفشل الطلب بسبب خطأ في السجل
  }
}

// استخراج معلومات المستخدم من الطلب
function extractUserInfo(request: NextRequest): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  }
}

// ===================== QUERY FUNCTIONS =====================
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
    db.auditLog.count({ where })
  ])
  
  return { logs, total }
}

// إحصائيات التدقيق
export async function getAuditStats(companyId?: string) {
  const where = companyId ? { companyId } : {}
  
  const [totalLogs, todayLogs, actionCounts, entityTypeCounts] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.count({
      where: {
        ...where,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }),
    db.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true
    }),
    db.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true
    })
  ])
  
  return {
    totalLogs,
    todayLogs,
    actionCounts: Object.fromEntries(actionCounts.map(a => [a.action, a._count])),
    entityTypeCounts: Object.fromEntries(entityTypeCounts.map(e => [e.entityType, e._count]))
  }
}

// تصدير سجلات التدقيق
export async function exportAuditLogs(filters: any, format: 'json' | 'csv') {
  const { logs } = await getAuditLogs({ ...filters, limit: 10000 })
  
  if (format === 'json') {
    return JSON.stringify(logs, null, 2)
  }
  
  // CSV format
  const headers = ['التاريخ', 'العملية', 'النوع', 'المستخدم', 'الفرع', 'IP', 'التفاصيل']
  const rows = logs.map(log => [
    log.createdAt.toLocaleString('ar-SA'),
    log.action,
    log.entityType,
    log.User?.name || '-',
    log.Branch?.name || '-',
    log.ipAddress || '-',
    log.newData ? JSON.stringify(log.newData).substring(0, 100) : '-'
  ])
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
