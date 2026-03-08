// ============================================
// Audit Log Controller - متحكم سجل التدقيق
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { auditLogService } from '@/services/audit-log.service'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

export const auditLogController = {
  // GET - الحصول على سجل التدقيق
  async getAuditLogs(request: NextRequest) {
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
      const params = {
        action: searchParams.get('action') as any,
        entityType: searchParams.get('entityType') || undefined,
        entityId: searchParams.get('entityId') || undefined,
        userId: searchParams.get('userId') || undefined,
        companyId: user.role === 'COMPANY_ADMIN' ? user.companyId : searchParams.get('companyId') || undefined,
        branchId: user.role === 'BRANCH_MANAGER' ? user.branchId : searchParams.get('branchId') || undefined,
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
      }

      const result = await auditLogService.getAuditLogs(params)

      return NextResponse.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      })
    } catch (error: any) {
      console.error('Get audit logs error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في جلب سجل التدقيق' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء سجل تدقيق يدوياً
  async createAuditLog(request: NextRequest) {
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

      const log = await auditLogService.createAuditLog({
        action,
        entityType,
        entityId,
        oldData,
        newData,
        userId: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        ipAddress: ip,
        userAgent,
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
  },
}
