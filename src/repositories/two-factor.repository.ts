// ============================================
// Two-Factor Repository - مستودع المصادقة الثنائية
// ============================================

import { db } from '@/lib/db'

export const twoFactorRepository = {
  // جلب حالة 2FA للمستخدم
  async getStatus(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    })
  },

  // تحديث حالة 2FA
  async updateStatus(userId: string, enabled: boolean) {
    return db.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    })
  },

  // حفظ السر
  async saveSecret(userId: string, secret: string, backupCodes: string[]) {
    return db.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    })
  },

  // تعطيل 2FA
  async disable(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    })
  },

  // تحديث أكواد الطوارئ
  async updateBackupCodes(userId: string, backupCodes: string[]) {
    return db.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    })
  },

  // جلب السر للمستخدم
  async getSecret(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    })
    return user?.twoFactorSecret
  },
}
