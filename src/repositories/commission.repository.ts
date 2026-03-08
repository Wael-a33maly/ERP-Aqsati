// ============================================
// Commission Repository - مستودع العمولات
// ============================================

import { db } from '@/lib/db'
import { 
  CommissionQueryParams,
  CommissionPolicyQueryParams,
  CreateCommissionInput,
  CreateCommissionPolicyInput,
  UpdateCommissionInput,
  CommissionWithDetails
} from '@/models/commission.model'

export const commissionRepository = {
  // ==================== Agent Commissions ====================

  // جلب العمولات
  async findMany(params: CommissionQueryParams): Promise<{ data: CommissionWithDetails[]; total: number }> {
    const skip = ((params.page || 1) - 1) * (params.limit || 10)
    const where: any = {}

    if (params.status) where.status = params.status
    if (params.type) where.type = params.type
    if (params.agentId) where.agentId = params.agentId
    if (params.companyId) where.companyId = params.companyId
    if (params.branchId) where.branchId = params.branchId

    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = params.startDate
      if (params.endDate) where.createdAt.lte = params.endDate
    }

    const [commissions, total] = await Promise.all([
      db.agentCommission.findMany({
        where,
        skip,
        take: params.limit || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { select: { id: true, name: true, email: true } },
          policy: { select: { id: true, name: true, type: true } }
        }
      }),
      db.agentCommission.count({ where })
    ])

    return { data: commissions as CommissionWithDetails[], total }
  },

  // جلب عمولة بالمعرف
  async findById(id: string) {
    return db.agentCommission.findUnique({
      where: { id },
      include: {
        agent: true,
        policy: true
      }
    })
  },

  // جلب عمولات المندوب
  async findByAgent(agentId: string, params?: { status?: string }) {
    const where: any = { agentId }
    if (params?.status) where.status = params.status

    return db.agentCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { select: { id: true, name: true, type: true } }
      }
    })
  },

  // إنشاء عمولة
  async create(data: CreateCommissionInput) {
    return db.agentCommission.create({
      data: {
        companyId: data.companyId || null,
        branchId: data.branchId || null,
        agentId: data.agentId,
        policyId: data.policyId || null,
        type: data.type,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        baseAmount: data.baseAmount,
        commissionRate: data.commissionRate,
        commissionAmount: (data.baseAmount * data.commissionRate) / 100,
        status: 'pending',
        notes: data.notes || null
      }
    })
  },

  // تحديث عمولة
  async update(id: string, data: UpdateCommissionInput) {
    return db.agentCommission.update({
      where: { id },
      data: {
        ...(data.status && { 
          status: data.status,
          ...(data.status === 'paid' && { paidAt: new Date() })
        }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    })
  },

  // ==================== Commission Policies ====================

  // جلب سياسات العمولات
  async findPolicies(params: CommissionPolicyQueryParams) {
    const skip = ((params.page || 1) - 1) * (params.limit || 10)
    const where: any = {}

    if (params.companyId) where.companyId = params.companyId
    if (params.type) where.type = params.type
    if (params.isActive !== undefined) where.isActive = params.isActive

    const [policies, total] = await Promise.all([
      db.commissionPolicy.findMany({
        where,
        skip,
        take: params.limit || 10,
        orderBy: { createdAt: 'desc' }
      }),
      db.commissionPolicy.count({ where })
    ])

    return { data: policies, total }
  },

  // جلب سياسة بالمعرف
  async findPolicyById(id: string) {
    return db.commissionPolicy.findUnique({
      where: { id }
    })
  },

  // إنشاء سياسة عمولة
  async createPolicy(data: CreateCommissionPolicyInput) {
    return db.commissionPolicy.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        nameAr: data.nameAr || null,
        type: data.type,
        baseRate: data.baseRate,
        targetAmount: data.targetAmount || null,
        bonusRate: data.bonusRate || null,
        isActive: true
      }
    })
  },

  // تحديث سياسة عمولة
  async updatePolicy(id: string, data: Partial<CreateCommissionPolicyInput> & { isActive?: boolean }) {
    return db.commissionPolicy.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.type && { type: data.type }),
        ...(data.baseRate !== undefined && { baseRate: data.baseRate }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.bonusRate !== undefined && { bonusRate: data.bonusRate }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })
  },

  // حذف سياسة عمولة
  async deletePolicy(id: string) {
    return db.commissionPolicy.delete({
      where: { id }
    })
  }
}
