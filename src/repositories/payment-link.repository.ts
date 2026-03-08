/**
 * Payment Link Repository
 * مستودع بيانات روابط الدفع
 */

import { db } from '@/lib/db'
import type { PaymentLinkQueryParams, PaymentLinkInput } from '@/models/payment-link.model'

export const paymentLinkRepository = {
  async findPaymentLinks(params: PaymentLinkQueryParams) {
    const { page = 1, limit = 20, companyId, status } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (status) where.status = status

    const [links, total] = await Promise.all([
      db.paymentLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Customer: { select: { id: true, name: true, phone: true } }
        }
      }),
      db.paymentLink.count({ where })
    ])

    return { data: links, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findPaymentLinkById(id: string) {
    return db.paymentLink.findUnique({
      where: { id },
      include: {
        Customer: true,
        Invoice: true
      }
    })
  },

  async findPaymentLinkByCode(code: string) {
    return db.paymentLink.findUnique({
      where: { code },
      include: {
        Customer: true,
        Invoice: true
      }
    })
  },

  async createPaymentLink(data: PaymentLinkInput) {
    // Generate unique code
    const code = `PL${Date.now().toString(36).toUpperCase()}`

    return db.paymentLink.create({
      data: {
        code,
        companyId: data.companyId,
        amount: data.amount,
        currency: data.currency || 'EGP',
        description: data.description,
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        expiresInDays: data.expiresInDays || 7,
        maxUses: data.maxUses || 1,
        metadata: data.metadata || {},
        status: 'active'
      }
    })
  },

  async updatePaymentLink(id: string, data: any) {
    return db.paymentLink.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async incrementUses(id: string) {
    return db.paymentLink.update({
      where: { id },
      data: {
        uses: { increment: 1 },
        lastUsedAt: new Date()
      }
    })
  },

  async expirePaymentLink(id: string) {
    return db.paymentLink.update({
      where: { id },
      data: { status: 'expired' }
    })
  }
}
