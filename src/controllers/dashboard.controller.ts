// ============================================
// Dashboard Controller - متحكم لوحة التحكم
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { dashboardService } from '@/services/dashboard.service'
import { cookies } from 'next/headers'

export const dashboardController = {
  // GET - جلب إحصائيات لوحة التحكم
  async getStats(request: NextRequest) {
    try {
      // جلب معلومات المستخدم من cookies
      const cookieStore = await cookies()
      const userCookie = cookieStore.get('erp_user')

      let companyId: string | null = null
      let isSuperAdmin = false

      if (userCookie) {
        try {
          const userData = JSON.parse(userCookie.value)
          companyId = userData.companyId || null
          isSuperAdmin = userData.role === 'SUPER_ADMIN' && !userData.isImpersonating
        } catch (e) {
          // في حالة فشل تحليل البيانات
        }
      }

      const result = await dashboardService.getStats(companyId, isSuperAdmin)

      return NextResponse.json(result)
    } catch (error) {
      console.error('Dashboard stats error:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في تحميل الإحصائيات' },
        { status: 500 }
      )
    }
  },
}
