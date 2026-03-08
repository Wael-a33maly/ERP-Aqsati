/**
 * Admin Model
 * نماذج الإدارة
 */

export interface AdminStatsParams {
  companyId?: string
  dateFrom?: string
  dateTo?: string
}

export interface BackupInput {
  type: 'full' | 'partial'
  tables?: string[]
  description?: string
}

export interface ImpersonateInput {
  userId: string
  reason: string
}

export interface DangerActionInput {
  action: 'reset_company' | 'delete_company' | 'reset_database'
  companyId?: string
  confirmation: string
}
