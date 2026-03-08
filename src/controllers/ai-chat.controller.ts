// ============================================
// AI Chat Controller - متحكم الدردشة الذكية
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { aiChatService } from '@/services/ai-chat.service'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

export const aiChatController = {
  // POST - إرسال رسالة
  async sendMessage(request: NextRequest) {
    try {
      const rateLimitResponse = await applyRateLimit(request, 'api')
      if (rateLimitResponse) return rateLimitResponse

      const user = await getCurrentUser()
      const userId = user?.id || 'anonymous'

      const body = await request.json()
      const { message, clearHistory } = body

      if (!message) {
        return NextResponse.json({ error: 'الرسالة مطلوبة' }, { status: 400 })
      }

      const result = await aiChatService.sendMessage(userId, { message, clearHistory })

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('AI chat error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في معالجة الرسالة' },
        { status: 500 }
      )
    }
  },

  // GET - جلب تاريخ المحادثة
  async getHistory(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      const userId = user?.id || 'anonymous'

      const result = await aiChatService.getHistory(userId)

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'حدث خطأ في جلب المحادثة' },
        { status: 500 }
      )
    }
  },

  // DELETE - مسح تاريخ المحادثة
  async clearHistory(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      const userId = user?.id || 'anonymous'

      const result = await aiChatService.clearHistory(userId)

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'حدث خطأ' },
        { status: 500 }
      )
    }
  },
}
