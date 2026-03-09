// نظام التخزين المؤقت المحسن
// Cache System with Memory and LocalStorage Support

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  tags?: string[]
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] // Tags for group invalidation
  persist?: boolean // Persist to localStorage
}

class CacheManager {
  private memoryCache: Map<string, CacheItem<any>> = new Map()
  private defaultTTL = 60000 // دقيقة افتراضياً
  private maxSize = 100 // الحد الأقصى للعناصر في الذاكرة

  constructor() {
    // تنظيف الذاكرة كل دقيقة
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  // تخزين قيمة
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options.tags,
    }

    // تخزين في الذاكرة
    this.memoryCache.set(key, item)

    // التحقق من الحجم
    if (this.memoryCache.size > this.maxSize) {
      this.evictOldest()
    }

    // تخزين في localStorage إذا كان مطلوباً
    if (options.persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(item))
      } catch (e) {
        // localStorage might be full
        console.warn('Cache localStorage full, clearing old items')
        this.clearPersisted()
      }
    }
  }

  // الحصول على قيمة
  get<T>(key: string): T | null {
    // البحث في الذاكرة أولاً
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data as T
    }

    // البحث في localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache_${key}`)
        if (stored) {
          const item: CacheItem<T> = JSON.parse(stored)
          if (!this.isExpired(item)) {
            // إعادة للذاكرة
            this.memoryCache.set(key, item)
            return item.data
          } else {
            localStorage.removeItem(`cache_${key}`)
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    return null
  }

  // الحصول على قيمة أو إنشاء جديدة
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, options)
    return data
  }

  // حذف عنصر
  delete(key: string): void {
    this.memoryCache.delete(key)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`)
    }
  }

  // حذف حسب الوسوم
  deleteByTag(tag: string): void {
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.tags?.includes(tag)) {
        this.memoryCache.delete(key)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cache_${key}`)
        }
      }
    }
  }

  // حذف جميع العناصر
  clear(): void {
    this.memoryCache.clear()
    if (typeof window !== 'undefined') {
      this.clearPersisted()
    }
  }

  // التحقق من انتهاء الصلاحية
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.timestamp + item.ttl
  }

  // تنظيف العناصر المنتهية
  private cleanup(): void {
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cache_${key}`)
        }
      }
    }
  }

  // حذف أقدم عنصر
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey)
    }
  }

  // تنظيف localStorage
  private clearPersisted(): void {
    if (typeof window === 'undefined') return

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('cache_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  // إحصائيات
  stats(): { size: number; keys: string[] } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    }
  }
}

// إنشاء نسخة واحدة من الـ Cache Manager
export const cache = new CacheManager()

// مفاتيح التخزين المؤقت
export const CacheKeys = {
  // الداشبورد
  DASHBOARD_STATS: 'dashboard_stats',
  
  // العملاء
  CUSTOMERS_LIST: 'customers_list',
  CUSTOMER_DETAIL: (id: string) => `customer_${id}`,
  CUSTOMER_STATEMENT: (id: string) => `customer_statement_${id}`,
  
  // المنتجات
  PRODUCTS_LIST: 'products_list',
  PRODUCT_DETAIL: (id: string) => `product_${id}`,
  CATEGORIES_TREE: 'categories_tree',
  
  // المخزون
  INVENTORY_LIST: 'inventory_list',
  LOW_STOCK: 'low_stock_items',
  
  // الفواتير
  INVOICES_LIST: 'invoices_list',
  INVOICE_DETAIL: (id: string) => `invoice_${id}`,
  
  // الأقساط
  INSTALLMENTS_LIST: 'installments_list',
  CONTRACTS_LIST: 'contracts_list',
  DUE_INSTALLMENTS: 'due_installments',
  
  // المدفوعات
  PAYMENTS_LIST: 'payments_list',
  
  // العمولات
  COMMISSION_SUMMARY: 'commission_summary',
  AGENT_COMMISSIONS: (id: string) => `agent_commissions_${id}`,
  
  // التقارير
  SALES_REPORT: 'sales_report',
  COLLECTION_REPORT: 'collection_report',
  
  // الإعدادات
  COMPANY_SETTINGS: 'company_settings',
  USER_SETTINGS: (id: string) => `user_settings_${id}`,
} as const

// أوقات التخزين المؤقت
export const CacheTTL = {
  SHORT: 30000, // 30 ثانية
  MEDIUM: 60000, // دقيقة
  LONG: 300000, // 5 دقائق
  VERY_LONG: 900000, // 15 دقيقة
  HOUR: 3600000, // ساعة
} as const

// وسمات التخزين
export const CacheTags = {
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  INSTALLMENTS: 'installments',
  COMMISSIONS: 'commissions',
  REPORTS: 'reports',
  SETTINGS: 'settings',
} as const

// Helper function للتخزين المؤقت للـ API calls
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  return cache.getOrSet(key, fetcher, options)
}

// Invalidate cache for specific entity
export function invalidateEntity(entity: string, id?: string): void {
  const tag = entity.toLowerCase()
  cache.deleteByTag(tag)
  
  if (id) {
    cache.delete(`${entity.toLowerCase()}_${id}`)
  }
}
