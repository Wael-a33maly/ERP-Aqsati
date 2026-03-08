/**
 * Category Service
 * خدمات الفئات
 */

import { categoryRepository } from '@/repositories/category.repository'
import type { CategoryQueryParams, CategoryInput, CategoryUpdateInput } from '@/models/category.model'

export const categoryService = {
  async getCategories(params: CategoryQueryParams) {
    const categories = await categoryRepository.findCategories(params)
    const rootCategories = categories.filter((c: any) => !c.parentId)
    return { data: categories, tree: rootCategories }
  },

  async getCategoryById(id: string) {
    const category = await categoryRepository.findCategoryById(id)
    if (!category) {
      throw new Error('الفئة غير موجودة')
    }
    return category
  },

  async createCategory(data: CategoryInput, userId?: string) {
    // Check if code exists
    const existing = await categoryRepository.findCategoryByCode(data.companyId, data.code)
    if (existing) {
      throw new Error('كود الفئة موجود مسبقاً')
    }

    return categoryRepository.createCategory(data)
  },

  async updateCategory(id: string, data: CategoryUpdateInput, companyId: string) {
    const existing = await categoryRepository.findCategoryById(id)
    if (!existing || existing.companyId !== companyId) {
      throw new Error('الفئة غير موجودة')
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await categoryRepository.findCategoryByCode(companyId, data.code)
      if (codeExists && codeExists.id !== id) {
        throw new Error('كود الفئة موجود مسبقاً')
      }
    }

    return categoryRepository.updateCategory(id, data)
  },

  async deleteCategory(id: string, companyId: string) {
    const existing = await categoryRepository.findCategoryById(id)
    if (!existing || existing.companyId !== companyId) {
      throw new Error('الفئة غير موجودة')
    }

    return categoryRepository.deleteCategory(id)
  }
}
