// ============================================
// Two-Factor Service - خدمة المصادقة الثنائية
// ============================================

import { twoFactorRepository } from '@/repositories/two-factor.repository'
import { 
  TwoFactorStatus,
  TwoFactorActionInput,
  TwoFactorActionResponse
} from '@/models/two-factor.model'
import { 
  verify2FA, 
  enable2FA, 
  confirm2FA, 
  disable2FA, 
  regenerateBackupCodes 
} from '@/lib/two-factor-auth'

export const twoFactorService = {
  // الحصول على حالة 2FA
  async getStatus(userId: string): Promise<TwoFactorStatus> {
    const user = await twoFactorRepository.getStatus(userId)

    return {
      enabled: user?.twoFactorEnabled || false,
      hasSecret: !!user?.twoFactorSecret,
      backupCodesCount: user?.twoFactorBackupCodes 
        ? JSON.parse(user.twoFactorBackupCodes).length 
        : 0,
    }
  },

  // تنفيذ إجراء 2FA
  async executeAction(userId: string, input: TwoFactorActionInput): Promise<TwoFactorActionResponse> {
    switch (input.action) {
      case 'enable': {
        const result = await enable2FA(userId)
        return {
          success: true,
          data: result,
          message: 'يرجى مسح رمز QR بتطبيق المصادقة',
        }
      }

      case 'confirm': {
        if (!input.token) {
          return {
            success: false,
            error: 'رمز التحقق مطلوب',
          }
        }

        const success = await confirm2FA(userId, input.token)
        
        if (success) {
          return {
            success: true,
            message: 'تم تفعيل المصادقة الثنائية بنجاح',
          }
        } else {
          return {
            success: false,
            error: 'رمز التحقق غير صحيح',
          }
        }
      }

      case 'disable': {
        if (!input.token) {
          return {
            success: false,
            error: 'رمز التحقق مطلوب',
          }
        }

        const isValid = await verify2FA(userId, input.token)
        if (!isValid) {
          return {
            success: false,
            error: 'رمز التحقق غير صحيح',
          }
        }

        await disable2FA(userId)
        
        return {
          success: true,
          message: 'تم تعطيل المصادقة الثنائية',
        }
      }

      case 'verify': {
        if (!input.token) {
          return {
            success: false,
            error: 'رمز التحقق مطلوب',
          }
        }

        const isValid = await verify2FA(userId, input.token)
        
        return {
          success: true,
          data: { valid: isValid },
        }
      }

      case 'regenerate-backup': {
        const backupCodes = await regenerateBackupCodes(userId)
        
        return {
          success: true,
          data: { backupCodes },
          message: 'تم إنشاء أكواد طوارئ جديدة',
        }
      }

      default:
        return {
          success: false,
          error: 'إجراء غير صالح',
        }
    }
  },
}
