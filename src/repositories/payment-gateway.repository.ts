/**
 * Payment Gateway Repository
 * مستودع بوابات الدفع
 */

import { db } from '@/lib/db'
import { PaymentGatewayQueryParams, CreatePaymentGatewayInput, UpdatePaymentGatewayInput } from '@/models/payment-gateway.model'
import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'

export const paymentGatewayRepository = {
  /**
   * جلب بوابات الدفع لشركة
   */
  async findMany(companyId: string) {
    return db.companyPaymentGateway.findMany({
      where: { companyId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    })
  },

  /**
   * جلب بوابة دفع بالمعرف
   */
  async findById(id: string) {
    return db.companyPaymentGateway.findUnique({
      where: { id },
    })
  },

  /**
   * جلب بوابة دفع بالنوع والشركة
   */
  async findByCompanyAndType(companyId: string, gatewayType: string) {
    return db.companyPaymentGateway.findUnique({
      where: {
        companyId_gatewayType: {
          companyId,
          gatewayType,
        },
      },
    })
  },

  /**
   * إنشاء بوابة دفع
   */
  async create(data: CreatePaymentGatewayInput) {
    return db.companyPaymentGateway.create({
      data: {
        id: nanoid(),
        companyId: data.companyId,
        gatewayType: data.gatewayType,
        name: data.name,
        nameAr: data.nameAr,
        merchantId: data.merchantId,
        merchantSecret: data.merchantSecret,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        walletNumber: data.walletNumber,
        accountNumber: data.accountNumber,
        bankCode: data.bankCode,
        callbackUrl: data.callbackUrl,
        webhookSecret: data.webhookSecret,
        isLive: data.isLive ?? false,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        feesPercent: data.feesPercent ?? 0,
        feesFixed: data.feesFixed ?? 0,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        settlementDays: data.settlementDays ?? 1,
        settings: data.settings as Prisma.JsonValue,
      },
    })
  },

  /**
   * تحديث بوابة دفع
   */
  async update(id: string, data: Partial<UpdatePaymentGatewayInput>) {
    return db.companyPaymentGateway.update({
      where: { id },
      data: {
        ...data,
        settings: data.settings as Prisma.JsonValue,
        updatedAt: new Date(),
      },
    })
  },

  /**
   * حذف بوابة دفع
   */
  async delete(id: string) {
    return db.companyPaymentGateway.delete({
      where: { id },
    })
  },

  /**
   * تحديث البوابة الافتراضية
   */
  async unsetDefault(companyId: string, excludeId?: string) {
    const where: Prisma.CompanyPaymentGatewayWhereInput = {
      companyId,
      isDefault: true,
    }
    if (excludeId) {
      where.id = { not: excludeId }
    }

    return db.companyPaymentGateway.updateMany({
      where,
      data: { isDefault: false },
    })
  },

  /**
   * التحقق من وجود بوابة
   */
  async exists(companyId: string, id: string) {
    const gateway = await db.companyPaymentGateway.findFirst({
      where: { id, companyId },
    })
    return !!gateway
  },
}
