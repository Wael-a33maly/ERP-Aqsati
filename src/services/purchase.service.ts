/**
 * Purchase Service
 * خدمات المشتريات
 */

import { db } from '@/lib/db'
import {
  purchaseInvoiceRepository,
  purchaseReturnRepository,
  inventoryRepository,
} from '@/repositories/purchase.repository'
import {
  PurchaseInvoiceQueryParams,
  PurchaseReturnQueryParams,
  CreatePurchaseInvoiceInput,
  CreatePurchaseReturnInput,
} from '@/models/purchase.model'
import { Prisma } from '@prisma/client'

// ============ Purchase Invoice Service ============

export const purchaseInvoiceService = {
  /**
   * جلب فواتير المشتريات
   */
  async getInvoices(params: PurchaseInvoiceQueryParams) {
    const { page = 1, limit = 50 } = params

    const { invoices, total } = await purchaseInvoiceRepository.findMany(params)

    return {
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * جلب فاتورة مشتريات بالمعرف
   */
  async getInvoice(id: string) {
    const invoice = await purchaseInvoiceRepository.findById(id)

    if (!invoice) {
      return {
        success: false,
        error: 'فاتورة المشتريات غير موجودة',
      }
    }

    return {
      success: true,
      data: invoice,
    }
  },

  /**
   * إنشاء فاتورة مشتريات جديدة
   */
  async createInvoice(data: CreatePurchaseInvoiceInput) {
    // التحقق من البيانات المطلوبة
    if (!data.companyId || !data.warehouseId || !data.supplierId || !data.items?.length) {
      return {
        success: false,
        error: 'البيانات غير مكتملة',
      }
    }

    // توليد رقم الفاتورة
    const year = new Date().getFullYear()
    const prefix = `PI-${year}-`

    const lastInvoice = await purchaseInvoiceRepository.findLastByInvoiceNumberPrefix(
      data.companyId,
      prefix
    )

    let sequence = 1
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-')
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1
      }
    }

    const invoiceNumber = `${prefix}${String(sequence).padStart(6, '0')}`

    // حساب الإجماليات
    let subtotal = 0
    let totalTax = 0

    const itemsData = data.items.map((item) => {
      const itemTotal = item.quantity * item.unitPrice - (item.discount || 0)
      const itemTax = itemTotal * ((item.taxRate || data.taxRate || 0) / 100)
      subtotal += itemTotal
      totalTax += itemTax

      return {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || data.taxRate || 0,
        taxAmount: itemTax,
        total: itemTotal + itemTax,
      }
    })

    // حساب الخصم
    let discount = 0
    if (data.discountType === 'PERCENTAGE') {
      discount = subtotal * ((data.discountValue || 0) / 100)
    } else {
      discount = data.discountValue || 0
    }

    const total =
      subtotal - discount + totalTax + (data.additions || 0) - (data.deductions || 0)

    // إنشاء الفاتورة مع الأصناف في transaction واحد
    const invoice = await db.$transaction(async (tx) => {
      // إنشاء الفاتورة
      const newInvoice = await tx.purchaseInvoice.create({
        data: {
          invoiceNumber,
          companyId: data.companyId,
          branchId: data.branchId,
          warehouseId: data.warehouseId,
          supplierId: data.supplierId,
          supplierInvoiceNumber: data.supplierInvoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status || 'draft',
          subtotal,
          discountType: data.discountType || 'PERCENTAGE',
          discountValue: data.discountValue || 0,
          discount,
          taxRate: data.taxRate || 0,
          taxAmount: totalTax,
          additions: data.additions || 0,
          deductions: data.deductions || 0,
          total,
          paidAmount: data.paidAmount || 0,
          remainingAmount: total - (data.paidAmount || 0),
          notes: data.notes,
          createdBy: data.createdBy,
        },
        include: {
          PurchaseInvoiceItem: true,
        },
      })

      // إضافة الأصناف
      for (const item of itemsData) {
        await tx.purchaseInvoiceItem.create({
          data: {
            purchaseInvoiceId: newInvoice.id,
            ...item,
          },
        })
      }

      // إذا كانت الفاتورة معتمدة، تحديث المخزون ورصيد المورد
      if (data.status === 'approved') {
        await updateInventoryAndSupplier(tx, newInvoice, itemsData, data)
      }

      return newInvoice
    })

    return {
      success: true,
      data: invoice,
    }
  },

  /**
   * تحديث فاتورة مشتريات
   */
  async updateInvoice(id: string, data: Partial<CreatePurchaseInvoiceInput>) {
    // التحقق من وجود الفاتورة
    const existingInvoice = await purchaseInvoiceRepository.findById(id)

    if (!existingInvoice) {
      return {
        success: false,
        error: 'فاتورة المشتريات غير موجودة',
      }
    }

    if (existingInvoice.status === 'approved') {
      return {
        success: false,
        error: 'لا يمكن تعديل فاتورة معتمدة',
      }
    }

    const invoice = await purchaseInvoiceRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    })

    return {
      success: true,
      data: invoice,
    }
  },

  /**
   * حذف فاتورة مشتريات
   */
  async deleteInvoice(id: string) {
    const existingInvoice = await purchaseInvoiceRepository.findById(id)

    if (!existingInvoice) {
      return {
        success: false,
        error: 'فاتورة المشتريات غير موجودة',
      }
    }

    if (existingInvoice.status === 'approved') {
      return {
        success: false,
        error: 'لا يمكن حذف فاتورة معتمدة',
      }
    }

    await purchaseInvoiceRepository.delete(id)

    return {
      success: true,
      message: 'تم حذف فاتورة المشتريات بنجاح',
    }
  },
}

