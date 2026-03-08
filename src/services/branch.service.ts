// ============================================
// Branch Service - خدمة الفروع
// ============================================

import { branchRepository } from '@/repositories/branch.repository'
import { 
  BranchQueryParams,
  CreateBranchInput,
  UpdateBranchInput
} from '@/models/branch.model'

export const branchService = {
  // جلب الفروع
  async getBranches(params: BranchQueryParams) {
    const { data, total } = await branchRepository.findMany(params)
    
    return {
      data,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total,
        totalPages: Math.ceil(total / (params.limit || 10))
      }
    }
  },

  // جلب فرع بالمعرف
  async getBranch(id: string) {
    return branchRepository.findById(id)
  },

  // إنشاء فرع
  async createBranch(data: CreateBranchInput) {
    // التحقق من عدم تكرار الكود
    const existing = await branchRepository.findByCode(data.companyId, data.code)
    if (existing) {
      throw new Error('كود الفرع موجود مسبقاً')
    }

    // إذا كان الفرع الرئيسي، إلغاء تعيين الفروع الرئيسية الأخرى
    if (data.isMain) {
      await branchRepository.unsetOtherMainBranches(data.companyId)
    }

    return branchRepository.create(data)
  },

  // تحديث فرع
  async updateBranch(id: string, data: UpdateBranchInput) {
    // التحقق من وجود الفرع
    const existing = await branchRepository.findById(id)
    if (!existing) {
      throw new Error('الفرع غير موجود')
    }

    // التحقق من عدم تكرار الكود
    if (data.code && data.code !== existing.code) {
      const duplicate = await branchRepository.findByCode(existing.companyId, data.code, id)
      if (duplicate) {
        throw new Error('كود الفرع موجود مسبقاً')
      }
    }

    // إذا كان الفرع الرئيسي، إلغاء تعيين الفروع الرئيسية الأخرى
    if (data.isMain && !existing.isMain) {
      await branchRepository.unsetOtherMainBranches(existing.companyId, id)
    }

    return branchRepository.update(id, data)
  },

  // حذف فرع
  async deleteBranch(id: string) {
    const existing = await branchRepository.findById(id)
    if (!existing) {
      throw new Error('الفرع غير موجود')
    }

    if (existing.isMain) {
      throw new Error('لا يمكن حذف الفرع الرئيسي')
    }

    return branchRepository.softDelete(id)
  }
}
