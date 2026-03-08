/**
 * Product Service
 */

import { productRepository } from '@/repositories/product.repository'
import type { ProductQueryParams, ProductInput, ProductUpdateInput } from '@/models/product.model'

export const productService = {
  async getProducts(params: ProductQueryParams) {
    return productRepository.findProducts(params)
  },

  async getProductById(id: string) {
    const product = await productRepository.findById(id)
    if (!product) throw new Error('المنتج غير موجود')
    return product
  },

  async createProduct(data: ProductInput) {
    // Generate product code
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const productCode = `PRD-${year}-${random}`

    // Check SKU uniqueness
    if (data.sku) {
      const existing = await productRepository.findBySku(data.sku, data.companyId)
      if (existing) throw new Error('كود المنتج مستخدم مسبقاً')
    }

    return productRepository.create({ ...data, productCode })
  },

  async updateProduct(id: string, data: ProductUpdateInput) {
    return productRepository.update(id, data)
  },

  async deleteProduct(id: string) {
    return productRepository.delete(id)
  }
}
