// ============================================
// Audit Log Model - نموذج سجل التدقيق
// ============================================

export interface AuditLog {
  id: string
  action: AuditAction
  entityType: string
  entityId: string | null
  oldData: string | null
  newData: string | null
  userId: string | null
  companyId: string | null
  branchId: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PRINT'
  | 'EXPORT'
  | 'IMPORT'
  | 'SYNC'

// Query Parameters
export interface AuditLogQueryParams {
  action?: AuditAction
  entityType?: string
  entityId?: string
  userId?: string
  companyId?: string
  branchId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

// Input Types
export interface CreateAuditLogInput {
  action: AuditAction
  entityType: string
  entityId?: string
  oldData?: Record<string, any>
  newData?: Record<string, any>
  userId: string
  companyId?: string
  branchId?: string
  ipAddress?: string
  userAgent?: string
}

// Response Types
export interface AuditLogWithRelations extends AuditLog {
  User?: {
    id: string
    name: string
    email: string
  } | null
  Company?: {
    id: string
    name: string
  } | null
  Branch?: {
    id: string
    name: string
  } | null
}

export interface AuditLogListResponse {
  logs: AuditLogWithRelations[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
