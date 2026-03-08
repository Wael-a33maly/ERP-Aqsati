// ============================================
// Payment Repository - مستودع المدفوعات
// ============================================

import { db } from '@/lib/db'
import { 
  PaymentQueryParams,
  CreatePaymentInput,
  UpdatePaymentInput,
  PaymentWithDetails
} from '@/models/payment.model'

export const paymentRepository = {
  // توليد رقم دفعة جديد
  async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefixPattern = `PAY-${year}-`

    const lastPayment = await db.payment.findFirst({
      where: { paymentNumber: { startsWith: prefixPattern } },
      orderBy: { paymentNumber: 'desc' },
      select: { paymentNumber: true }
    })

    let sequence = 1
    if (lastPayment) {
      const parts = lastPayment.paymentNumber.split('-')
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10)
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1
        }
      }
    }

    return `PAY-${year}-${String(sequence).padStart(6, '0')}`
  },

  // جلب المدفوعات
  async findMany(params: PaymentQueryParams): Promise<{ data: PaymentWithDetails[]; total: number }> {
    const skip = ((params.page || 1) - 1) * (params.limit || 10)
    const where: any = {}

    if (params.search) {
      where.OR = [
        { paymentNumber: { contains: params.search } },
        { Customer: { name: { contains: params.search } } }
      ]
    }
    if (params.method) where.method = params.method
    if (params.status) where.status = params.status
    if (params.customerId) where.customerId = params.customerId
    if (params.invoiceId) where.invoiceId = params.invoiceId
    if (params.companyId) where.companyId = params.companyId
    if (params.branchId) where.branchId = params.branchId

    if (params.startDate || params.endDate) {
      where.paymentDate = {}
      if (params.startDate) where.paymentDate.gte = params.startDate
      if (params.endDate) where.paymentDate.lte = params.endDate
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: params.limit || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          Customer: { select: { id: true, name: true, phone: true, companyId: true } },
          Branch: { select: { id: true, name: true } },
          User: { select: { id: true, name: true } }
        }
      }),
      db.payment.count({ where })
    ])

    return { data: payments as PaymentWithDetails[], total }
  },

  // جلب دفعة بالمعرف
  async findById(id: string) {
    return db.payment.findUnique({
      where: { id },
      include: {
        Customer: true,
        Branch: true,
        Invoice: true
      }
    })
  },

  // إنشاء دفعة
  async create(data: CreatePaymentInput & { paymentNumber: string; companyId?: string }) {
    return db.payment.create({
      data: {
        paymentNumber: data.paymentNumber,
        customerId: data.customerId,
        branchId: data.branchId || null,
        companyId: data.companyId || null,
        invoiceId: data.invoiceId || null,
        agentId: data.agentId || null,
        method: data.method || 'CASH',
        amount: data.amount || 0,
        reference: data.reference || null,
        notes: data.notes || null,
        status: 'completed'
      },
      include: {
        Customer: { select: { companyId: true, branchId: true } }
      }
    })
  },

  // تحديث دفعة
  async update(id: string, data: UpdatePaymentInput) {
    return db.payment.update({
      where: { id },
      data: {
        ...(data.method && { method: data.method }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.reference !== undefined && { reference: data.reference }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
        updatedAt: new Date()
      }
    })
  },

  // حذف دفعة
  async delete(id: string) {
    return db.payment.delete({
      where: { id }
    })
  }
}
