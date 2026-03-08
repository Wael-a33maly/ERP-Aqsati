/**
 * Egyptian Payment Service
 * خدمات بوابات الدفع المصرية
 */

import { createPaymentManager, PaymentMethod } from '@/lib/egyptian-payments'
import { db } from '@/lib/db'
import type { EgyptianPaymentInput, EgyptianPaymentStatusInput, EgyptianRefundInput, PaymentResult } from '@/models/egyptian-payment.model'

export const egyptianPaymentService = {
  /**
   * إنشاء دفعة جديدة
   */
  async createPayment(data: EgyptianPaymentInput): Promise<PaymentResult> {
    const {
      method,
      amount,
      customerId,
      customerPhone,
      customerEmail,
      customerName,
      description,
      invoiceId,
      installmentId,
      companyId,
      branchId,
      userId
    } = data

    // التحقق من البيانات المطلوبة
    if (!method || !amount || !customerId) {
      return {
        success: false,
        error: 'البيانات غير مكتملة'
      }
    }

    // الحصول على معلومات العميل
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { name: true, phone: true }
    })

    if (!customer) {
      return {
        success: false,
        error: 'العميل غير موجود'
      }
    }

    // إنشاء مدير الدفع
    const paymentManager = createPaymentManager(companyId)

    // إنشاء طلب الدفع
    const paymentRequest = {
      amount: parseFloat(amount.toString()),
      currency: 'EGP',
      customerId,
      customerPhone: customerPhone || customer.phone || undefined,
      customerEmail,
      customerName: customerName || customer.name,
      description: description || 'دفعة عبر نظام أقساطي',
      referenceId: invoiceId || installmentId
    }

    const result = await paymentManager.createPayment(method as PaymentMethod, paymentRequest)

    // حفظ المعاملة في قاعدة البيانات
    if (result.success) {
      // يمكن إضافة سجل للمعاملة هنا
    }

    return result
  },

  /**
   * التحقق من حالة الدفعة
   */
  async checkStatus(data: EgyptianPaymentStatusInput): Promise<PaymentResult> {
    const { method, reference, companyId } = data

    if (!method || !reference) {
      return {
        success: false,
        error: 'البيانات غير مكتملة'
      }
    }

    const paymentManager = createPaymentManager(companyId)
    const result = await paymentManager.checkStatus(method, reference)

    return result
  },

  /**
   * استرداد دفعة (Refund)
   */
  async refundPayment(data: EgyptianRefundInput): Promise<PaymentResult> {
    const { method, referenceNumber, amount, reason, companyId } = data

    if (!method || !referenceNumber || !amount) {
      return {
        success: false,
        error: 'البيانات غير مكتملة'
      }
    }

    const paymentManager = createPaymentManager(companyId)
    const result = await paymentManager.refundPayment(method, referenceNumber, parseFloat(amount.toString()), reason)

    return result
  }
}
