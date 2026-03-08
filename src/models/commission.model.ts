// ============================================
// Commission Model - نموذج العمولات
// ============================================

export interface AgentCommission {
  id: string
  companyId: string | null
  branchId: string | null
  agentId: string
  policyId: string | null
  type: CommissionType
  referenceType: string
  referenceId: string
  baseAmount: number
  commissionRate: number
  commissionAmount: number
  status: CommissionStatus
  paidAt: Date | null
  notes: string | null
  createdAt: Date
}

export type CommissionType = 'SALES' | 'COLLECTION' | 'TARGET_BONUS' | 'CUSTOM'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled'

// Commission Policy
export interface CommissionPolicy {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  type: CommissionType
  baseRate: number
  targetAmount: number | null
  bonusRate: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Query Parameters
export interface CommissionQueryParams {
  page?: number
  limit?: number
  status?: CommissionStatus
  type?: CommissionType
  agentId?: string
  companyId?: string
  branchId?: string
  startDate?: Date
  endDate?: Date
}

export interface CommissionPolicyQueryParams {
  page?: number
  limit?: number
  companyId?: string
  type?: CommissionType
  isActive?: boolean
}

// Input Types
export interface CreateCommissionInput {
  companyId: string
  branchId?: string
  agentId: string
  policyId?: string
  type: CommissionType
  referenceType: string
  referenceId: string
  baseAmount: number
  commissionRate: number
  notes?: string
}

export interface CreateCommissionPolicyInput {
  companyId: string
  name: string
  nameAr?: string
  type: CommissionType
  baseRate: number
  targetAmount?: number
  bonusRate?: number
}

export interface UpdateCommissionInput {
  id: string
  status?: CommissionStatus
  notes?: string
}

// Response Types
export interface CommissionWithDetails extends AgentCommission {
  agent?: {
    id: string
    name: string
    email: string
  }
  policy?: {
    id: string
    name: string
    type: CommissionType
  }
}

export interface CommissionListResponse {
  data: CommissionWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
