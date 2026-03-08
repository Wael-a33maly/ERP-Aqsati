// ============================================
// Returns Service - خدمة المرتجعات
// ============================================

import { returnsRepository } from '@/repositories/returns.repository'
import { db } from '@/lib/db'
import { 
  ReturnQueryParams,
  CreateReturnInput,
  UpdateReturnInput
} from '@/models/returns.model'

export const returnsService = {
  // جلب المرتجعات
  async getReturns(params: ReturnQueryParams) {
    const { data, total } = await returnsRepository.findMany(params)
    
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

  // جلب مرتجع بالمعرف
  async getReturn(id: string) {
    return returnsRepository.findById(id)
  },

  // جلب عناصر مرتجع
  async getReturnItems(returnId: string) {
    return returnsRepository.getItems(returnId)
  },

  // إنشاء مرتجع
  async createReturn(data: CreateReturnInput) {
    // توليد رقم المرتجع
    const returnNumber = await returnsRepository.generateReturnNumber()

    // حساب الإجمالي من العناصر
    const total = data.items?.reduce((sum, item) => sum + item.total, 0) || data.total || 0

    const returnRecord = await returnsRepository.create({
      ...data,
      returnNumber,
      total
    })

    return returnRecord
  },

  // تحديث مرتجع
  async updateReturn(id: string, data: UpdateReturnInput) {
    return returnsRepository.update(id, data)
  },

  // حذف مرتجع
  async deleteReturn(id: string) {
    return returnsRepository.delete(id)
  },

  // الموافقة على مرتجع
  async approveReturn(id: string) {
    const returnRecord = await returnsRepository.findById(id)
    if (!returnRecord) {
      throw new Error('المرتجع غير موجود')
    }

    if (returnRecord.status !== 'pending') {
      throw new Error('لا يمكن الموافقة على هذا المرتجع')
    }

    return returnsRepository.update(id, { status: 'approved' })
  },

  // إكمال مرتجع
  async completeReturn(id: string) {
    const returnRecord = await returnsRepository.findById(id)
    if (!returnRecord) {
      throw new Error('المرتجع غير موجود')
    }

    if (returnRecord.status !== 'approved') {
      throw new Error('يجب الموافقة على المرتجع أولاً')
    }

    // إرجاع المنتجات للمخزون
    if (returnRecord.items) {
      for (const item of returnRecord.items) {
        const existingInventory = await db.inventory.findFirst({
          where: {
            productId: item.productId,
            warehouse: { companyId: returnRecord.companyId }
          }
        })

        if (existingInventory) {
          await db.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: { increment: item.quantity },
              updatedAt: new Date()
            }
          })
        }
      }
    }

    // إنشاء دفعة استرداد إذا كان هناك مبلغ
    if (returnRecord.total > 0 && returnRecord.customerId) {
      const paymentNumber = `REF-${Date.now()}`
      await db.payment.create({
        data: {
          paymentNumber,
          customerId: returnRecord.customerId,
          branchId: returnRecord.branchId,
          method: 'CASH',
          amount: -returnRecord.total, // مبلغ سالب للاسترداد
          notes: `استرداد مرتجع ${returnRecord.returnNumber}`,
          status: 'completed'
        }
      })
    }

    return returnsRepository.update(id, { status: 'completed' })
  }
}
