/**
 * Admin Controller
 * متحكم الإدارة
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminService } from '@/services/admin.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const adminController = {
  async getStats(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        companyId: searchParams.get('companyId') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined
      }

      const stats = await adminService.getStats(params)
      return NextResponse.json({ success: true, data: stats })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getRecentActivity(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit') || '20')

      const activity = await adminService.getRecentActivity(limit)
      return NextResponse.json({ success: true, data: activity })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getSystemHealth(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const health = await adminService.getSystemHealth()
      return NextResponse.json({ success: true, data: health })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getBackups(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const backups = await adminService.getBackups()
      return NextResponse.json({ success: true, data: backups })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async createBackup(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const backup = await adminService.createBackup(body)
      return NextResponse.json({ success: true, data: backup })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async restoreBackup(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const result = await adminService.restoreBackup(body.backupId)
      return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async impersonate(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user || !isSuperAdmin(user)) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const { userId, reason } = body

      if (!userId || !reason) {
        return NextResponse.json({ success: false, error: 'البيانات غير مكتملة' }, { status: 400 })
      }

      // Get target user
      const { db } = await import('@/lib/db')
      const targetUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, companyId: true }
      })

      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          impersonationToken: `imp_${Date.now()}_${userId}`,
          user: targetUser,
          reason
        }
      })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }
}