// ============ Purchase Return Service ============

export const purchaseReturnService = {
  /**
   * جلب مرتجعات المشتريات
   */
  async getReturns(params: PurchaseReturnQueryParams) {
    const { page = 1, limit = 50 } = params

    const { returns, total } = await purchaseReturnRepository.findMany(params)

    return {
      success: true,
      data: returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * جلب مرتجع مشتريات بالمعرف
   */
  async getReturn(id: string) {
    const returnData = await purchaseReturnRepository.findById(id)

    if (!returnData) {
      return {
        success: false,
        error: 'مرتجع المشتريات غير موجود',
      }
    }

    return {
      success: true,
      data: returnData,
    }
  },

  /**
   * إنشاء مرتجع مشتريات جديد
   */
  async createReturn(data: CreatePurchaseReturnInput) {
    if (!data.companyId || !data.warehouseId || !data.supplierId || !data.items?.length) {
      return {
        success: false,
        error: 'البيانات غير مكتملة',
      }
    }

    // توليد رقم المرتجع
    const year = new Date().getFullYear()
    const prefix = `PR-${year}-`

    const lastReturn = await purchaseReturnRepository.findLastByReturnNumberPrefix(
      data.companyId,
      prefix
    )

    let sequence = 1
    if (lastReturn) {
      const parts = lastReturn.returnNumber.split('-')
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1
      }
    }

    const returnNumber = `${prefix}${String(sequence).padStart(6, '0')}`

    // حساب الإجماليات
    let subtotal = 0
    let totalTax = 0

    const itemsData = data.items.map((item) => {
      const itemTotal = item.quantity * item.unitPrice
      const itemTax = itemTotal * ((item.taxRate || 0) / 100)
      subtotal += itemTotal
      totalTax += itemTax

      return {
        purchaseInvoiceItemId: item.purchaseInvoiceItemId,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: itemTax,
        total: itemTotal + itemTax,
        restocked: false,
      }
    })

    const total = subtotal + totalTax

    const purchaseReturn = await db.$transaction(async (tx) => {
      const newReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          companyId: data.companyId,
          branchId: data.branchId,
          warehouseId: data.warehouseId,
          supplierId: data.supplierId,
          purchaseInvoiceId: data.purchaseInvoiceId,
          returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
          status: data.status || 'draft',
          reason: data.reason,
          subtotal,
          taxAmount: totalTax,
          total,
          notes: data.notes,
          createdBy: data.createdBy,
        },
      })

      for (const item of itemsData) {
        await tx.purchaseReturnItem.create({
          data: {
            purchaseReturnId: newReturn.id,
            ...item,
          },
        })
      }

      // إذا كان المرتجع معتمد
      if (data.status === 'approved') {
        await processReturnApproval(tx, newReturn, itemsData, data)
      }

      return newReturn
    })

    return {
      success: true,
      data: purchaseReturn,
    }
  },

  /**
   * تحديث مرتجع مشتريات
   */
  async updateReturn(id: string, data: Partial<CreatePurchaseReturnInput>) {
    const existingReturn = await purchaseReturnRepository.findById(id)

    if (!existingReturn) {
      return {
        success: false,
        error: 'مرتجع المشتريات غير موجود',
      }
    }

    if (existingReturn.status === 'approved') {
      return {
        success: false,
        error: 'لا يمكن تعديل مرتجع معتمد',
      }
    }

    const returnData = await purchaseReturnRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    })

    return {
      success: true,
      data: returnData,
    }
  },

  /**
   * حذف مرتجع مشتريات
   */
  async deleteReturn(id: string) {
    const existingReturn = await purchaseReturnRepository.findById(id)

    if (!existingReturn) {
      return {
        success: false,
        error: 'مرتجع المشتريات غير موجود',
      }
    }

    if (existingReturn.status === 'approved') {
      return {
        success: false,
        error: 'لا يمكن حذف مرتجع معتمد',
      }
    }

    await purchaseReturnRepository.delete(id)

    return {
      success: true,
      message: 'تم حذف مرتجع المشتريات بنجاح',
    }
  },
}

