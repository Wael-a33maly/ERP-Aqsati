// نظام تحديد معدل الطلبات المحسن (Enhanced Rate Limiting)
// يدعم Sliding Window و Role-based Limits

import { NextRequest, NextResponse } from 'next/server'

// ===================== TYPES =====================
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  keyGenerator?: (req: NextRequest) => string
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
  enableBurst?: boolean
  burstLimit?: number
}

interface SlidingWindowEntry {
  timestamp: number
  count: number
}

interface RateLimitStore {
  [key: string]: {
    slidingWindow: SlidingWindowEntry[]
    blocked: boolean
    blockedUntil: number
    burstCount: number
    burstResetTime: number
  }
}

interface RoleLimits {
  [role: string]: {
    requestsPerMinute: number
    requestsPerHour: number
    burstLimit: number
  }
}

// ===================== CONFIGURATION =====================
// حدود معدلة حسب الدور للـ SaaS
const ROLE_LIMITS: RoleLimits = {
  SUPER_ADMIN: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    burstLimit: 50
  },
  COMPANY_ADMIN: {
    requestsPerMinute: 200,
    requestsPerHour: 3000,
    burstLimit: 30
  },
  BRANCH_MANAGER: {
    requestsPerMinute: 150,
    requestsPerHour: 2000,
    burstLimit: 25
  },
  AGENT: {
    requestsPerMinute: 100,
    requestsPerHour: 1500,
    burstLimit: 20
  },
  COLLECTOR: {
    requestsPerMinute: 80,
    requestsPerHour: 1000,
    burstLimit: 15
  },
  ANONYMOUS: {
    requestsPerMinute: 30,
    requestsPerHour: 300,
    burstLimit: 5
  }
}

// حدود أنواع العمليات المختلفة
const OPERATION_LIMITS = {
  // عمليات القراءة - حدود أعلى
  read: { perMinute: 100, perHour: 2000 },
  // عمليات الكتابة - حدود أقل
  write: { perMinute: 30, perHour: 500 },
  // عمليات البحث - حدود متوسطة
  search: { perMinute: 60, perHour: 1000 },
  // عمليات التصدير - حدود منخفضة
  export: { perMinute: 5, perHour: 50 },
  // عمليات المصادقة - حدود صارمة
  auth: { perMinute: 5, perHour: 20 }
}

// ===================== STORE =====================
const rateLimitStore: RateLimitStore = {}

// تنظيف السجلات القديمة كل دقيقة
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(rateLimitStore).forEach(key => {
      const entry = rateLimitStore[key]
      // إزالة الإدخالات القديمة من النافذة المنزلقة
      entry.slidingWindow = entry.slidingWindow.filter(
        w => w.timestamp > now - 3600000 // ساعة واحدة
      )
      // إزالة المفاتيح بالكامل إذا كانت فارغة ومفعلة
      if (entry.slidingWindow.length === 0 && !entry.blocked) {
        delete rateLimitStore[key]
      }
    })
  }, 60000)
}

// ===================== KEY GENERATORS =====================
const defaultKeyGenerator = (req: NextRequest): string => {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
  return `${ip}`
}

const userKeyGenerator = (req: NextRequest, userId?: string): string => {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
  return userId ? `user:${userId}` : `ip:${ip}`
}

// ===================== SLIDING WINDOW ALGORITHM =====================
function getSlidingWindowCount(
  key: string,
  windowMs: number
): { count: number; oldestTimestamp: number } {
  const now = Date.now()
  const entry = rateLimitStore[key]
  
  if (!entry) {
    return { count: 0, oldestTimestamp: now }
  }
  
  // حساب الطلبات في النافذة الزمنية
  const windowStart = now - windowMs
  const relevantEntries = entry.slidingWindow.filter(w => w.timestamp > windowStart)
  
  const count = relevantEntries.reduce((sum, w) => sum + w.count, 0)
  const oldestTimestamp = relevantEntries.length > 0 
    ? Math.min(...relevantEntries.map(w => w.timestamp))
    : now
  
  return { count, oldestTimestamp }
}

function recordRequest(key: string): void {
  const now = Date.now()
  
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      slidingWindow: [],
      blocked: false,
      blockedUntil: 0,
      burstCount: 0,
      burstResetTime: now + 1000 // ثانية واحدة للـ burst
    }
  }
  
  const entry = rateLimitStore[key]
  
  // تحديث الـ burst
  if (now > entry.burstResetTime) {
    entry.burstCount = 1
    entry.burstResetTime = now + 1000
  } else {
    entry.burstCount++
  }
  
  // إضافة للنافذة المنزلقة
  const lastEntry = entry.slidingWindow[entry.slidingWindow.length - 1]
  if (lastEntry && lastEntry.timestamp > now - 1000) {
    lastEntry.count++
  } else {
    entry.slidingWindow.push({ timestamp: now, count: 1 })
  }
}

