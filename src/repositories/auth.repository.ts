/**
 * Auth Repository
 * مستودع بيانات المصادقة
 */

import { db } from '@/lib/db'
import type { AuthUser, RegisterInput } from '@/models/auth.model'

export const authRepository = {
  /**
   * البحث عن مستخدم بالبريد الإلكتروني
   */
  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        Company: { select: { id: true, name: true, code: true } },
        Branch: { select: { id: true, name: true, code: true } },
        Role: {
          include: {
            RolePermission: {
              include: { permission: true }
            }
          }
        }
      }
    })
  },

  /**
   * البحث عن مستخدم بالمعرف
   */
  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        Company: { select: { id: true, name: true, code: true } },
        Branch: { select: { id: true, name: true, code: true } },
        Role: {
          include: {
            RolePermission: {
              include: { permission: true }
            }
          }
        }
      }
    })
  },

  /**
   * إنشاء مستخدم جديد
   */
  async create(data: RegisterInput & { hashedPassword: string }) {
    return db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.hashedPassword,
        phone: data.phone,
        companyId: data.companyId,
        branchId: data.branchId,
        role: data.role || 'AGENT',
        active: true
      },
      include: {
        Company: { select: { id: true, name: true, code: true } },
        Branch: { select: { id: true, name: true, code: true } }
      }
    })
  },

  /**
   * تحديث آخر تسجيل دخول
   */
  async updateLastLogin(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    })
  },

  /**
   * إنشاء سجل تدقيق
   */
  async createAuditLog(data: {
    userId?: string
    companyId?: string | null
    branchId?: string | null
    action: string
    entityType: string
    entityId: string
    ipAddress?: string
    userAgent?: string
    oldData?: any
    newData?: any
  }) {
    try {
      return await db.auditLog.create({ data })
    } catch {
      // Ignore audit log errors
      return null
    }
  },

  /**
   * تحويل بيانات المستخدم للشكل المطلوب
   */
  mapToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nameAr: user.nameAr,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      active: user.active,
      avatar: user.avatar,
      company: user.Company,
      branch: user.Branch
    }
  }
}