// ============ Helper Functions ============

async function updateInventoryAndSupplier(
  tx: Prisma.TransactionClient,
  invoice: any,
  items: any[],
  data: CreatePurchaseInvoiceInput
) {
  // تحديث المخزون وإنشاء طبقات التكلفة
  for (const item of items) {
    // البحث عن سجل المخزون
    let inventory = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
        },
      },
    })

    const unitCost =
      (item.quantity * item.unitPrice - item.discount + item.taxAmount) / item.quantity

    if (inventory) {
      // تحديث المخزون الموجود
      const newQuantity = inventory.quantity + item.quantity
      const newTotalCost = inventory.totalCost + item.quantity * unitCost
      const newAvgCost = newTotalCost / newQuantity

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity,
          avgCost: newAvgCost,
          totalCost: newTotalCost,
          lastPurchaseDate: new Date(),
          lastPurchaseCost: unitCost,
        },
      })
    } else {
      // إنشاء سجل مخزون جديد
      await tx.inventory.create({
        data: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          quantity: item.quantity,
          avgCost: unitCost,
          totalCost: item.quantity * unitCost,
          lastPurchaseDate: new Date(),
          lastPurchaseCost: unitCost,
        },
      })
    }

    // إنشاء حركة مخزون
    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        warehouseId: invoice.warehouseId,
        type: 'IN',
        quantity: item.quantity,
        unitCost,
        totalCost: item.quantity * unitCost,
        referenceType: 'PURCHASE_INVOICE',
        referenceId: invoice.id,
        notes: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`,
        createdBy: data.createdBy,
      },
    })

    // إنشاء طبقة تكلفة (لـ FIFO)
    await tx.costLayer.create({
      data: {
        companyId: invoice.companyId,
        productId: item.productId,
        warehouseId: invoice.warehouseId,
        purchaseInvoiceId: invoice.id,
        layerDate: invoice.invoiceDate,
        quantity: item.quantity,
        remainingQuantity: item.quantity,
        unitCost,
        totalCost: item.quantity * unitCost,
      },
    })

    // تحديث تكلفة المنتج
    await tx.product.update({
      where: { id: item.productId },
      data: { costPrice: unitCost },
    })
  }

  // إنشاء حركة رصيد المورد
  const supplier = await tx.supplier.findUnique({
    where: { id: invoice.supplierId },
  })

  if (supplier) {
    const transNumber = `STR-${new Date().getFullYear()}-${Date.now()}`

    await tx.supplierTransaction.create({
      data: {
        companyId: invoice.companyId,
        supplierId: invoice.supplierId,
        transactionType: 'INVOICE',
        referenceType: 'PURCHASE_INVOICE',
        referenceId: invoice.id,
        transactionNumber: transNumber,
        transactionDate: invoice.invoiceDate,
        debit: invoice.total,
        credit: 0,
        balance: supplier.currentBalance + invoice.total,
        notes: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`,
      },
    })

    // تحديث رصيد المورد
    await tx.supplier.update({
      where: { id: invoice.supplierId },
      data: {
        currentBalance: supplier.currentBalance + invoice.total,
        balanceType: supplier.currentBalance + invoice.total > 0 ? 'CREDIT' : 'DEBIT',
      },
    })
  }
}