// ===================== MAIN RATE LIMITER =====================
export function createEnhancedRateLimiter(config: RateLimitConfig) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    message = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
    keyGenerator = defaultKeyGenerator,
    enableBurst = true,
    burstLimit = 10
  } = config

  return async function rateLimitMiddleware(
    req: NextRequest,
    context?: { userId?: string; userRole?: string }
  ): Promise<NextResponse | null> {
    const key = context?.userId 
      ? userKeyGenerator(req, context.userId)
      : keyGenerator(req)
    const now = Date.now()
    
    // الحصول على حدود المستخدم حسب الدور
    const roleLimits = ROLE_LIMITS[context?.userRole || 'ANONYMOUS']
    const effectiveMaxRequests = Math.min(maxRequests, roleLimits.requestsPerMinute)
    const effectiveBurstLimit = Math.min(burstLimit, roleLimits.burstLimit)
    
    const entry = rateLimitStore[key]
    
    // التحقق من الحظر
    if (entry?.blocked && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000)
      return createRateLimitResponse(message, retryAfter, effectiveMaxRequests, 0)
    }
    
    // إلغاء الحظر إذا انتهى الوقت
    if (entry?.blocked && entry.blockedUntil <= now) {
      entry.blocked = false
      entry.blockedUntil = 0
    }
    
    // فحص الـ Burst
    if (enableBurst && entry && entry.burstCount >= effectiveBurstLimit) {
      if (now < entry.burstResetTime) {
        const retryAfter = Math.ceil((entry.burstResetTime - now) / 1000)
        return createRateLimitResponse(
          'طلبات كثيرة جداً في وقت قصير. يرجى الانتظار.',
          retryAfter,
          effectiveMaxRequests,
          0,
          true
        )
      }
    }
    
    // فحص النافذة المنزلقة
    const { count } = getSlidingWindowCount(key, windowMs)
    
    if (count >= effectiveMaxRequests) {
      // حظر مؤقت
      if (!rateLimitStore[key]) {
        rateLimitStore[key] = {
          slidingWindow: [],
          blocked: true,
          blockedUntil: now + 60000, // حظر دقيقة
          burstCount: 0,
          burstResetTime: now + 1000
        }
      } else {
        rateLimitStore[key].blocked = true
        rateLimitStore[key].blockedUntil = now + 60000
      }
      
      const retryAfter = 60
      return createRateLimitResponse(message, retryAfter, effectiveMaxRequests, 0)
    }
    
    // تسجيل الطلب
    recordRequest(key)
    
    const remaining = effectiveMaxRequests - count - 1
    const resetTime = Math.ceil((now + windowMs) / 1000)
    
    // إضافة headers للـ response التالي
    return null // لا يوجد حظر
  }
}

function createRateLimitResponse(
  message: string,
  retryAfter: number,
  limit: number,
  remaining: number,
  isBurst: boolean = false
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      retryAfter,
      isBurst,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + retryAfter),
        'X-RateLimit-Resource': isBurst ? 'burst' : 'standard',
        'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
      }
    }
  )
}

// ===================== PRESETS =====================
export const enhancedRateLimiters = {
  // عام - للأغراض العامة
  general: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    enableBurst: true,
    burstLimit: 15
  }),
  
  // مصادقة - صارم جداً
  auth: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 5,
    message: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى الانتظار دقيقة.',
    enableBurst: true,
    burstLimit: 3
  }),
  
  // API عام
  api: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 60,
    enableBurst: true,
    burstLimit: 10
  }),
  
  // إنشاء سجلات
  create: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 30,
    message: 'تم تجاوز حد إنشاء السجلات. يرجى الانتظار.',
    enableBurst: true,
    burstLimit: 5
  }),
  
  // بحث
  search: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 60,
    message: 'تم تجاوز حد البحث. يرجى الانتظار.',
    enableBurst: true,
    burstLimit: 10
  }),
  
  // تصدير
  export: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 5,
    message: 'تم تجاوز حد التصدير. يرجى الانتظار.',
    enableBurst: false
  }),
  
  // قراءة
  read: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    enableBurst: true,
    burstLimit: 20
  }),
  
  // كتابة
  write: createEnhancedRateLimiter({
    windowMs: 60000,
    maxRequests: 30,
    enableBurst: true,
    burstLimit: 5
  })
}

// ===================== HELPER FUNCTIONS =====================
export async function applyEnhancedRateLimit(
  req: NextRequest,
  limiter: keyof typeof enhancedRateLimiters = 'general',
  context?: { userId?: string; userRole?: string }
): Promise<NextResponse | null> {
  const limitFn = enhancedRateLimiters[limiter]
  if (limitFn) {
    return limitFn(req, context)
  }
  return null
}

// الحصول على حالة الـ Rate Limit للمستخدم
export function getRateLimitStatus(key: string): {
  minuteCount: number
  hourCount: number
  isBlocked: boolean
  blockedUntil: number | null
} {
  const entry = rateLimitStore[key]
  const now = Date.now()
  
  if (!entry) {
    return { minuteCount: 0, hourCount: 0, isBlocked: false, blockedUntil: null }
  }
  
  const minuteCount = entry.slidingWindow
    .filter(w => w.timestamp > now - 60000)
    .reduce((sum, w) => sum + w.count, 0)
  
  const hourCount = entry.slidingWindow
    .filter(w => w.timestamp > now - 3600000)
    .reduce((sum, w) => sum + w.count, 0)
  
  return {
    minuteCount,
    hourCount,
    isBlocked: entry.blocked && entry.blockedUntil > now,
    blockedUntil: entry.blockedUntil > now ? entry.blockedUntil : null
  }
}

// إعادة تعيين حدود المستخدم (للمدراء)
export function resetUserRateLimit(key: string): boolean {
  if (rateLimitStore[key]) {
    delete rateLimitStore[key]
    return true
  }
  return false
}

// إحصائيات النظام
export function getRateLimitStats(): {
  totalKeys: number
  blockedKeys: number
  averageRequestsPerKey: number
} {
  const keys = Object.keys(rateLimitStore)
  const blockedKeys = keys.filter(k => rateLimitStore[k].blocked).length
  const totalRequests = keys.reduce((sum, k) => 
    sum + rateLimitStore[k].slidingWindow.reduce((s, w) => s + w.count, 0), 0
  )
  
  return {
    totalKeys: keys.length,
    blockedKeys,
    averageRequestsPerKey: keys.length > 0 ? Math.round(totalRequests / keys.length) : 0
  }
}
