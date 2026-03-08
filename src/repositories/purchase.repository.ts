/**
 * Purchase Repository
 * مستودع المشتريات
 */

import { db } from '@/lib/db'
import {
  PurchaseInvoiceQueryParams,
  PurchaseReturnQueryParams,
  PurchaseInvoiceWithRelations,
  PurchaseReturnWithRelations,
} from '@/models/purchase.model'
import { Prisma } from '@prisma/client'

// ============ Purchase Invoice Repository ============

export const purchaseInvoiceRepository = {
  /**
   * جلب فواتير المشتريات مع التصفية والصفحات
   */
  async findMany(params: PurchaseInvoiceQueryParams) {
    const {
      page = 1,
      limit = 50,
      search,
      companyId,
      status,
      supplierId,
      branchId,
      warehouseId,
      fromDate,
      toDate,
    } = params

    const skip = (page - 1) * limit

    const where: Prisma.PurchaseInvoiceWhereInput = {
      companyId,
    }

    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    if (branchId) where.branchId = branchId
    if (warehouseId) where.warehouseId = warehouseId

    if (fromDate || toDate) {
      where.invoiceDate = {}
      if (fromDate) where.invoiceDate.gte = new Date(fromDate)
      if (toDate) where.invoiceDate.lte = new Date(toDate)
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { supplierInvoiceNumber: { contains: search } },
        { Supplier: { name: { contains: search } } },
      ]
    }

    const [invoices, total] = await Promise.all([
      db.purchaseInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Supplier: { select: { id: true, name: true, supplierCode: true } },
          Branch: { select: { id: true, name: true } },
          Warehouse: { select: { id: true, name: true } },
          _count: { select: { PurchaseInvoiceItem: true } },
        },
      }),
      db.purchaseInvoice.count({ where }),
    ])

    return { invoices: invoices as PurchaseInvoiceWithRelations[], total }
  },

  /**
   * جلب فاتورة مشتريات بالمعرف
   */
  async findById(id: string) {
    return db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        Supplier: true,
        Branch: true,
        Warehouse: true,
        PurchaseInvoiceItem: {
          include: {
            Product: true,
          },
        },
      },
    })
  },

  /**
   * إنشاء فاتورة مشتريات
   */
  async create(data: Prisma.PurchaseInvoiceCreateInput) {
    return db.purchaseInvoice.create({
      data,
      include: {
        PurchaseInvoiceItem: true,
      },
    })
  },

  /**
   * تحديث فاتورة مشتريات
   */
  async update(id: string, data: Prisma.PurchaseInvoiceUpdateInput) {
    return db.purchaseInvoice.update({
      where: { id },
      data,
    })
  },

  /**
   * حذف فاتورة مشتريات
   */
  async delete(id: string) {
    return db.purchaseInvoice.delete({
      where: { id },
    })
  },

  /**
   * البحث عن آخر فاتورة لكود التسلسل
   */
  async findLastByInvoiceNumberPrefix(companyId: string, prefix: string) {
    return db.purchaseInvoice.findFirst({
      where: {
        companyId,
        invoiceNumber: { startsWith: prefix },
      },
      orderBy: { invoiceNumber: 'desc' },
    })
  },

  /**
   * إنشاء صنف في فاتورة المشتريات
   */
  async createItem(data: Prisma.PurchaseInvoiceItemCreateInput) {
    return db.purchaseInvoiceItem.create({
      data,
    })
  },
}

// ============ Purchase Return Repository ============

