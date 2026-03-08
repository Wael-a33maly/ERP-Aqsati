/**
 * Product Repository
 */

import { db } from '@/lib/db'
import type { ProductQueryParams, ProductInput, ProductUpdateInput } from '@/models/product.model'

export const productRepository = {
  async findProducts(params: ProductQueryParams) {
    const { page = 1, limit = 10, search, companyId, categoryId, active } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (categoryId) where.categoryId = categoryId
    if (active !== undefined) where.active = active

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } }
      ]
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Category: { select: { id: true, name: true, nameAr: true } },
          _count: { select: { InvoiceItem: true } }
        }
      }),
      db.product.count({ where })
    ])

    return { data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findById(id: string) {
    return db.product.findUnique({
      where: { id },
      include: { Category: true }
    })
  },

  async findBySku(sku: string, companyId: string) {
    return db.product.findFirst({ where: { sku, companyId } })
  },

  async create(data: ProductInput & { productCode: string }) {
    return db.product.create({
      data: {
        productCode: data.productCode,
        name: data.name,
        nameAr: data.nameAr,
        sku: data.sku || data.productCode,
        barcode: data.barcode,
        description: data.description,
        costPrice: data.costPrice,
        sellPrice: data.sellingPrice,
        unit: data.unit || 'piece',
        categoryId: data.categoryId,
        companyId: data.companyId,
        minStock: data.minStock || 0,
        maxStock: data.maxStock || 0,
        active: true
      }
    })
  },

  async update(id: string, data: ProductUpdateInput) {
    return db.product.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async delete(id: string) {
    return db.product.update({
      where: { id },
      data: { active: false }
    })
  }
}
