/**
 * Admin Controller
 * متحكم لوحة تحكم السوبر أدمن
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminService } from '@/services/admin.service'
import { getCurrentUser } from '@/lib/auth'
import { cookies } from 'next/headers'

// التحقق من صلاحيات السوبر أدمن
async function checkSuperAdmin() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('erp_user')

  if (!userCookie) {
    return null
  }

  const user = JSON.parse(userCookie.value)
  if (user.role !== 'SUPER_ADMIN') {
    return null
  }

  return user
}

export const adminController = {
  // === Stats ===
  async getStats(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const data = await adminService.getAdminStats()
      return NextResponse.json({ success: true, data })
    } catch (error: any) {
      console.error('Admin stats error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  // === Payment Gateways ===
  async getPaymentGateways(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId') || undefined

      const data = await adminService.getPaymentGateways(companyId)
      return NextResponse.json({ success: true, ...data })
    } catch (error: any) {
      console.error('Payment gateways fetch error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async createPaymentGateway(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const gateway = await adminService.createPaymentGateway(body)

      return NextResponse.json({
        success: true,
        gateway,
        message: 'تم إضافة بوابة الدفع بنجاح'
      })
    } catch (error: any) {
      console.error('Payment gateway create error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async updatePaymentGateway(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const gateway = await adminService.updatePaymentGateway(body)

      return NextResponse.json({
        success: true,
        gateway,
        message: 'تم تحديث بوابة الدفع بنجاح'
      })
    } catch (error: any) {
      console.error('Payment gateway update error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async togglePaymentGateway(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const { id, isActive } = body

      if (!id) {
        return NextResponse.json({ success: false, error: 'معرف البوابة مطلوب' }, { status: 400 })
      }

      const gateway = await adminService.togglePaymentGateway(id, isActive)

      return NextResponse.json({
        success: true,
        gateway,
        message: isActive ? 'تم تفعيل البوابة' : 'تم تعطيل البوابة'
      })
    } catch (error: any) {
      console.error('Payment gateway patch error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async deletePaymentGateway(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ success: false, error: 'معرف البوابة مطلوب' }, { status: 400 })
      }

      await adminService.deletePaymentGateway(id)

      return NextResponse.json({
        success: true,
        message: 'تم حذف بوابة الدفع بنجاح'
      })
    } catch (error: any) {
      console.error('Payment gateway delete error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  // === Collections ===
  async getCollections(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const period = (searchParams.get('period') || 'month') as 'today' | 'week' | 'month' | 'year'

      const data = await adminService.getCollections({ period })
      return NextResponse.json({ success: true, data })
    } catch (error: any) {
      console.error('Collections stats error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  // === Backup ===
  async getBackups(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const action = searchParams.get('action')

      if (action === 'list') {
        const backups = await adminService.getBackupList()
        return NextResponse.json({ success: true, backups })
      }

      if (action === 'download') {
        const filename = searchParams.get('file')
        if (!filename) {
          return NextResponse.json({ success: false, error: 'اسم الملف مطلوب' }, { status: 400 })
        }

        const content = await adminService.downloadBackup(filename)
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        })
      }

      return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 })
    } catch (error: any) {
      console.error('Backup error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async createBackup(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const result = await adminService.createBackup(body, user.id)

      return NextResponse.json({
        success: true,
        filename: result.filename,
        size: result.size,
        message: 'تم إنشاء النسخة الاحتياطية بنجاح'
      })
    } catch (error: any) {
      console.error('Backup creation error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async deleteBackup(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const filename = searchParams.get('file')

      if (!filename) {
        return NextResponse.json({ success: false, error: 'اسم الملف مطلوب' }, { status: 400 })
      }

      await adminService.deleteBackup(filename)
      return NextResponse.json({ success: true, message: 'تم حذف النسخة الاحتياطية' })
    } catch (error: any) {
      console.error('Backup deletion error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  // === Restore ===
  async restoreBackup(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const result = await adminService.restoreBackup(body)

      if (result.requiresConfirmation) {
        return NextResponse.json({
          requiresConfirmation: true,
          message: 'سيتم حذف البيانات الحالية قبل الاستعادة. هل أنت متأكد؟',
          backupInfo: result.backupInfo
        })
      }

      return NextResponse.json({
        success: true,
        message: 'تم استعادة النسخة الاحتياطية بنجاح'
      })
    } catch (error: any) {
      console.error('Restore error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.message
      }, { status: 500 })
    }
  },

  // === Danger Zone ===
  async deleteAllData(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const result = await adminService.deleteData(body)

      return NextResponse.json({
        success: true,
        message: result.message
      })
    } catch (error: any) {
      console.error('Delete all data error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.message
      }, { status: 500 })
    }
  },

  // === Impersonate ===
  async startImpersonate(request: NextRequest) {
    try {
      const user = await checkSuperAdmin()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const { companyId } = body

      console.log('[Impersonate] Request received for company:', companyId)

      const session = await adminService.startImpersonate({ companyId })

      console.log('[Impersonate] Company found:', session.companyName, 'Branch:', session.branchName)

      return NextResponse.json({
        success: true,
        session
      })
    } catch (error: any) {
      console.error('[Impersonate] Error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async stopImpersonate(request: NextRequest) {
    try {
      console.log('[Impersonate] Exit request received')
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('[Impersonate] Exit error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }
}
