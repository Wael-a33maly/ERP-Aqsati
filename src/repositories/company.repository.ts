/**
 * Company Repository
 * مستودع الشركات
 */

import { db } from '@/lib/db'
import { CompanyQueryParams, CompanyWithStats } from '@/models/company.model'
import { Prisma } from '@prisma/client'

export const companyRepository = {
  /**
   * جلب جميع الشركات مع التصفية والصفحات
   */
  async findMany(params: CompanyQueryParams) {
    const { page = 1, limit = 10, search, active } = params
    const skip = (page - 1) * limit

    const where: Prisma.CompanyWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (active !== undefined) {
      where.active = active
    }

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { Branch: true, User: true, Customer: true, Product: true },
          },
        },
      }),
      db.company.count({ where }),
    ])

    return { companies: companies as CompanyWithStats[], total }
  },

  /**
   * جلب شركة بالمعرف
   */
  async findById(id: string) {
    return db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Branch: true, User: true, Customer: true, Product: true },
        },
      },
    })
  },

  /**
   * جلب شركة بالكود
   */
  async findByCode(code: string) {
    return db.company.findUnique({
      where: { code },
    })
  },

  /**
   * إنشاء شركة جديدة
   */
  async create(data: Prisma.CompanyCreateInput) {
    return db.company.create({
      data,
    })
  },

  /**
   * تحديث شركة
   */
  async update(id: string, data: Prisma.CompanyUpdateInput) {
    return db.company.update({
      where: { id },
      data,
    })
  },

  /**
   * حذف شركة
   */
  async delete(id: string) {
    return db.company.delete({
      where: { id },
    })
  },

  /**
   * جلب شركة مع عدد الفواتير
   */
  async findByIdWithInvoiceCount(id: string) {
    return db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Branch: true, User: true, Customer: true, Invoice: true },
        },
      },
    })
  },
}
