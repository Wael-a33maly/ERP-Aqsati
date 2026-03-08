/**
 * Payment Gateway Service
 * خدمات بوابات الدفع
 */

import { paymentGatewayRepository } from '@/repositories/payment-gateway.repository'
import { PaymentGatewayQueryParams, CreatePaymentGatewayInput, UpdatePaymentGatewayInput } from '@/models/payment-gateway.model'

export const paymentGatewayService = {
  /**
   * جلب بوابات الدفع
   */
  async getGateways(params: PaymentGatewayQueryParams) {
    const { companyId } = params

    if (!companyId) {
      return { gateways: [] }
    }

    const gateways = await paymentGatewayRepository.findMany(companyId)

    // Mask sensitive data for security
    const maskedGateways = gateways.map((gateway) => ({
      ...gateway,
      merchantSecret: gateway.merchantSecret ? '••••••••' : null,
      apiSecret: gateway.apiSecret ? '••••••••' : null,
      webhookSecret: gateway.webhookSecret ? '••••••••' : null,
    }))

    return { gateways: maskedGateways }
  },

  /**
   * إنشاء بوابة دفع
   */
  async createGateway(data: CreatePaymentGatewayInput) {
    const { companyId, gatewayType, isDefault } = data

    // Check if gateway already exists for this company
    const existing = await paymentGatewayRepository.findByCompanyAndType(companyId, gatewayType)

    if (existing) {
      return {
        success: false,
        error: 'Gateway of this type already exists for this company',
      }
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await paymentGatewayRepository.unsetDefault(companyId)
    }

    const gateway = await paymentGatewayRepository.create(data)

    return { success: true, gateway }
  },

  /**
   * تحديث بوابة دفع
   */
  async updateGateway(data: UpdatePaymentGatewayInput) {
    const { id, companyId, isDefault, ...updateData } = data

    if (!id || !companyId) {
      return {
        success: false,
        error: 'Gateway ID and Company ID are required',
      }
    }

    // Verify the gateway belongs to this company
    const exists = await paymentGatewayRepository.exists(companyId, id)

    if (!exists) {
      return {
        success: false,
        error: 'Payment gateway not found',
      }
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await paymentGatewayRepository.unsetDefault(companyId, id)
    }

    // Filter out undefined values
    const dataToUpdate: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'nameAr', 'merchantId', 'merchantSecret', 'apiKey', 'apiSecret',
      'walletNumber', 'accountNumber', 'bankCode', 'callbackUrl', 'webhookSecret',
      'isLive', 'isActive', 'isDefault', 'feesPercent', 'feesFixed',
      'minAmount', 'maxAmount', 'settlementDays', 'settings',
    ]

    for (const field of allowedFields) {
      if ((updateData as Record<string, unknown>)[field] !== undefined) {
        dataToUpdate[field] = (updateData as Record<string, unknown>)[field]
      }
    }

    dataToUpdate.isDefault = isDefault
    dataToUpdate.updatedAt = new Date()

    const gateway = await paymentGatewayRepository.update(id, dataToUpdate)

    return { success: true, gateway }
  },

  /**
   * حذف بوابة دفع
   */
  async deleteGateway(id: string, companyId: string) {
    if (!id || !companyId) {
      return {
        success: false,
        error: 'Gateway ID and Company ID are required',
      }
    }

    // Verify the gateway belongs to this company
    const exists = await paymentGatewayRepository.exists(companyId, id)

    if (!exists) {
      return {
        success: false,
        error: 'Payment gateway not found',
      }
    }

    await paymentGatewayRepository.delete(id)

    return { success: true }
  },
}
