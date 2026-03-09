import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { verify2FA, enable2FA, confirm2FA, disable2FA, regenerateBackupCodes } from '@/lib/two-factor-auth'
import { applyRateLimit } from '@/lib/rate-limit'

// GET - الحصول على حالة 2FA
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        enabled: fullUser?.twoFactorEnabled || false,
        hasSecret: !!fullUser?.twoFactorSecret,
        backupCodesCount: fullUser?.twoFactorBackupCodes 
          ? JSON.parse(fullUser.twoFactorBackupCodes).length 
          : 0,
      },
    })
  } catch (error: any) {
    console.error('Get 2FA status error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب حالة المصادقة الثنائية' },
      { status: 500 }
    )
  }
}

// POST - تفعيل/تعطيل/التحقق من 2FA
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'auth')
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const body = await request.json()
    const { action, token } = body

    switch (action) {
      case 'enable': {
        const result = await enable2FA(user.id)
        return NextResponse.json({
          success: true,
          data: result,
          message: 'يرجى مسح رمز QR بتطبيق المصادقة',
        })
      }

      case 'confirm': {
        if (!token) {
          return NextResponse.json(
            { error: 'رمز التحقق مطلوب' },
            { status: 400 }
          )
        }

        const success = await confirm2FA(user.id, token)
        
        if (success) {
          return NextResponse.json({
            success: true,
            message: 'تم تفعيل المصادقة الثنائية بنجاح',
          })
        } else {
          return NextResponse.json(
            { error: 'رمز التحقق غير صحيح' },
            { status: 400 }
          )
        }
      }

      case 'disable': {
        if (!token) {
          return NextResponse.json(
            { error: 'رمز التحقق مطلوب' },
            { status: 400 }
          )
        }

        const isValid = await verify2FA(user.id, token)
        if (!isValid) {
          return NextResponse.json(
            { error: 'رمز التحقق غير صحيح' },
            { status: 400 }
          )
        }

        await disable2FA(user.id)
        
        return NextResponse.json({
          success: true,
          message: 'تم تعطيل المصادقة الثنائية',
        })
      }

      case 'verify': {
        if (!token) {
          return NextResponse.json(
            { error: 'رمز التحقق مطلوب' },
            { status: 400 }
          )
        }

        const isValid = await verify2FA(user.id, token)
        
        return NextResponse.json({
          success: true,
          data: { valid: isValid },
        })
      }

      case 'regenerate-backup': {
        const backupCodes = await regenerateBackupCodes(user.id)
        
        return NextResponse.json({
          success: true,
          data: { backupCodes },
          message: 'تم إنشاء أكواد طوارئ جديدة',
        })
      }

      default:
        return NextResponse.json(
          { error: 'إجراء غير صالح' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('2FA error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في معالجة المصادقة الثنائية' },
      { status: 500 }
    )
  }
}
