// نظام تحديد معدل الطلبات (Rate Limiting)
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // نافذة الوقت بالملي ثانية
  maxRequests: number // الحد الأقصى للطلبات
  message?: string // رسالة الخطأ
  keyGenerator?: (req: NextRequest) => string // مولد المفتاح
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    blocked: boolean
  }
}

// تخزين مؤقت للحدود
const rateLimitStore: RateLimitStore = {}

// تنظيف السجلات القديمة كل دقيقة
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(rateLimitStore).forEach(key => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key]
      }
    })
  }, 60000)
}

// مولد المفتاح الافتراضي
const defaultKeyGenerator = (req: NextRequest): string => {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
  return `${ip}`
}

// إنشاء middleware للحد من الطلبات
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs = 60000, // دقيقة افتراضياً
    maxRequests = 100, // 100 طلب افتراضياً
    message = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
    keyGenerator = defaultKeyGenerator,
  } = config

  return async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const key = keyGenerator(req)
    const now = Date.now()
    
    const record = rateLimitStore[key]
    
    if (!record || record.resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
        blocked: false,
      }
      return null
    }
    
    if (record.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
          },
        }
      )
    }
    
    record.count++
    
    if (record.count > maxRequests) {
      record.blocked = true
      return NextResponse.json(
        {
          success: false,
          error: message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
          },
        }
      )
    }
    
    return null
  }
}

// حدود معدلة مسبقاً
export const rateLimiters = {
  general: createRateLimiter({
    windowMs: 60000,
    maxRequests: 100,
  }),
  
  auth: createRateLimiter({
    windowMs: 60000,
    maxRequests: 5,
    message: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى الانتظار دقيقة.',
  }),
  
  api: createRateLimiter({
    windowMs: 60000,
    maxRequests: 60,
  }),
  
  create: createRateLimiter({
    windowMs: 60000,
    maxRequests: 20,
    message: 'تم تجاوز حد إنشاء السجلات. يرجى الانتظار.',
  }),
  
  search: createRateLimiter({
    windowMs: 60000,
    maxRequests: 30,
  }),
  
  export: createRateLimiter({
    windowMs: 60000,
    maxRequests: 5,
    message: 'تم تجاوز حد التصدير. يرجى الانتظار.',
  }),
}

// Helper function
export async function applyRateLimit(
  req: NextRequest,
  limiter: keyof typeof rateLimiters = 'general'
): Promise<NextResponse | null> {
  const limitFn = rateLimiters[limiter]
  if (limitFn) {
    return limitFn(req)
  }
  return null
}
