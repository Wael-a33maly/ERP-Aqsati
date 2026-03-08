/**
 * Company Middleware - وسيط الشركة
 * 
 * يوفر وظائف مساعدة للتعامل مع فصل البيانات حسب الشركة
 * يستخدم في APIs لضمان أن كل شركة ترى بياناتها فقط
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// أنواع البيانات
export interface CompanyFilter {
  companyId: string
}

export interface CompanyUser {
  id: string
  email: string
  role: string
  companyId: string | null
  branchId: string | null
}

// أسماء الجداول التي تحتوي على companyId
export const COMPANY_SCOPED_TABLES = [
  'invoice',
  'payment',
  'product',
  'customer',
  'branch',
  'zone',
  'warehouse',
  'governorate',
  'city',
  'area',
  'commissionPolicy',
  'printTemplate',
  'reportTemplate',
  'productCategory',
  'companyPaymentGateway',
  'agentCommission',
  'agentLocation',
  'installment',
  'installmentContract',
  'installmentPayment',
  'paymentLink',
  'offlineSync'
] as const

// الأدوار التي لها صلاحية رؤية كل الشركات (Super Admin)
const GLOBAL_ACCESS_ROLES = ['SUPER_ADMIN']

/**
 * الحصول على فلتر الشركة من الطلب
 * يقرأ companyId من query params أو من المستخدم الحالي
 */
export function getCompanyFilterFromRequest(
  request: NextRequest,
  user: CompanyUser | null
): CompanyFilter | null {
  // إذا كان المستخدم Super Admin، يمكنه تحديد الشركة من query params
  if (user?.role && GLOBAL_ACCESS_ROLES.includes(user.role)) {
    const { searchParams } = new URL(request.url)
    const companyIdParam = searchParams.get('companyId')
    
    if (companyIdParam) {
      return { companyId: companyIdParam }
    }
    
    // Super Admin بدون تحديد شركة يرى كل البيانات
    return null
  }
  
  // المستخدم العادي يرى بيانات شركته فقط
  if (user?.companyId) {
    return { companyId: user.companyId }
  }
  
  return null
}

/**
 * الحصول على فلتر الشركة للاستعلام
 * يُستخدم في Prisma queries
 */
export function getCompanyFilter(
  companyId: string | null | undefined,
  user?: CompanyUser | null
): Record<string, string> | Record<string, never> {
  // إذا كان Super Admin ولم يتم تحديد شركة، لا نضيف فلتر
  if (user?.role && GLOBAL_ACCESS_ROLES.includes(user.role) && !companyId) {
    return {}
  }
  
  // إضافة فلتر الشركة
  if (companyId) {
    return { companyId }
  }
  
  // إذا كان المستخدم مرتبط بشركة
  if (user?.companyId) {
    return { companyId: user.companyId }
  }
  
  // لا يوجد شركة، لا نضيف فلتر
  return {}
}

/**
 * التحقق من صلاحية الوصول للشركة
 * يُستخدم قبل تنفيذ العمليات على البيانات
 */
export async function validateCompanyAccess(
  resourceId: string,
  resourceType: string,
  user: CompanyUser
): Promise<{ valid: boolean; error?: string }> {
  // Super Admin له صلاحية كاملة
  if (GLOBAL_ACCESS_ROLES.includes(user.role)) {
    return { valid: true }
  }
  
  // التحقق من أن المستخدم مرتبط بشركة
  if (!user.companyId) {
    return { valid: false, error: 'المستخدم غير مرتبط بشركة' }
  }
  
  try {
    // الحصول على المورد والتحقق من الشركة
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (db as Record<string, any>)[resourceType]
    
    if (!model) {
      return { valid: false, error: 'نوع المورد غير صالح' }
    }
    
    const resource = await model.findUnique({
      where: { id: resourceId },
      select: { companyId: true }
    })
    
    if (!resource) {
      return { valid: false, error: 'المورد غير موجود' }
    }
    
    if (resource.companyId !== user.companyId) {
      return { valid: false, error: 'لا تملك صلاحية الوصول لهذا المورد' }
    }
    
    return { valid: true }
  } catch (error) {
    console.error('Error validating company access:', error)
    return { valid: false, error: 'خطأ في التحقق من الصلاحيات' }
  }
}

/**
 * إضافة companyId للبيانات قبل الإنشاء
 * يُستخدم في POST requests
 */
export function addCompanyToData<T extends Record<string, unknown>>(
  data: T,
  user: CompanyUser,
  explicitCompanyId?: string
): T & { companyId: string } {
  // استخدام الشركة المحددة صراحة إذا كان المستخدم Super Admin
  if (explicitCompanyId && GLOBAL_ACCESS_ROLES.includes(user.role)) {
    return { ...data, companyId: explicitCompanyId }
  }
  
  // استخدام شركة المستخدم
  if (user.companyId) {
    return { ...data, companyId: user.companyId }
  }
  
  throw new Error('لا يمكن تحديد الشركة للبيانات')
}

/**
 * الحصول على المستخدم الحالي من الطلب
 * يُستخدم للحصول على معلومات المستخدم مع الشركة
 */
export async function getCurrentUserFromRequest(
  request: NextRequest
): Promise<CompanyUser | null> {
  try {
    // محاولة الحصول على المستخدم من الـ session أو token
    // هنا نستخدم الـ cookie التي تم تعيينها عند تسجيل الدخول
    
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return null
    }
    
    // فك تشفير الـ token والحصول على بيانات المستخدم
    // هذا يعتمد على طريقة التشفير المستخدمة
    // في حالة JWT العادي:
    const response = await fetch(new URL('/api/auth/me', request.url), {
      headers: {
        Cookie: `token=${token}`
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return {
        id: result.data.id,
        email: result.data.email,
        role: result.data.role,
        companyId: result.data.companyId,
        branchId: result.data.branchId
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * دالة مساعدة لإنشاء استجابة خطأ عدم الصلاحية
 */
export function unauthorizedResponse(message: string = 'غير مصرح بالوصول') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}

/**
 * دالة مساعدة لإنشاء استجابة خطأ عدم وجود شركة
 */
export function noCompanyResponse() {
  return NextResponse.json(
    { success: false, error: 'يجب تحديد الشركة' },
    { status: 400 }
  )
}

/**
 * التحقق من أن الجدول يدعم فصل الشركات
 */
export function isCompanyScopedTable(tableName: string): boolean {
  return COMPANY_SCOPED_TABLES.includes(tableName as typeof COMPANY_SCOPED_TABLES[number])
}

/**
 * إنشاء فلتر للبحث مع دعم الشركة
 */
export function createSearchFilter(
  searchFields: string[],
  searchTerm: string,
  companyId?: string | null
): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  
  // إضافة فلتر البحث
  if (searchTerm && searchFields.length > 0) {
    filter.OR = searchFields.map(field => ({
      [field]: { contains: searchTerm }
    }))
  }
  
  // إضافة فلتر الشركة
  if (companyId) {
    filter.companyId = companyId
  }
  
  return filter
}

export default {
  getCompanyFilterFromRequest,
  getCompanyFilter,
  validateCompanyAccess,
  addCompanyToData,
  getCurrentUserFromRequest,
  unauthorizedResponse,
  noCompanyResponse,
  isCompanyScopedTable,
  createSearchFilter,
  COMPANY_SCOPED_TABLES
}