async function processReturnApproval(
  tx: Prisma.TransactionClient,
  returnData: any,
  items: any[],
  data: CreatePurchaseReturnInput
) {
  for (const item of items) {
    // تحديث المخزون (خصم الكمية المرتجعة)
    const inventory = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId: returnData.warehouseId,
        },
      },
    })

    if (inventory) {
      const newQuantity = Math.max(0, inventory.quantity - item.quantity)
      const costOfReturned = item.quantity * inventory.avgCost
      const newTotalCost = Math.max(0, inventory.totalCost - costOfReturned)
      const newAvgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity,
          totalCost: newTotalCost,
          avgCost: newAvgCost,
        },
      })

      // حركة مخزون
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: returnData.warehouseId,
          type: 'OUT',
          quantity: item.quantity,
          unitCost: inventory.avgCost,
          totalCost: item.quantity * inventory.avgCost,
          referenceType: 'PURCHASE_RETURN',
          referenceId: returnData.id,
          notes: `مرتجع مشتريات رقم ${returnData.returnNumber}`,
          createdBy: data.createdBy,
        },
      })

      // تحديث طبقة التكلفة
      const costLayer = await tx.costLayer.findFirst({
        where: {
          productId: item.productId,
          warehouseId: returnData.warehouseId,
          remainingQuantity: { gt: 0 },
        },
        orderBy: { layerDate: 'asc' },
      })

      if (costLayer) {
        const newRemaining = Math.max(0, costLayer.remainingQuantity - item.quantity)
        await tx.costLayer.update({
          where: { id: costLayer.id },
          data: {
            remainingQuantity: newRemaining,
            isExpired: newRemaining === 0,
          },
        })
      }
    }
  }

  // تحديث رصيد المورد
  const supplier = await tx.supplier.findUnique({
    where: { id: returnData.supplierId },
  })

  if (supplier) {
    await tx.supplierTransaction.create({
      data: {
        companyId: returnData.companyId,
        supplierId: returnData.supplierId,
        transactionType: 'RETURN',
        referenceType: 'PURCHASE_RETURN',
        referenceId: returnData.id,
        transactionNumber: `STR-${new Date().getFullYear()}-${Date.now()}`,
        transactionDate: returnData.returnDate,
        debit: 0,
        credit: returnData.total,
        balance: supplier.currentBalance - returnData.total,
        notes: `مرتجع مشتريات رقم ${returnData.returnNumber}`,
      },
    })

    await tx.supplier.update({
      where: { id: returnData.supplierId },
      data: {
        currentBalance: supplier.currentBalance - returnData.total,
        balanceType: supplier.currentBalance - returnData.total > 0 ? 'CREDIT' : 'DEBIT',
      },
    })
  }
}
