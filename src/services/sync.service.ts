// ============================================
// Sync Service - خدمة المزامنة
// ============================================

import { syncRepository } from '@/repositories/sync.repository'
import { SyncRequest, SyncResponse, SyncStatusResponse } from '@/models/sync.model'

export const syncService = {
  // معالجة طلب المزامنة
  async processSync(request: SyncRequest): Promise<SyncResponse> {
    const { operationType, data, operationId } = request

    try {
      let result

      switch (operationType) {
        case 'create_customer':
          result = await syncRepository.createCustomer(data)
          return {
            success: true,
            operationId,
            result: { customerId: result.id },
            syncedAt: new Date().toISOString()
          }

        case 'update_customer':
          result = await syncRepository.updateCustomer(data)
          return {
            success: true,
            operationId,
            result: { customerId: result.id },
            syncedAt: new Date().toISOString()
          }

        case 'create_invoice':
          // التحقق من وجود الفاتورة
          const existingInvoice = await syncRepository.findInvoiceByNumber((data as any).invoiceNumber)
          if (existingInvoice) {
            return {
              success: true,
              operationId,
              result: { invoiceId: existingInvoice.id, duplicate: true },
              syncedAt: new Date().toISOString()
            }
          }
          result = await syncRepository.createInvoice(data as any)
          return {
            success: true,
            operationId,
            result: { invoiceId: result.id },
            syncedAt: new Date().toISOString()
          }

        case 'create_payment':
          // التحقق من وجود الدفعة
          const existingPayment = await syncRepository.findPaymentByNumber((data as any).paymentNumber)
          if (existingPayment) {
            return {
              success: true,
              operationId,
              result: { paymentId: existingPayment.id, duplicate: true },
              syncedAt: new Date().toISOString()
            }
          }
          result = await syncRepository.createPayment(data as any)
          // تحديث حالة الفاتورة
          if ((data as any).invoiceId) {
            await syncRepository.updateInvoiceAfterPayment((data as any).invoiceId, (data as any).amount)
          }
          return {
            success: true,
            operationId,
            result: { paymentId: result.id },
            syncedAt: new Date().toISOString()
          }

        case 'collect_installment':
          result = await syncRepository.updateInstallmentPayment(data as any)
          return {
            success: true,
            operationId,
            result: { installmentId: result.id },
            syncedAt: new Date().toISOString()
          }

        case 'update_inventory':
          await syncRepository.updateInventory(data as any)
          await syncRepository.createInventoryMovement(data as any)
          return {
            success: true,
            operationId,
            result: { success: true },
            syncedAt: new Date().toISOString()
          }

        default:
          return {
            success: false,
            error: 'Unknown operation type'
          }
      }
    } catch (error: any) {
      // التحقق من conflict
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'Data conflict detected',
          conflict: true,
        }
      }

      return {
        success: false,
        error: error.message,
      }
    }
  },

  // جلب حالة المزامنة
  async getSyncStatus(agentId?: string): Promise<SyncStatusResponse> {
    const pendingOperations = await syncRepository.findPendingOperations(agentId)

    return {
      success: true,
      pendingCount: pendingOperations.length,
      pendingOperations: pendingOperations.map(op => ({
        id: op.id,
        action: op.action,
        entityType: op.entityType,
        createdAt: op.createdAt
      }))
    }
  },
}
