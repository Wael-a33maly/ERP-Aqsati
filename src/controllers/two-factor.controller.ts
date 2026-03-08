// ============================================
// Two-Factor Controller - متحكم المصادقة الثنائية
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { twoFactorService } from '@/services/two-factor.service'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

export const twoFactorController = {
  // GET - الحصول على حالة 2FA
  async getStatus(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const status = await twoFactorService.getStatus(user.id)

      return NextResponse.json({
        success: true,
        data: status,
      })
    } catch (error: any) {
      console.error('Get 2FA status error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في جلب حالة المصادقة الثنائية' },
        { status: 500 }
      )
    }
  },

  // POST - تفعيل/تعطيل/التحقق من 2FA
  async executeAction(request: NextRequest) {
    try {
      const rateLimitResponse = await applyRateLimit(request, 'auth')
      if (rateLimitResponse) return rateLimitResponse

      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const { action, token } = body

      const result = await twoFactorService.executeAction(user.id, { action, token })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('2FA error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في معالجة المصادقة الثنائية' },
        { status: 500 }
      )
    }
  },
}
