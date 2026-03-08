// ============================================
// Dashboard Service - خدمة لوحة التحكم
// ============================================

import { dashboardRepository } from '@/repositories/dashboard.repository'
import { DashboardStatsResponse } from '@/models/dashboard.model'

export const dashboardService = {
  // جلب إحصائيات لوحة التحكم
  async getStats(companyId: string | null, isSuperAdmin: boolean): Promise<DashboardStatsResponse> {
    const now = Date.now()

    // التحقق من التخزين المؤقت (فقط للسوبر أدمن بدون فلترة)
    if (isSuperAdmin && !companyId) {
      const cached = dashboardRepository.getCachedStats()
      if (cached && dashboardRepository.isCacheValid(cached.timestamp)) {
        return {
          ...cached.data,
          cached: true,
        }
      }
    }

    // جلب الإحصائيات
    const result = await dashboardRepository.getStats(companyId, isSuperAdmin)

    const response: DashboardStatsResponse = {
      success: true,
      cached: false,
      data: {
        ...result,
        companyId,
        isSuperAdmin,
      },
    }

    // تحديث التخزين المؤقت (فقط للسوبر أدمن بدون فلترة)
    if (isSuperAdmin && !companyId) {
      dashboardRepository.setCachedStats({
        data: response,
        companyId: '',
        timestamp: now,
      })
    }

    return response
  },
}
