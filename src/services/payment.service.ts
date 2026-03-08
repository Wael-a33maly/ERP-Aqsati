// ============================================
// Payment Service - خدمة المدفوعات
// ============================================

import { paymentRepository } from '@/repositories/payment.repository'
import { db } from '@/lib/db'
import { 
  PaymentQueryParams,
  CreatePaymentInput,
  UpdatePaymentInput
} from '@/models/payment.model'

export const paymentService = {
  // جلب المدفوعات
  async getPayments(params: PaymentQueryParams) {
    const { data, total } = await paymentRepository.findMany(params)
    
    return {
      data,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total,
        totalPages: Math.ceil(total / (params.limit || 10))
      }
    }
  },

  // جلب دفعة بالمعرف
  async getPayment(id: string) {
    return paymentRepository.findById(id)
  },

  // إنشاء دفعة
  async createPayment(data: CreatePaymentInput) {
    // توليد رقم الدفعة
    const paymentNumber = await paymentRepository.generatePaymentNumber()

    // جلب معلومات العميل
    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
      select: { companyId: true, branchId: true }
    })

    if (!customer) {
      throw new Error('العميل غير موجود')
    }

    const payment = await paymentRepository.create({
      ...data,
      paymentNumber,
      companyId: customer.companyId
    })

    // تحديث حالة الفاتورة إذا كانت مرتبطة
    if (data.invoiceId) {
      await this.updateInvoicePaymentStatus(data.invoiceId, data.amount)
    }

    // حساب العمولة للمندوب
    if (data.agentId && customer) {
      await this.calculateCommission(payment.id, data, customer)
    }

    return payment
  },

  // تحديث دفعة
  async updatePayment(id: string, data: UpdatePaymentInput) {
    return paymentRepository.update(id, data)
  },

  // حذف دفعة
  async deletePayment(id: string) {
    const payment = await paymentRepository.findById(id)
    if (!payment) {
      throw new Error('الدفعة غير موجودة')
    }

    // تحديث حالة الفاتورة
    if (payment.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: payment.invoiceId },
        select: { total: true, paidAmount: true }
      })

      if (invoice) {
        const newPaidAmount = invoice.paidAmount - payment.amount
        const newStatus = newPaidAmount >= invoice.total ? 'paid' : 
                         newPaidAmount > 0 ? 'partial' : 'pending'

        await db.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: invoice.total - newPaidAmount,
            status: newStatus
          }
        })
      }
    }

    return paymentRepository.delete(id)
  },

  // تحديث حالة دفع الفاتورة
  async updateInvoicePaymentStatus(invoiceId: string, amount: number) {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      select: { total: true, paidAmount: true }
    })

    if (invoice) {
      const newPaidAmount = invoice.paidAmount + amount
      const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'partial'

      await db.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: invoice.total - newPaidAmount,
          status: newStatus
        }
      })
    }
  },

  // حساب عمولة التحصيل
  async calculateCommission(paymentId: string, data: CreatePaymentInput, customer: any) {
    // جلب سياسة العمولة
    const policy = await db.commissionPolicy.findFirst({
      where: {
        companyId: customer.companyId,
        type: 'COLLECTION',
        isActive: true
      }
    })

    if (policy) {
      await db.agentCommission.create({
        data: {
          companyId: customer.companyId,
          branchId: data.branchId || customer.branchId,
          agentId: data.agentId!,
          policyId: policy.id,
          type: 'COLLECTION',
          referenceType: 'PAYMENT',
          referenceId: paymentId,
          baseAmount: data.amount,
          commissionRate: policy.baseRate,
          commissionAmount: (data.amount * policy.baseRate) / 100,
          status: 'pending'
        }
      })
    }
  }
}
