// ============================================
// Sync Repository - مستودع المزامنة
// ============================================

import { db } from '@/lib/db'
import { SyncData, SyncInvoiceData, SyncPaymentData, SyncInstallmentData, SyncInventoryData } from '@/models/sync.model'

export const syncRepository = {
  // ==================== Pending Operations ====================

  // جلب العمليات المعلقة
  async findPendingOperations(agentId?: string) {
    return db.offlineSync.findMany({
      where: {
        agentId: agentId || undefined,
        status: 'pending'
      },
      orderBy: { createdAt: 'asc' }
    })
  },

  // ==================== Customer Sync ====================

  // إنشاء عميل
  async createCustomer(data: SyncData & { code: string; name: string }) {
    return db.customer.create({
      data: {
        id: data.id || crypto.randomUUID(),
        companyId: data.companyId,
        branchId: data.branchId || null,
        code: data.code,
        name: data.name,
        nameAr: (data as any).nameAr,
        phone: (data as any).phone,
        phone2: (data as any).phone2,
        address: (data as any).address,
        nationalId: (data as any).nationalId,
        creditLimit: (data as any).creditLimit || 0,
        balance: (data as any).balance || 0,
        notes: (data as any).notes,
        active: true,
        updatedAt: new Date()
      }
    })
  },

  // تحديث عميل
  async updateCustomer(data: SyncData) {
    return db.customer.update({
      where: { id: data.id },
      data: {
        name: (data as any).name,
        phone: (data as any).phone,
        address: (data as any).address,
        notes: (data as any).notes,
        updatedAt: new Date()
      }
    })
  },

  // ==================== Invoice Sync ====================

  // التحقق من وجود الفاتورة
  async findInvoiceByNumber(invoiceNumber: string) {
    return db.invoice.findFirst({
      where: { invoiceNumber }
    })
  },

  // إنشاء فاتورة
  async createInvoice(data: SyncInvoiceData) {
    const invoice = await db.invoice.create({
      data: {
        id: data.id || crypto.randomUUID(),
        companyId: data.companyId,
        branchId: data.branchId || null,
        customerId: data.customerId || null,
        agentId: data.agentId || null,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: new Date(data.invoiceDate),
        type: data.type || 'cash',
        status: data.status || 'pending',
        subtotal: data.subtotal,
        discount: data.discount || 0,
        taxRate: data.taxRate || 0,
        taxAmount: data.taxAmount || 0,
        total: data.total,
        paidAmount: data.paidAmount || 0,
        remainingAmount: data.remainingAmount || data.total,
        notes: data.notes,
        updatedAt: new Date()
      }
    })

    // إنشاء عناصر الفاتورة
    if (data.items && data.items.length > 0) {
      await db.invoiceItem.createMany({
        data: data.items.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          invoiceId: invoice.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate || 0,
          taxAmount: item.taxAmount || 0,
          total: item.total,
          notes: item.notes
        }))
      })
    }

    return invoice
  },

  // ==================== Payment Sync ====================

  // التحقق من وجود الدفعة
  async findPaymentByNumber(paymentNumber: string) {
    return db.payment.findFirst({
      where: { paymentNumber }
    })
  },

  // إنشاء دفعة
  async createPayment(data: SyncPaymentData) {
    return db.payment.create({
      data: {
        id: data.id || crypto.randomUUID(),
        companyId: data.companyId,
        branchId: data.branchId || null,
        invoiceId: data.invoiceId || null,
        customerId: data.customerId || null,
        agentId: data.agentId || null,
        paymentNumber: data.paymentNumber,
        paymentDate: new Date(data.paymentDate),
        method: data.method || 'cash',
        amount: data.amount,
        reference: data.reference,
        notes: data.notes,
        status: 'completed',
        updatedAt: new Date()
      }
    })
  },

  // تحديث حالة الفاتورة بعد الدفع
  async updateInvoiceAfterPayment(invoiceId: string, amount: number) {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (invoice) {
      const newPaidAmount = invoice.paidAmount + amount
      const newRemaining = invoice.total - newPaidAmount

      return db.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemaining),
          status: newRemaining <= 0 ? 'paid' : 'partial',
          updatedAt: new Date()
        }
      })
    }
    return null
  },

  // ==================== Installment Sync ====================

  // تحديث القسط
  async updateInstallmentPayment(data: SyncInstallmentData) {
    const installment = await db.installment.update({
      where: { id: data.installmentId },
      data: {
        paidAmount: { increment: data.amount },
        remainingAmount: { decrement: data.amount },
        status: data.remainingAmount <= 0 ? 'paid' : 'partial',
        paidDate: new Date(),
        updatedAt: new Date()
      }
    })

    // إنشاء سجل الدفع
    await db.installmentPayment.create({
      data: {
        id: crypto.randomUUID(),
        installmentId: data.installmentId!,
        agentId: data.agentId || null,
        paymentDate: new Date(),
        amount: data.amount,
        method: data.method || 'cash',
        reference: data.reference,
        notes: data.notes
      }
    })

    return installment
  },

  // ==================== Inventory Sync ====================

  // جلب المخزون الحالي
  async findInventory(productId: string, warehouseId: string) {
    return db.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId
        }
      }
    })
  },

  // تحديث المخزون
  async updateInventory(data: SyncInventoryData) {
    const existing = await this.findInventory(data.productId!, data.warehouseId!)

    if (existing) {
      return db.inventory.update({
        where: { id: existing.id },
        data: {
          quantity: data.quantity,
          updatedAt: new Date()
        }
      })
    } else {
      return db.inventory.create({
        data: {
          id: crypto.randomUUID(),
          productId: data.productId!,
          warehouseId: data.warehouseId!,
          quantity: data.quantity,
          minQuantity: data.minQuantity || 0,
          maxQuantity: data.maxQuantity || null,
          updatedAt: new Date()
        }
      })
    }
  },

  // تسجيل حركة المخزون
  async createInventoryMovement(data: SyncInventoryData) {
    return db.inventoryMovement.create({
      data: {
        id: crypto.randomUUID(),
        productId: data.productId!,
        warehouseId: data.warehouseId!,
        type: data.movementType || 'adjustment',
        quantity: data.quantityChange || data.quantity,
        referenceType: 'offline_sync',
        referenceId: data.syncId || null,
        notes: data.notes,
        createdBy: data.agentId || null,
        createdAt: new Date()
      }
    })
  },
}
