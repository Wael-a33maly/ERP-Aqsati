// ============================================
// Zone Service - خدمة المناطق
// ============================================

import { zoneRepository } from '@/repositories/zone.repository'
import { 
  ZoneQueryParams,
  CreateZoneInput,
  UpdateZoneInput
} from '@/models/zone.model'

export const zoneService = {
  // جلب المناطق
  async getZones(params: ZoneQueryParams) {
    const { data, total } = await zoneRepository.findMany(params)
    
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

  // جلب منطقة بالمعرف
  async getZone(id: string) {
    return zoneRepository.findById(id)
  },

  // إنشاء منطقة
  async createZone(data: CreateZoneInput) {
    return zoneRepository.create(data)
  },

  // تحديث منطقة
  async updateZone(id: string, data: UpdateZoneInput) {
    const existing = await zoneRepository.findById(id)
    if (!existing) {
      throw new Error('المنطقة غير موجودة')
    }

    return zoneRepository.update(id, data)
  },

  // حذف منطقة
  async deleteZone(id: string) {
    const existing = await zoneRepository.findById(id)
    if (!existing) {
      throw new Error('المنطقة غير موجودة')
    }

    return zoneRepository.delete(id)
  }
}
