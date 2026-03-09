import { db } from './db'

export interface AuditLogData {
  companyId?: string | null
  branchId?: string | null
  userId?: string | null
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'EXPORT'
  entityType: string
  entityId?: string | null
  oldData?: object | null
  newData?: object | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(data: AuditLogData) {
  try {
    return await db.auditLog.create({
      data: {
        companyId: data.companyId,
        branchId: data.branchId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldData: data.oldData ? JSON.stringify(data.oldData) : null,
        newData: data.newData ? JSON.stringify(data.newData) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the main operation
  }
}

// Arabic error messages
export const ERROR_MESSAGES = {
  COMPANY_REQUIRED: 'معرف الشركة مطلوب',
  NOT_FOUND: 'العنصر غير موجود',
  UNAUTHORIZED: 'غير مصرح بالوصول',
  INVALID_DATA: 'بيانات غير صالحة',
  DUPLICATE_CODE: 'الكود مستخدم بالفعل',
  DUPLICATE_SKU: 'رقم المنتج مستخدم بالفعل',
  PRODUCT_IN_USE: 'المنتج مستخدم ولا يمكن حذفه',
  CATEGORY_HAS_CHILDREN: 'الفئة تحتوي على فئات فرعية',
  INSUFFICIENT_STOCK: 'الكمية غير كافية في المخزون',
  WAREHOUSE_IN_USE: 'المخزن مستخدم ولا يمكن حذفه',
  INVALID_MOVEMENT_TYPE: 'نوع الحركة غير صالح',
  INVALID_QUANTITY: 'الكمية يجب أن تكون أكبر من صفر',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'حدث خطأ غير متوقع'
}
