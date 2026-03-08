/**
 * Subscription Repository
 * مستودع بيانات الاشتراكات
 */

import { db } from '@/lib/db'
import type { SubscriptionQueryParams, SubscriptionInput, SubscriptionPaymentInput, PaymentTransactionQueryParams, CreatePaymentTransactionInput } from '@/models/subscription.model'

export const subscriptionRepository = {
  async findSubscriptions(params: SubscriptionQueryParams) {
    const { page = 1, limit = 20, status, planId } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (planId) where.planId = planId

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Company: { select: { id: true, name: true, nameAr: true } },
          Plan: true
        }
      }),
      db.subscription.count({ where })
    ])

    return { data: subscriptions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findSubscriptionById(id: string) {
    return db.subscription.findUnique({
      where: { id },
      include: {
        Company: true,
        Plan: true,
        PaymentTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })
  },

  async findActiveSubscription(companyId: string) {
    return db.subscription.findFirst({
      where: {
        companyId,
        status: { in: ['trial', 'active'] }
      },
      include: {
        Plan: true
      }
    })
  },

  async createSubscription(data: SubscriptionInput) {
    return db.subscription.create({
      data: {
        companyId: data.companyId,
        planId: data.planId,
        billingCycle: data.billingCycle,
        originalPrice: data.originalPrice,
        discountPercent: data.discountPercent || 0,
        finalPrice: data.finalPrice,
        currency: data.currency || 'EGP',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        trialEnd: data.trialEnd ? new Date(data.trialEnd) : undefined,
        status: 'active'
      }
    })
  },

  async updateSubscription(id: string, data: any) {
    return db.subscription.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async cancelSubscription(id: string) {
    return db.subscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    })
  },

  async createPaymentTransaction(data: SubscriptionPaymentInput) {
    return db.paymentTransaction.create({
      data: {
        subscriptionId: data.subscriptionId,
        companyId: data.companyId,
        amount: data.amount,
        currency: data.currency || 'EGP',
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        referenceNumber: data.referenceNumber,
        status: 'completed',
        paidAt: new Date()
      }
    })
  },

  // ============ Payment Transactions ============
  async findPaymentTransactions(params: PaymentTransactionQueryParams) {
    const where: any = {}
    if (params.companyId) where.companyId = params.companyId
    if (params.subscriptionId) where.subscriptionId = params.subscriptionId

    return db.paymentTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  },

  async findPaymentTransactionById(id: string) {
    return db.paymentTransaction.findUnique({
      where: { id },
      include: {
        Subscription: { include: { Plan: true } }
      }
    })
  },

  async createPaymentTransactionWithMetadata(data: any) {
    return db.paymentTransaction.create({ data })
  },

  async updatePaymentTransaction(id: string, data: any) {
    return db.paymentTransaction.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async updateSubscriptionStatus(id: string, data: any) {
    return db.subscription.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async updateCompanySubscriptionStatus(companyId: string, status: string) {
    return db.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: status, updatedAt: new Date() }
    })
  }
}
