/**
 * Subscription Service
 * خدمات الاشتراكات
 */

import { subscriptionRepository } from '@/repositories/subscription.repository'
import type { SubscriptionInput, SubscriptionPaymentInput } from '@/models/subscription.model'

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
  }
}
