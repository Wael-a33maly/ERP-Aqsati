import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

// GET - الحصول على إشعارات المستخدم
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')

    const where: any = { userId: user.id }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type
    if (priority) where.priority = priority

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإشعارات' },
      { status: 500 }
    )
  }
}

// POST - إنشاء إشعار جديد
export async function POST(request: NextRequest) {
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

    const notification = await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        title,
        message,
        type,
        priority: priority || 'medium',
        link,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
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
}

// PUT - تحديث الإشعارات (تحديد كمقروء)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      await db.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'تم تحديد جميع الإشعارات كمقروءة',
      })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'تم تحديد الإشعارات كمقروءة',
      })
    }

    return NextResponse.json(
      { error: 'بيانات غير صالحة' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الإشعارات' },
      { status: 500 }
    )
  }
}

// DELETE - حذف إشعار
export async function DELETE(request: NextRequest) {
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

    await db.notification.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف الإشعار',
    })
  } catch (error: any) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الإشعار' },
      { status: 500 }
    )
  }
}
