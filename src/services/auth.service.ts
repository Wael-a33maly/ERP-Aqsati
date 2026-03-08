/**
 * Auth Service
 * خدمات المصادقة
 */

import { authRepository } from '@/repositories/auth.repository'
import { verifyPassword, hashPassword } from '@/lib/utils/password'
import { generateToken, setAuthCookie, clearAuthCookie, getCurrentUser } from '@/lib/auth'
import type { LoginInput, RegisterInput, AuthResponse, DebugAuthResponse, SuperAdminUpdateResult } from '@/models/auth.model'
import bcrypt from 'bcryptjs'

const SUPER_ADMIN_EMAIL = 'a33maly@gmail.com'
const SUPER_ADMIN_PASSWORD = 'WEGSMs@1983'

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
  },

  // ==================== Debug Auth ====================

  /**
   * تصحيح المصادقة
   */
  async debugAuth(email: string, password: string): Promise<DebugAuthResponse> {
    console.log('[Debug Auth] ===== START =====')
    console.log('[Debug Auth] Email:', email)
    console.log('[Debug Auth] Password length:', password.length)
    
    if (!email || !password) {
      throw new Error('Email and password required')
    }

    // البحث عن المستخدم
    const user = await authRepository.findUserForDebug(email.toLowerCase().trim())
    console.log('[Debug Auth] User found:', !!user)

    if (!user) {
      throw new Error('المستخدم غير موجود')
    }

    console.log('[Debug Auth] User active:', user.active)

    if (!user.active) {
      throw new Error('المستخدم غير مفعل')
    }

    // التحقق من كلمة المرور
    const isValid = await bcrypt.compare(password, user.password)
    console.log('[Debug Auth] Password valid:', isValid)

    if (!isValid) {
      throw new Error('كلمة المرور غير صحيحة')
    }

    console.log('[Debug Auth] Success! User:', user.email)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
        company: user.company,
        branch: user.branch
      },
      token: 'debug-token-' + Date.now()
    }
  },

  /**
   * تحديث بيانات السوبر أدمن
   */
  async updateSuperAdmin(): Promise<SuperAdminUpdateResult> {
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10)
    
    // البحث عن المستخدم
    const existingUser = await authRepository.findSuperAdmin(SUPER_ADMIN_EMAIL)
    
    if (existingUser) {
      // تحديث كلمة المرور
      await authRepository.updateUser(existingUser.id, {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true
      })
      
      return {
        success: true,
        message: 'تم تحديث كلمة مرور السوبر أدمن بنجاح',
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        isNew: false
      }
    } else {
      // إنشاء مستخدم جديد
      await authRepository.createSuperAdmin({
        email: SUPER_ADMIN_EMAIL,
        name: 'مدير النظام',
        nameAr: 'مدير النظام',
        password: hashedPassword
      })
      
      return {
        success: true,
        message: 'تم إنشاء السوبر أدمن الجديد بنجاح',
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        isNew: true
      }
    }
  },

  /**
   * الحصول على معلومات السوبر أدمن
   */
  async getSuperAdminInfo() {
    const user = await authRepository.findSuperAdmin(SUPER_ADMIN_EMAIL)
    return {
      exists: !!user,
      user
    }
  }
}
