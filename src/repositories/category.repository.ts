/**
 * Category Repository
 * مستودع بيانات الفئات
 */

import { db } from '@/lib/db'
import type { CategoryQueryParams, CategoryInput, CategoryUpdateInput } from '@/models/category.model'

export const categoryRepository = {
  async findCategories(params: CategoryQueryParams) {
    const { companyId, parentId, includeProducts, activeOnly } = params

    const where: any = { companyId }
    if (parentId !== undefined) where.parentId = parentId || null
    if (activeOnly !== false) where.active = true

    return db.productCategory.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, nameAr: true } },
        children: { select: { id: true, name: true, nameAr: true } },
        ...(includeProducts && {
          Product: {
            select: { id: true, name: true, sku: true },
            take: 10
          }
        }),
        _count: { select: { Product: true, children: true } }
      }
    })
  },

  async findCategoryById(id: string) {
    return db.productCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        Product: { take: 20 }
      }
    })
  },

  async findCategoryByCode(companyId: string, code: string) {
    return db.productCategory.findFirst({
      where: { companyId, code }
    })
  },

  async createCategory(data: CategoryInput) {
    return db.productCategory.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        nameAr: data.nameAr || data.name,
        code: data.code,
        parentId: data.parentId || null,
        active: data.active !== false
      }
    })
  },

  async updateCategory(id: string, data: CategoryUpdateInput) {
    return db.productCategory.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  },

  async deleteCategory(id: string) {
    return db.productCategory.update({
      where: { id },
      data: { active: false }
    })
  }
}
