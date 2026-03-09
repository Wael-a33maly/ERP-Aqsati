/**
 * Admin Controller
 * متحكم لوحة تحكم السوبر أدمن
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminService } from '@/services/admin.service'
import { getCurrentUser } from '@/lib/auth'
import { cookies } from 'next/headers'

// التحقق من صلاحيات السوبر أدمن
async function checkSuperAdmin(request?: NextRequest) {
  console.log('[checkSuperAdmin] Starting check...')
  
  // أولاً: التحقق من getCurrentUser (من erp_auth_token cookie)
  const user = await getCurrentUser()
  console.log('[checkSuperAdmin] getCurrentUser result:', user ? { id: user.id, email: user.email, role: user.role } : null)
  
  if (user && user.role === 'SUPER_ADMIN') {
    console.log('[checkSuperAdmin] Found SUPER_ADMIN from auth token')
    return user
  }

  // ثانياً: التحقق من erp_user cookie (للتوافقية مع localStorage login)
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('erp_user')
  console.log('[checkSuperAdmin] erp_user cookie:', userCookie ? 'exists' : 'not found')

  if (userCookie) {
    try {
      const decodedValue = decodeURIComponent(userCookie.value)
      console.log('[checkSuperAdmin] Decoded cookie value length:', decodedValue.length)
      const cookieUser = JSON.parse(decodedValue)
      console.log('[checkSuperAdmin] Cookie user role:', cookieUser.role)
      if (cookieUser.role === 'SUPER_ADMIN') {
        console.log('[checkSuperAdmin] Found SUPER_ADMIN from erp_user cookie')
        return cookieUser
      }
    } catch (e) {
      console.log('[checkSuperAdmin] Error parsing erp_user cookie:', e)
    }
  }

  // ثالثاً: التحقق من Authorization header (للتوافقية)
  if (request) {
    const authHeader = request.headers.get('authorization')
    console.log('[checkSuperAdmin] Authorization header:', authHeader ? `exists (${authHeader.substring(0, 20)}...)` : 'not found')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('[checkSuperAdmin] Token length:', token.length)
      try {
        const { verifyToken } = await import('@/lib/auth')
        const payload = verifyToken(token)
        console.log('[checkSuperAdmin] Token payload:', payload ? { userId: payload.userId, email: payload.email, role: payload.role } : null)
        if (payload && payload.role === 'SUPER_ADMIN') {
          console.log('[checkSuperAdmin] Found SUPER_ADMIN from Authorization header')
          return payload as any
        }
      } catch (e) {
        console.log('[checkSuperAdmin] Error verifying token from header:', e)
      }
    }
  } else {
    console.log('[checkSuperAdmin] No request object provided')
  }

  console.log('[checkSuperAdmin] No SUPER_ADMIN found, returning null')
  return null
}

export const adminController = {
  // === Stats ===
  async getStats(request: NextRequest) {
    try {
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
      const user = await checkSuperAdmin(request)
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
