/**
 * Auth Service
 * خدمات المصادقة
 */

import { authRepository } from '@/repositories/auth.repository'
import { verifyPassword, hashPassword } from '@/lib/utils/password'
import { generateToken, setAuthCookie, clearAuthCookie, getCurrentUser } from '@/lib/auth'
import type { LoginInput, RegisterInput, AuthResponse } from '@/models/auth.model'

export const authService = {
  /**
   * تسجيل الدخول
   */
  async login(input: LoginInput, request?: any): Promise<AuthResponse> {
    const { email, password } = input

    // البحث عن المستخدم
    const user = await authRepository.findByEmail(email)
    if (!user) {
      throw new Error('بيانات الدخول غير صحيحة')
    }

    // التحقق من كلمة المرور
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      throw new Error('بيانات الدخول غير صحيحة')
    }

    // التحقق من حالة المستخدم
    if (!user.active) {
      throw new Error('الحساب غير مفعل. يرجى التواصل مع الإدارة')
    }

    // إنشاء رمز JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId
    })

    // تعيين الكوكي
    await setAuthCookie(token)

    // تحديث آخر تسجيل دخول
    await authRepository.updateLastLogin(user.id)

    // إنشاء سجل تدقيق
    try {
      await authRepository.createAuditLog({
        userId: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: this.getClientIp(request),
        userAgent: request?.headers?.get?.('user-agent') || 'unknown'
      })
    } catch {
      // Ignore audit log errors
    }

    return {
      user: authRepository.mapToAuthUser(user),
      token
    }
  },

  /**
   * تسجيل مستخدم جديد
   */
  async register(input: RegisterInput & { companyId: string }): Promise<AuthResponse> {
    const { name, email, password, phone, companyId, branchId, role } = input

    // التحقق من عدم وجود المستخدم
    const existingUser = await authRepository.findByEmail(email)
    if (existingUser) {
      throw new Error('البريد الإلكتروني مستخدم مسبقاً')
    }

    // تشفير كلمة المرور
    const hashedPassword = await hashPassword(password)

    // إنشاء المستخدم
    const user = await authRepository.create({
      name,
      email,
      password,
      hashedPassword,
      phone,
      companyId,
      branchId,
      role: role || 'AGENT'
    })

    // إنشاء رمز JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId
    })

    // تعيين الكوكي
    await setAuthCookie(token)

    return {
      user: authRepository.mapToAuthUser(user),
      token
    }
  },

  /**
   * الحصول على المستخدم الحالي
   */
  async me() {
    return getCurrentUser()
  },

  /**
   * تسجيل الخروج
   */
  async logout(userId?: string, request?: any) {
    // إنشاء سجل تدقيق
    if (userId) {
      try {
        await authRepository.createAuditLog({
          userId,
          action: 'LOGOUT',
          entityType: 'User',
          entityId: userId,
          ipAddress: this.getClientIp(request),
          userAgent: request?.headers?.get?.('user-agent') || 'unknown'
        })
      } catch {
        // Ignore audit log errors
      }
    }

    // حذف الكوكي
    await clearAuthCookie()

    return { success: true, message: 'تم تسجيل الخروج بنجاح' }
  },

  /**
   * الحصول على عنوان IP
   */
  getClientIp(request?: any): string {
    if (!request) return 'unknown'
    return request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers?.get?.('x-real-ip') ||
           'unknown'
  }
}
