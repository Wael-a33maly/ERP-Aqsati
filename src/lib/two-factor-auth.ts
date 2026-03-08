// نظام المصادقة الثنائية (2FA)
import { db } from '@/lib/db'
import crypto from 'crypto'

// مولد OTP
export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

// مولد كود QR
export function generateQRCodeURI(email: string, secret: string, issuer: string = 'ERP Aqsati'): string {
  const encodedEmail = encodeURIComponent(email)
  const encodedIssuer = encodeURIComponent(issuer)
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}

// توليد سر TOTP
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20)
  return buffer.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .toUpperCase()
}

// التحقق من OTP
export function verifyTOTP(token: string, secret: string, window: number = 1): boolean {
  // تبسيط التحقق - في الإنتاج يجب استخدام مكتبة otpauth
  const expectedToken = generateTOTPFromSecret(secret)
  
  // التحقق من النافذة الزمنية (قبل وبعد)
  for (let i = -window; i <= window; i++) {
    const adjustedToken = generateTOTPFromSecret(secret, i * 30)
    if (token === adjustedToken) {
      return true
    }
  }
  
  return false
}

// توليد TOTP من السر
function generateTOTPFromSecret(secret: string, timeOffset: number = 0): string {
  const time = Math.floor((Date.now() + timeOffset) / 1000 / 30)
  const timeBuffer = Buffer.alloc(8)
  timeBuffer.writeBigUInt64BE(BigInt(time))
  
  // Hash using HMAC-SHA1
  const key = Buffer.from(secret, 'base64')
  const hmac = crypto.createHmac('sha1', key)
  hmac.update(timeBuffer)
  const hash = hmac.digest()
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f
  const code = ((hash[offset] & 0x7f) << 24 |
                (hash[offset + 1] & 0xff) << 16 |
                (hash[offset + 2] & 0xff) << 8 |
                (hash[offset + 3] & 0xff)) % 1000000
  
  return code.toString().padStart(6, '0')
}

// تفعيل 2FA للمستخدم
export async function enable2FA(userId: string): Promise<{ secret: string; qrUri: string; backupCodes: string[] }> {
  const secret = generateTOTPSecret()
  const backupCodes = Array.from({ length: 10 }, () => generateOTP(8))
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  
  const qrUri = generateQRCodeURI(user?.email || '', secret)
  
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false, // سيتم تفعيله بعد التحقق
      twoFactorBackupCodes: JSON.stringify(backupCodes),
    },
  })
  
  return { secret, qrUri, backupCodes }
}

// تأكيد تفعيل 2FA
export async function confirm2FA(userId: string, token: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  })
  
  if (!user?.twoFactorSecret) {
    return false
  }
  
  const isValid = verifyTOTP(token, user.twoFactorSecret)
  
  if (isValid) {
    await db.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    })
  }
  
  return isValid
}

// تعطيل 2FA
export async function disable2FA(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null,
    },
  })
}

// التحقق من 2FA عند تسجيل الدخول
export async function verify2FA(userId: string, token: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorBackupCodes: true },
  })
  
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return true // 2FA غير مفعل
  }
  
  // التحقق من OTP
  if (verifyTOTP(token, user.twoFactorSecret)) {
    return true
  }
  
  // التحقق من أكواد الطوارئ
  if (user.twoFactorBackupCodes) {
    const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[]
    const codeIndex = backupCodes.indexOf(token)
    
    if (codeIndex !== -1) {
      // إزالة الكود المستخدم
      backupCodes.splice(codeIndex, 1)
      await db.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
      })
      return true
    }
  }
  
  return false
}

// إنشاء أكواد طوارئ جديدة
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  // التحقق من أن 2FA مفعل
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  })
  
  if (!user?.twoFactorEnabled) {
    throw new Error('يجب تفعيل المصادقة الثنائية أولاً')
  }
  
  const backupCodes = Array.from({ length: 10 }, () => generateOTP(8))
  
  await db.user.update({
    where: { id: userId },
    data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
  })
  
  return backupCodes
}

// إرسال OTP عبر SMS (mock)
export async function sendOTPviaSMS(phone: string, otp: string): Promise<boolean> {
  // TODO: تكامل مع بوابة SMS
  console.log(`[SMS] Sending OTP ${otp} to ${phone}`)
  return true
}

// إرسال OTP عبر Email (mock)
export async function sendOTPviaEmail(email: string, otp: string): Promise<boolean> {
  // TODO: تكامل مع خدمة الإيميل
  console.log(`[Email] Sending OTP ${otp} to ${email}`)
  return true
}

// تخزين OTP مؤقتاً للتحقق لاحقاً
const otpStore = new Map<string, { otp: string; expiresAt: number }>()

// إنشاء وإرسال OTP للتحقق
export async function createAndSendOTP(identifier: string, type: 'sms' | 'email'): Promise<string> {
  const otp = generateOTP(6)
  const key = `${type}:${identifier}`
  
  // تخزين OTP لمدة 5 دقائق
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
  
  if (type === 'sms') {
    await sendOTPviaSMS(identifier, otp)
  } else {
    await sendOTPviaEmail(identifier, otp)
  }
  
  return otp
}

// التحقق من OTP المؤقت
export function verifyOTP(identifier: string, type: 'sms' | 'email', otp: string): boolean {
  const key = `${type}:${identifier}`
  const stored = otpStore.get(key)
  
  if (!stored) {
    return false
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key)
    return false
  }
  
  if (stored.otp === otp) {
    otpStore.delete(key)
    return true
  }
  
  return false
}
