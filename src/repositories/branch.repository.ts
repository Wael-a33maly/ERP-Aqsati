// ============================================
// Branch Repository - مستودع الفروع
// ============================================

import { db } from '@/lib/db'
import { 
  BranchQueryParams,
  CreateBranchInput,
  UpdateBranchInput,
  BranchWithDetails
} from '@/models/branch.model'

export const branchRepository = {
  // جلب الفروع
  async findMany(params: BranchQueryParams): Promise<{ data: BranchWithDetails[]; total: number }> {
    const skip = ((params.page || 1) - 1) * (params.limit || 10)
    const where: any = {}

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } }
      ]
    }
    if (params.companyId) where.companyId = params.companyId
    if (params.active !== undefined) where.active = params.active

    const [branches, total] = await Promise.all([
      db.branch.findMany({
        where,
        skip,
        take: params.limit || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          Company: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { User: true, Customer: true }
          }
        }
      }),
      db.branch.count({ where })
    ])

    return { data: branches as BranchWithDetails[], total }
  },

  // جلب فرع بالمعرف
  async findById(id: string) {
    return db.branch.findUnique({
      where: { id },
      include: {
        Company: true
      }
    })
  },

  // التحقق من وجود الكود
  async findByCode(companyId: string, code: string, excludeId?: string) {
    return db.branch.findFirst({
      where: {
        companyId,
        code,
        ...(excludeId && { id: { not: excludeId } })
      }
    })
  },

  // إنشاء فرع
  async create(data: CreateBranchInput) {
    return db.branch.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        nameAr: data.name || data.name,
        code: data.code,
        address: data.address || null,
        phone: data.phone || null,
        isMain: data.isMain || false,
        active: true
      },
      include: {
        Company: {
          select: { id: true, name: true, code: true }
        }
      }
    })
  },

  // تحديث فرع
  async update(id: string, data: UpdateBranchInput) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr
    if (data.code !== undefined) updateData.code = data.code
    if (data.address !== undefined) updateData.address = data.address
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.isMain !== undefined) updateData.isMain = data.isMain
    if (data.active !== undefined) updateData.active = data.active

    return db.branch.update({
      where: { id },
      data: updateData
    })
  },

  // إلغاء تعيين الفروع الرئيسية الأخرى
  async unsetOtherMainBranches(companyId: string, excludeId?: string) {
    return db.branch.updateMany({
      where: {
        companyId,
        isMain: true,
        ...(excludeId && { id: { not: excludeId } })
      },
      data: { isMain: false }
    })
  },

  // حذف فرع (soft delete)
  async softDelete(id: string) {
    return db.branch.update({
      where: { id },
      data: { active: false }
    })
  }
}
