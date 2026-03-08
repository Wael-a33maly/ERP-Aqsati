// ============================================
// Zone Repository - مستودع المناطق
// ============================================

import { db } from '@/lib/db'
import { 
  ZoneQueryParams,
  CreateZoneInput,
  UpdateZoneInput,
  ZoneWithDetails
} from '@/models/zone.model'

export const zoneRepository = {
  // جلب المناطق
  async findMany(params: ZoneQueryParams): Promise<{ data: ZoneWithDetails[]; total: number }> {
    const skip = ((params.page || 1) - 1) * (params.limit || 10)
    const where: any = {}

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } }
      ]
    }
    if (params.companyId) where.companyId = params.companyId
    if (params.branchId) where.branchId = params.branchId
    if (params.active !== undefined) where.active = params.active

    const [zones, total] = await Promise.all([
      db.zone.findMany({
        where,
        skip,
        take: params.limit || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          Company: { select: { id: true, name: true } },
          Branch: { select: { id: true, name: true } },
          _count: { select: { Customer: true } }
        }
      }),
      db.zone.count({ where })
    ])

    return { data: zones as ZoneWithDetails[], total }
  },

  // جلب منطقة بالمعرف
  async findById(id: string) {
    return db.zone.findUnique({
      where: { id },
      include: {
        Company: true,
        Branch: true
      }
    })
  },

  // إنشاء منطقة
  async create(data: CreateZoneInput) {
    return db.zone.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        companyId: data.companyId,
        branchId: data.branchId || null,
        active: true
      }
    })
  },

  // تحديث منطقة
  async update(id: string, data: UpdateZoneInput) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.code !== undefined) updateData.code = data.code
    if (data.description !== undefined) updateData.description = data.description
    if (data.active !== undefined) updateData.active = data.active

    return db.zone.update({
      where: { id },
      data: updateData
    })
  },

  // حذف منطقة
  async delete(id: string) {
    return db.zone.delete({
      where: { id }
    })
  }
}
