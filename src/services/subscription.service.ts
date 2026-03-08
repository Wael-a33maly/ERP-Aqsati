/**
 * Subscription Service
 * خدمات الاشتراكات
 */

import { subscriptionRepository } from '@/repositories/subscription.repository'
import type { SubscriptionInput, SubscriptionPaymentInput, PaymentTransactionQueryParams, CreatePaymentTransactionInput, UpdatePaymentTransactionInput } from '@/models/subscription.model'
import { PAYMENT_METHODS } from '@/models/subscription.model'

// توليد رقم مرجعي
function generateReferenceNumber(method: string): string {
  const prefix = method.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// تعليمات الدفع
function getPaymentInstructions(method: string, metadata: string | undefined, refNumber: string): string {
  try {
    const data = metadata ? JSON.parse(metadata) : {}
    
    switch (method) {
      case 'FAWRY':
        return `للدفع عبر فوري:\n1. اذهب لأقرب منفذ فوري\n2. اختر "خدمات الدفع الإلكتروني"\n3. أدخل الرقم المرجعي: ${refNumber}\n4. ادفع المبلغ المطلوب\n5. احتفظ بالإيصال`
      
      case 'INSTAPAY':
        return `للدفع عبر انستا باي:\n1. افتح تطبيق انستا باي\n2. اضغط على رابط الدفع المرسل\n3. أكد عملية الدفع\nالرقم المرجعي: ${refNumber}`
      
      case 'VODAFONE_CASH':
        return `للدفع عبر فودافون كاش:\n1. افتح تطبيق أنا فودافون\n2. اختر فودافون كاش\n3. حول المبلغ على الرقم: ${data.walletNumber}\n4. احتفظ بإيصال التحويل\nالرقم المرجعي: ${refNumber}`
      
      case 'ORANGE_MONEY':
        return `للدفع عبر أورنج موني:\n1. افتح تطبيق أورنج\n2. اختر أورنج موني\n3. حول المبلغ على الرقم: ${data.walletNumber}\n4. احتفظ بإيصال التحويل\nالرقم المرجعي: ${refNumber}`
      
      case 'ETISALAT_CASH':
        return `للدفع عبر اتصالات كاش:\n1. افتح تطبيق أنا اتصالات\n2. اختر اتصالات كاش\n3. حول المبلغ على الرقم: ${data.walletNumber}\n4. احتفظ بإيصال التحويل\nالرقم المرجعي: ${refNumber}`
      
      case 'BANK_TRANSFER':
        return `للدفع عبر التحويل البنكي:\nالبنك: ${data.bankName}\nرقم الحساب: ${data.accountNumber}\nIBAN: ${data.iban}\nاسم الحساب: ${data.accountName}\nالرقم المرجعي: ${refNumber}`
      
      default:
        return `الرقم المرجعي: ${refNumber}`
    }
  } catch {
    return `الرقم المرجعي: ${refNumber}`
  }
}

export const subscriptionService = {
  async getSubscriptions(params: any) {
    return subscriptionRepository.findSubscriptions(params)
  },

  async getSubscriptionById(id: string) {
    const subscription = await subscriptionRepository.findSubscriptionById(id)
    if (!subscription) {
      throw new Error('الاشتراك غير موجود')
    }
    return subscription
  },

  async getActiveSubscription(companyId: string) {
    return subscriptionRepository.findActiveSubscription(companyId)
  },

  async createSubscription(data: SubscriptionInput) {
    return subscriptionRepository.createSubscription(data)
  },

  async updateSubscription(id: string, data: any) {
    return subscriptionRepository.updateSubscription(id, data)
  },

  async cancelSubscription(id: string) {
    return subscriptionRepository.cancelSubscription(id)
  },

  async createPayment(data: SubscriptionPaymentInput) {
    return subscriptionRepository.createPaymentTransaction(data)
  },

  async getPlans() {
    const { db } = await import('@/lib/db')
    return db.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    })
  },

  // ============ Payment Transactions ============
  getPaymentMethods() {
    return PAYMENT_METHODS
  },

  async getPaymentTransactions(params: PaymentTransactionQueryParams) {
    return subscriptionRepository.findPaymentTransactions(params)
  },

  async createPaymentTransaction(data: CreatePaymentTransactionInput) {
    const { db } = await import('@/lib/db')
    
    // التحقق من الاشتراك
    const subscription = await db.subscription.findUnique({
      where: { id: data.subscriptionId },
      include: { plan: true }
    })

    if (!subscription) {
      throw new Error('الاشتراك غير موجود')
    }

    // إنشاء رقم مرجعي فريد
    const referenceNumber = generateReferenceNumber(data.paymentMethod)

    // بيانات الدفع حسب الطريقة
    let paymentData: Record<string, unknown> = {
      subscriptionId: data.subscriptionId,
      companyId: data.companyId || subscription.companyId,
      amount: data.amount || subscription.finalPrice,
      currency: data.currency || 'EGP',
      status: 'pending',
      paymentMethod: data.paymentMethod,
      referenceNumber
    }

    // محاكاة بوابات الدفع المصرية
    switch (data.paymentMethod) {
      case 'FAWRY':
        paymentData = {
          ...paymentData,
          paymentUrl: `https://www.fawry.com/pay/${referenceNumber}`,
          qrCode: `fawry://pay/${referenceNumber}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          metadata: JSON.stringify({
            merchantCode: 'ERP_SAAS',
            merchantRefNum: referenceNumber,
            paymentMethod: 'PAYATFAWRY'
          })
        }
        break

      case 'INSTAPAY':
        paymentData = {
          ...paymentData,
          paymentUrl: `https://ipn.instapay.com.sa/pay/${referenceNumber}`,
          metadata: JSON.stringify({
            iban: 'SA0380000000000000000000',
            accountName: 'ERP SAAS'
          })
        }
        break

      case 'VODAFONE_CASH':
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            walletNumber: '01012345678',
            instructions: 'قم بالتحويل على المحفظة ثم أرسل إيصال التحويل'
          })
        }
        break

      case 'ORANGE_MONEY':
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            walletNumber: '01212345678',
            instructions: 'قم بالتحويل على المحفظة ثم أرسل إيصال التحويل'
          })
        }
        break

      case 'ETISALAT_CASH':
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            walletNumber: '01112345678',
            instructions: 'قم بالتحويل على المحفظة ثم أرسل إيصال التحويل'
          })
        }
        break

      case 'BANK_TRANSFER':
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            bankName: 'البنك الأهلي المصري',
            accountNumber: '1234567890123456',
            iban: 'EG3800020001234567890123456',
            accountName: 'ERP SAAS Company',
            instructions: 'قم بالتحويل البنكي وأرسل إيصال التحويل'
          })
        }
        break

      case 'CASH':
        paymentData = {
          ...paymentData,
          status: 'pending',
          notes: 'الدفع النقدي - في انتظار التأكيد من الإدارة'
        }
        break
    }

    const payment = await subscriptionRepository.createPaymentTransactionWithMetadata(paymentData)

    return {
      payment,
      instructions: getPaymentInstructions(data.paymentMethod, paymentData.metadata as string, referenceNumber)
    }
  },

  async updatePaymentTransaction(data: UpdatePaymentTransactionInput) {
    const payment = await subscriptionRepository.findPaymentTransactionById(data.id)
    if (!payment) {
      throw new Error('عملية الدفع غير موجودة')
    }

    if (data.action === 'confirm') {
      // تأكيد الدفع
      const updatedPayment = await subscriptionRepository.updatePaymentTransaction(data.id, {
        status: 'completed',
        transactionId: data.transactionId,
        paidAt: new Date(),
        notes: data.notes
      })

      // تحديث حالة الاشتراك
      await subscriptionRepository.updateSubscriptionStatus(payment.subscriptionId, {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })

      // تحديث حالة الشركة
      await subscriptionRepository.updateCompanySubscriptionStatus(payment.companyId, 'active')

      return { payment: updatedPayment, message: 'تم تأكيد الدفع وتفعيل الاشتراك' }
    }

    if (data.action === 'reject') {
      const updatedPayment = await subscriptionRepository.updatePaymentTransaction(data.id, {
        status: 'failed',
        notes: data.notes
      })
      return { payment: updatedPayment, message: 'تم رفض عملية الدفع' }
    }

    if (data.action === 'refund') {
      const updatedPayment = await subscriptionRepository.updatePaymentTransaction(data.id, {
        status: 'refunded',
        notes: data.notes
      })
      return { payment: updatedPayment, message: 'تم استرداد المبلغ' }
    }

    // تحديث عادي
    const updatedPayment = await subscriptionRepository.updatePaymentTransaction(data.id, data)
    return { payment: updatedPayment }
  }
}
