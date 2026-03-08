// ============================================
// Commission Service - خدمة العمولات
// ============================================

import { commissionRepository } from '@/repositories/commission.repository'
import { 
  CommissionQueryParams,
  CommissionPolicyQueryParams,
  CreateCommissionInput,
  CreateCommissionPolicyInput,
  UpdateCommissionInput
} from '@/models/commission.model'

export const commissionService = {
  // ==================== Agent Commissions ====================

  // جلب العمولات
  async getCommissions(params: CommissionQueryParams) {
    const { data, total } = await commissionRepository.findMany(params)
    
    return {
      data,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total,
        totalPages: Math.ceil(total / (params.limit || 10))
      }
    }
  },

  // جلب عمولة بالمعرف
  async getCommission(id: string) {
    return commissionRepository.findById(id)
  },

  // جلب عمولات المندوب
  async getAgentCommissions(agentId: string, status?: string) {
    return commissionRepository.findByAgent(agentId, status ? { status } : undefined)
  },

  // إنشاء عمولة
  async createCommission(data: CreateCommissionInput) {
    return commissionRepository.create(data)
  },

  // تحديث عمولة
  async updateCommission(id: string, data: UpdateCommissionInput) {
    return commissionRepository.update(id, data)
  },

  // الموافقة على عمولة
  async approveCommission(id: string) {
    return commissionRepository.update(id, { status: 'approved' })
  },

  // دفع عمولة
  async payCommission(id: string) {
    return commissionRepository.update(id, { status: 'paid' })
  },

  // إلغاء عمولة
  async cancelCommission(id: string, notes?: string) {
    return commissionRepository.update(id, { status: 'cancelled', notes })
  },

  // ==================== Commission Policies ====================

  // جلب سياسات العمولات
  async getPolicies(params: CommissionPolicyQueryParams) {
    const { data, total } = await commissionRepository.findPolicies(params)
    
    return {
      data,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total,
        totalPages: Math.ceil(total / (params.limit || 10))
      }
    }
  },

  // جلب سياسة بالمعرف
  async getPolicy(id: string) {
    return commissionRepository.findPolicyById(id)
  },

  // إنشاء سياسة عمولة
  async createPolicy(data: CreateCommissionPolicyInput) {
    return commissionRepository.createPolicy(data)
  },

  // تحديث سياسة عمولة
  async updatePolicy(id: string, data: Partial<CreateCommissionPolicyInput> & { isActive?: boolean }) {
    return commissionRepository.updatePolicy(id, data)
  },

  // حذف سياسة عمولة
  async deletePolicy(id: string) {
    return commissionRepository.deletePolicy(id)
  }
}
