/**
 * Auth Controller
 * متحكم المصادقة
 */

import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'
import type { LoginInput, RegisterInput } from '@/models/auth.model'

export const authController = {
  /**
   * تسجيل الدخول
   */
  async login(request: NextRequest) {
    try {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
          { status: 400 }
        )
      }

      const result = await authService.login({ email, password }, request)

      return NextResponse.json({
        success: true,
        data: result,
        message: 'تم تسجيل الدخول بنجاح'
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل تسجيل الدخول' },
        { status: 401 }
      )
    }
  },

  /**
   * تسجيل مستخدم جديد
   */
  async register(request: NextRequest) {
    try {
      const body = await request.json()
      const { name, email, password, phone, companyId, branchId, role } = body

      if (!name || !email || !password) {
        return NextResponse.json(
          { success: false, error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' },
          { status: 400 }
        )
      }

      // التحقق من قوة كلمة المرور
      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
          { status: 400 }
        )
      }

      const result = await authService.register({
        name,
        email,
        password,
        phone,
        companyId,
        branchId,
        role
      })

      return NextResponse.json({
        success: true,
        data: result,
        message: 'تم إنشاء الحساب بنجاح'
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل إنشاء الحساب' },
        { status: 400 }
      )
    }
  },

  /**
   * الحصول على المستخدم الحالي
   */
  async me(request: NextRequest) {
    try {
      const user = await authService.me()

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        data: user
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل الحصول على بيانات المستخدم' },
        { status: 500 }
      )
    }
  },

  /**
   * تسجيل الخروج
   */
  async logout(request: NextRequest) {
    try {
      const user = await authService.me()
      const result = await authService.logout(user?.id, request)

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل تسجيل الخروج' },
        { status: 500 }
      )
    }
  }
}
