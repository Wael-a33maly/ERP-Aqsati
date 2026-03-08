// ============================================
// Notification Controller - متحكم الإشعارات
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/services/notification.service'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

export const notificationController = {
  // GET - الحصول على إشعارات المستخدم
  async getNotifications(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        unreadOnly: searchParams.get('unreadOnly') === 'true',
        limit: parseInt(searchParams.get('limit') || '50'),
        type: searchParams.get('type') as any,
        priority: searchParams.get('priority') as any,
      }

      const result = await notificationService.getNotifications(user.id, params)

      return NextResponse.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
      })
    } catch (error: any) {
      console.error('Get notifications error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في جلب الإشعارات' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء إشعار جديد
  async createNotification(request: NextRequest) {
    try {
      const rateLimitResponse = await applyRateLimit(request, 'create')
      if (rateLimitResponse) return rateLimitResponse

      const user = await getCurrentUser()
      if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER'].includes(user.role)) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }

      const body = await request.json()
      const { userId, title, message, type, priority, link, metadata } = body

      if (!userId || !title || !message || !type) {
        return NextResponse.json(
          { error: 'البيانات غير مكتملة' },
          { status: 400 }
        )
      }

      const notification = await notificationService.createNotification({
        userId,
        title,
        message,
        type,
        priority,
        link,
        metadata,
      })

      return NextResponse.json({
        success: true,
        data: notification,
      })
    } catch (error: any) {
      console.error('Create notification error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في إنشاء الإشعار' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث الإشعارات (تحديد كمقروء)
  async updateNotifications(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const result = await notificationService.updateNotifications(user.id, body)

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Update notifications error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في تحديث الإشعارات' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف إشعار
  async deleteNotification(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { error: 'معرف الإشعار مطلوب' },
          { status: 400 }
        )
      }

      const result = await notificationService.deleteNotification(user.id, id)

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Delete notification error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في حذف الإشعار' },
        { status: 500 }
      )
    }
  },

  // GET - Badge (عدد الإشعارات غير المقروءة)
  async getBadge(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const result = await notificationService.getBadge(user.id)

      return NextResponse.json({
        success: true,
        ...result,
      })
    } catch (error: any) {
      console.error('Get badge error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في جلب الإشعارات' },
        { status: 500 }
      )
    }
  },
}