export const purchaseReturnRepository = {
  /**
   * جلب مرتجعات المشتريات مع التصفية والصفحات
   */
  async findMany(params: PurchaseReturnQueryParams) {
    const { page = 1, limit = 50, search, companyId, status, supplierId } = params
    const skip = (page - 1) * limit

    const where: Prisma.PurchaseReturnWhereInput = {
      companyId,
    }

    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    if (search) {
      where.OR = [
        { returnNumber: { contains: search } },
        { Supplier: { name: { contains: search } } },
      ]
    }

    const [returns, total] = await Promise.all([
      db.purchaseReturn.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Supplier: { select: { id: true, name: true, supplierCode: true } },
          Branch: { select: { id: true, name: true } },
          Warehouse: { select: { id: true, name: true } },
          PurchaseInvoice: { select: { id: true, invoiceNumber: true } },
          _count: { select: { PurchaseReturnItem: true } },
        },
      }),
      db.purchaseReturn.count({ where }),
    ])

    return { returns: returns as PurchaseReturnWithRelations[], total }
  },

  /**
   * جلب مرتجع مشتريات بالمعرف
   */
  async findById(id: string) {
    return db.purchaseReturn.findUnique({
      where: { id },
      include: {
        Supplier: true,
        Branch: true,
        Warehouse: true,
        PurchaseInvoice: true,
        PurchaseReturnItem: {
          include: {
            Product: true,
          },
        },
      },
    })
  },

  /**
   * إنشاء مرتجع مشتريات
   */
  async create(data: Prisma.PurchaseReturnCreateInput) {
    return db.purchaseReturn.create({
      data,
    })
  },

  /**
   * تحديث مرتجع مشتريات
   */
  async update(id: string, data: Prisma.PurchaseReturnUpdateInput) {
    return db.purchaseReturn.update({
      where: { id },
      data,
    })
  },

  /**
   * حذف مرتجع مشتريات
   */
  async delete(id: string) {
    return db.purchaseReturn.delete({
      where: { id },
    })
  },

  /**
   * البحث عن آخر مرتجع لكود التسلسل
   */
  async findLastByReturnNumberPrefix(companyId: string, prefix: string) {
    return db.purchaseReturn.findFirst({
      where: {
        companyId,
        returnNumber: { startsWith: prefix },
      },
      orderBy: { returnNumber: 'desc' },
    })
  },

  /**
   * إنشاء صنف في مرتجع المشتريات
   */
  async createItem(data: Prisma.PurchaseReturnItemCreateInput) {
    return db.purchaseReturnItem.create({
      data,
    })
  },
}

// ============ Inventory Helper Functions ============

export const inventoryRepository = {
  /**
   * البحث عن سجل مخزون
   */
  async findByProductAndWarehouse(productId: string, warehouseId: string) {
    return db.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    })
  },

  /**
   * إنشاء أو تحديث سجل مخزون
   */
  async upsert(
    productId: string,
    warehouseId: string,
    data: {
      quantity: number
      avgCost: number
      totalCost: number
      lastPurchaseCost?: number
    }
  ) {
    return db.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      create: {
        productId,
        warehouseId,
        quantity: data.quantity,
        avgCost: data.avgCost,
        totalCost: data.totalCost,
        lastPurchaseDate: new Date(),
        lastPurchaseCost: data.lastPurchaseCost || data.avgCost,
      },
      update: {
        quantity: data.quantity,
        avgCost: data.avgCost,
        totalCost: data.totalCost,
        lastPurchaseDate: new Date(),
        lastPurchaseCost: data.lastPurchaseCost || data.avgCost,
      },
    })
  },

  /**
   * إنشاء حركة مخزون
   */
  async createMovement(data: Prisma.InventoryMovementCreateInput) {
    return db.inventoryMovement.create({
      data,
    })
  },

  /**
   * إنشاء طبقة تكلفة
   */
  async createCostLayer(data: Prisma.CostLayerCreateInput) {
    return db.costLayer.create({
      data,
    })
  },

  /**
   * جلب طبقة تكلفة
   */
  async findFirstCostLayer(productId: string, warehouseId: string) {
    return db.costLayer.findFirst({
      where: {
        productId,
        warehouseId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { layerDate: 'asc' },
    })
  },

  /**
   * تحديث طبقة تكلفة
   */
  async updateCostLayer(id: string, data: Prisma.CostLayerUpdateInput) {
    return db.costLayer.update({
      where: { id },
      data,
    })
  },

  /**
   * تحديث تكلفة المنتج
   */
  async updateProductCost(productId: string, costPrice: number) {
    return db.product.update({
      where: { id: productId },
      data: { costPrice },
    })
  },
}
