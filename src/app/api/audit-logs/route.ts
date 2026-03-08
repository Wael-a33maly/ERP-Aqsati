import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

// GET - الحصول على سجل التدقيق
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // التحقق من الصلاحيات
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    // فلترة حسب صلاحيات المستخدم
    if (user.role === 'COMPANY_ADMIN') {
      where.companyId = user.companyId
    } else if (user.role === 'BRANCH_MANAGER') {
      where.branchId = user.branchId
    }

    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (userId) where.userId = userId

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          User: {
            select: { id: true, name: true, email: true },
          },
          Company: {
            select: { id: true, name: true },
          },
          Branch: {
            select: { id: true, name: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجل التدقيق' },
      { status: 500 }
    )
  }
}

// POST - إنشاء سجل تدقيق يدوياً
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const { action, entityType, entityId, oldData, newData, notes } = body

    if (!action || !entityType) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const log = await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        userId: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        ipAddress: ip,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      data: log,
    })
  } catch (error: any) {
    console.error('Create audit log error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء سجل التدقيق' },
      { status: 500 }
    )
  }
}
