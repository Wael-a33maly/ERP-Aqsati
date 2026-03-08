/**
 * Payment Link Service
 * خدمات روابط الدفع
 */

import { paymentLinkRepository } from '@/repositories/payment-link.repository'
import type { PaymentLinkInput } from '@/models/payment-link.model'

export const paymentLinkService = {
  async getPaymentLinks(params: any) {
    return paymentLinkRepository.findPaymentLinks(params)
  },

  async getPaymentLinkById(id: string) {
    const link = await paymentLinkRepository.findPaymentLinkById(id)
    if (!link) {
      throw new Error('رابط الدفع غير موجود')
    }
    return link
  },

  async getPaymentLinkByCode(code: string) {
    const link = await paymentLinkRepository.findPaymentLinkByCode(code)
    if (!link) {
      throw new Error('رابط الدفع غير موجود')
    }

    // Check if expired
    if (link.status === 'active') {
      const createdAt = new Date(link.createdAt)
      const expiresAt = new Date(createdAt)
      expiresAt.setDate(expiresAt.getDate() + (link.expiresInDays || 7))

      if (new Date() > expiresAt) {
        await paymentLinkRepository.expirePaymentLink(link.id)
        throw new Error('رابط الدفع منتهي الصلاحية')
      }
    }

    return link
  },

  async createPaymentLink(data: PaymentLinkInput) {
    return paymentLinkRepository.createPaymentLink(data)
  },

  async updatePaymentLink(id: string, data: any) {
    return paymentLinkRepository.updatePaymentLink(id, data)
  },

  async cancelPaymentLink(id: string) {
    return paymentLinkRepository.updatePaymentLink(id, { status: 'cancelled' })
  },

  async processPayment(linkId: string, paymentData: any) {
    const link = await this.getPaymentLinkById(linkId)

    if (link.status !== 'active') {
      throw new Error('رابط الدفع غير نشط')
    }

    if (link.uses >= link.maxUses) {
      throw new Error('تم استخدام رابط الدفع الحد الأقصى من المرات')
    }

    // Increment uses
    await paymentLinkRepository.incrementUses(linkId)

    // If max uses reached, mark as paid
    if (link.uses + 1 >= link.maxUses) {
      await paymentLinkRepository.updatePaymentLink(linkId, { status: 'paid' })
    }

    return { success: true, link }
  }
}
