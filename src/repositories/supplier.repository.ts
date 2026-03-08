/**
 * Supplier Repository
 * مستودع الموردين
 */

import { db } from '@/lib/db'
import {
  SupplierQueryParams,
  CreateSupplierInput,
  SupplierWithStats,
} from '@/models/supplier.model'
import { Prisma } from '@prisma/client'

export const supplierRepository = {
  /**
   * جلب جميع الموردين مع التصفية والصفحات
   */
  async findMany(params: SupplierQueryParams) {
    const { page = 1, limit = 50, search, companyId, active } = params
    const skip = (page - 1) * limit

    const where: Prisma.SupplierWhereInput = {
      companyId,
    }

    if (search) {
      where.OR = [
        { supplierCode: { contains: search } },
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (active !== undefined) {
      where.active = active
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              PurchaseInvoice: true,
              PurchaseReturn: true,
              SupplierPayment: true,
            },
          },
        },
      }),
      db.supplier.count({ where }),
    ])

    return { suppliers: suppliers as SupplierWithStats[], total }
  },

  /**
   * جلب مورد بالمعرف
   */
  async findById(id: string) {
    return db.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            PurchaseInvoice: true,
            PurchaseReturn: true,
            SupplierPayment: true,
          },
        },
      },
    })
  },

  /**
   * إنشاء مورد جديد
   */
  async create(data: Prisma.SupplierCreateInput) {
    return db.supplier.create({
      data,
    })
  },

  /**
   * تحديث مورد
   */
  async update(id: string, data: Prisma.SupplierUpdateInput) {
    return db.supplier.update({
      where: { id },
      data,
    })
  },

  /**
   * حذف مورد
   */
  async delete(id: string) {
    return db.supplier.delete({
      where: { id },
    })
  },

  /**
   * البحث عن آخر مورد لكود التسلسل
   */
  async findLastByCodePrefix(companyId: string, prefix: string) {
    return db.supplier.findFirst({
      where: {
        companyId,
        supplierCode: { startsWith: prefix },
      },
      orderBy: { supplierCode: 'desc' },
    })
  },

  /**
   * إنشاء حركة رصيد مورد
   */
  async createTransaction(data: Prisma.SupplierTransactionCreateInput) {
    return db.supplierTransaction.create({
      data,
    })
  },

  /**
   * جلب حركات رصيد مورد
   */
  async getTransactions(supplierId: string) {
    return db.supplierTransaction.findMany({
      where: { supplierId },
      orderBy: { transactionDate: 'desc' },
    })
  },
}
