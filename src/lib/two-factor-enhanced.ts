// نظام المصادقة الثنائية (Two-Factor Authentication)
// Supports TOTP (Time-based OTP) with backup codes

import { db } from '@/lib/db'
import crypto from 'crypto'
import { authenticator } from 'otplib'

// ===================== TYPES =====================
interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

interface TwoFactorVerify {
  success: boolean
  error?: string
}

// ===================== TOTP CONFIGURATION =====================
const ISSUER = 'ERP أقساطي'
const BACKUP_CODES_COUNT = 10
const BACKUP_CODE_LENGTH = 8

// ===================== SETUP FUNCTIONS =====================

// إنشاء إعداد 2FA جديد
export async function setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
  // توليد Secret جديد
  const secret = authenticator.generateSecret()
  
  // الحصول على معلومات المستخدم
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }
  })
  
  if (!user) {
    throw new Error('المستخدم غير موجود')
  }
  
  // إنشاء QR Code URL
  const qrCodeUrl = authenticator.keyuri(
    user.email,
    ISSUER,
    secret
  )
  
  // توليد أكواد الاحتياط
  const backupCodes = generateBackupCodes()
  
  return {
    secret,
    qrCodeUrl,
    backupCodes
  }
}

// تأكيد إعداد 2FA
export async function confirmTwoFactorSetup(
  userId: string,
  secret: string,
  code: string,
  backupCodes: string[]
): Promise<TwoFactorVerify> {
  // التحقق من الكود
  const isValid = verifyTOTP(secret, code)
  
  if (!isValid) {
    return { success: false, error: 'الكود غير صحيح' }
  }
  
  // حفظ الإعدادات
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(hashBackupCodes(backupCodes))
    }
  })
  
  return { success: true }
}

// تعطيل 2FA
export async function disableTwoFactor(userId: string, code: string): Promise<TwoFactorVerify> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorBackupCodes: true }
  })
  
  if (!user || !user.twoFactorSecret) {
    return { success: false, error: 'المصادقة الثنائية غير مفعلة' }
  }
  
  // التحقق من الكود
  const isValid = verifyTOTP(user.twoFactorSecret, code) || 
                  verifyBackupCode(user.twoFactorBackupCodes, code)
  
  if (!isValid) {
    return { success: false, error: 'الكود غير صحيح' }
  }
  
  // تعطيل 2FA
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null
    }
  })
  
  return { success: true }
}

// ===================== VERIFICATION FUNCTIONS =====================

// التحقق من كود TOTP
export function verifyTOTP(secret: string, code: string): boolean {
  try {
    // السماح بكود من فترة زمنية واحدة قبل/بعد
    return authenticator.verify({
      token: code,
      secret,
      window: 1
    })
  } catch {
    return false
  }
}

// التحقق من كود احتياطي
export function verifyBackupCode(hashedCodes: string | null, code: string): boolean {
  if (!hashedCodes) return false
  
  try {
    const codes = JSON.parse(hashedCodes) as string[]
    const hashedCode = hashBackupCode(code)
    
    if (codes.includes(hashedCode)) {
      // إزالة الكود المستخدم (يُستخدم مرة واحدة)
      const updatedCodes = codes.filter(c => c !== hashedCode)
      // سيتم تحديثه في خطوة لاحقة
      return true
    }
    
    return false
  } catch {
    return false
  }
}

// التحقق من 2FA عند تسجيل الدخول
export async function verifyTwoFactorLogin(
  userId: string,
  code: string
): Promise<TwoFactorVerify & { remainingCodes?: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { 
      twoFactorSecret: true, 
      twoFactorEnabled: true,
      twoFactorBackupCodes: true 
    }
  })
  
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: 'المصادقة الثنائية غير مفعلة' }
  }
  
  // التحقق من TOTP
  if (verifyTOTP(user.twoFactorSecret, code)) {
    return { success: true }
  }
  
  // التحقق من كود احتياطي
  if (user.twoFactorBackupCodes) {
    try {
      const codes = JSON.parse(user.twoFactorBackupCodes) as string[]
      const hashedCode = hashBackupCode(code)
      
      if (codes.includes(hashedCode)) {
        // إزالة الكود المستخدم
        const updatedCodes = codes.filter(c => c !== hashedCode)
        
        await db.user.update({
          where: { id: userId },
          data: {
            twoFactorBackupCodes: JSON.stringify(updatedCodes)
          }
        })
        
        return { 
          success: true, 
          remainingCodes: updatedCodes.length 
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }
  
  return { success: false, error: 'الكود غير صحيح' }
}

// ===================== HELPER FUNCTIONS =====================

// توليد أكواد احتياطية
function generateBackupCodes(): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = crypto
      .randomBytes(Math.ceil(BACKUP_CODE_LENGTH / 2))
      .toString('hex')
      .slice(0, BACKUP_CODE_LENGTH)
      .toUpperCase()
    
    // تنسيق الكود: XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  
  return codes
}

// تشفير كود احتياطي
function hashBackupCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace('-', ''))
    .digest('hex')
    .slice(0, 16)
}

// تشفير مجموعة أكواد احتياطية
function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => hashBackupCode(code))
}

// توليد أسرار جديدة للمستخدمين
export function generateNewSecret(): string {
  return authenticator.generateSecret()
}

// توليد كود TOTP للاختبار
export function generateTestCode(secret: string): string {
  return authenticator.generate(secret)
}

// ===================== STATUS FUNCTIONS =====================

// التحقق من حالة 2FA للمستخدم
export async function getTwoFactorStatus(userId: string): Promise<{
  enabled: boolean
  hasBackupCodes: boolean
  backupCodesCount: number
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { 
      twoFactorEnabled: true,
      twoFactorBackupCodes: true 
    }
  })
  
  if (!user) {
    return { enabled: false, hasBackupCodes: false, backupCodesCount: 0 }
  }
  
  let backupCodesCount = 0
  if (user.twoFactorBackupCodes) {
    try {
      const codes = JSON.parse(user.twoFactorBackupCodes) as string[]
      backupCodesCount = codes.length
    } catch {
      // Ignore
    }
  }
  
  return {
    enabled: user.twoFactorEnabled,
    hasBackupCodes: backupCodesCount > 0,
    backupCodesCount
  }
}

// إعادة توليد أكواد احتياطية
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true }
  })
  
  if (!user || !user.twoFactorEnabled) {
    throw new Error('يجب تفعيل المصادقة الثنائية أولاً')
  }
  
  const backupCodes = generateBackupCodes()
  
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorBackupCodes: JSON.stringify(hashBackupCodes(backupCodes))
    }
  })
  
  return backupCodes
}
