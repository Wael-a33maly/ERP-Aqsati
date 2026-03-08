// ============================================
// Returns Repository - مستودع المرتجعات
// ============================================

import { db } from '@/lib/db'
import { 
  ReturnQueryParams,
  CreateReturnInput,
  UpdateReturnInput,
  ReturnWithDetails,
  CreateReturnItemInput
} from '@/models/returns.model'

export const returnsRepository = {
  // توليد رقم مرتجع جديد
  async generateReturnNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefixPattern = `RTN-${year}-`

    const lastReturn = await db.return.findFirst({
      where: { returnNumber: { startsWith: prefixPattern } },
      orderBy: { returnNumber: 'desc' },
      select: { returnNumber: true }
    })

    let sequence = 1
    if (lastReturn) {
      const parts = lastReturn.returnNumber.split('-')
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10)
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1
        }
      }
    }

    return `RTN-${year}-${String(sequence).padStart(6, '0')}`
  },

  // جلب المرتجعات
  async findMany(params: ReturnQueryParams): Promise<{ data: ReturnWithDetails[]; total: number }> {
    const skip = ((params.page || 1) - 1) * (params.limit || 10)
    const where: any = {}

    if (params.search) {
      where.OR = [
        { returnNumber: { contains: params.search } },
        { customer: { name: { contains: params.search } } }
      ]
    }
    if (params.status) where.status = params.status
    if (params.type) where.type = params.type
    if (params.customerId) where.customerId = params.customerId
    if (params.invoiceId) where.invoiceId = params.invoiceId
    if (params.companyId) where.companyId = params.companyId
    if (params.branchId) where.branchId = params.branchId

    const [returns, total] = await Promise.all([
      db.return.findMany({
        where,
        skip,
        take: params.limit || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          branch: { select: { id: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          items: { select: { id: true, total: true } }
        }
      }),
      db.return.count({ where })
    ])

    return { data: returns as ReturnWithDetails[], total }
  },

  // جلب مرتجع بالمعرف
  async findById(id: string) {
    return db.return.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
        invoice: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    })
  },

  // إنشاء مرتجع
  async create(data: CreateReturnInput & { returnNumber: string }) {
    const returnRecord = await db.return.create({
      data: {
        returnNumber: data.returnNumber,
        customerId: data.customerId,
        branchId: data.branchId || null,
        invoiceId: data.invoiceId || null,
        agentId: data.agentId || null,
        type: data.type || 'PARTIAL',
        reason: data.reason || null,
        total: data.total || 0,
        status: 'pending'
      }
    })

    // إنشاء عناصر المرتجع
    if (data.items && data.items.length > 0) {
      await db.returnItem.createMany({
        data: data.items.map(item => ({
          returnId: returnRecord.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxAmount: item.taxAmount || 0,
          total: item.total,
          reason: item.reason || null
        }))
      })
    }

    return returnRecord
  },

  // تحديث مرتجع
  async update(id: string, data: UpdateReturnInput) {
    return db.return.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.reason !== undefined && { reason: data.reason }),
        updatedAt: new Date()
      }
    })
  },

  // حذف مرتجع
  async delete(id: string) {
    // حذف العناصر أولاً
    await db.returnItem.deleteMany({
      where: { returnId: id }
    })

    return db.return.delete({
      where: { id }
    })
  },

  // جلب عناصر مرتجع
  async getItems(returnId: string) {
    return db.returnItem.findMany({
      where: { returnId },
      include: {
        product: { select: { id: true, name: true, sku: true } }
      }
    })
  },

  // إضافة عنصر للمرتجع
  async addItem(returnId: string, item: CreateReturnItemInput) {
    return db.returnItem.create({
      data: {
        returnId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxAmount: item.taxAmount || 0,
        total: item.total,
        reason: item.reason || null
      }
    })
  }
}
