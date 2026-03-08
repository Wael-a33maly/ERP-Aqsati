import { db } from '@/lib/db';

// Commission Types
export type CommissionType = 'COLLECTION' | 'SALES' | 'BOTH';
export type CalculationType = 'PERCENTAGE' | 'FIXED';

// Commission Policy interface
export interface CommissionPolicyData {
  id: string;
  companyId: string;
  branchId?: string | null;
  agentId?: string | null;
  name: string;
  type: CommissionType;
  calculationType: CalculationType;
  value: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  active: boolean;
}

// Commission calculation input
export interface CommissionCalculationInput {
  companyId: string;
  branchId?: string | null;
  agentId: string;
  type: 'COLLECTION' | 'SALES';
  amount: number;
  referenceType: 'INVOICE' | 'PAYMENT';
  referenceId: string;
}

// Commission calculation result
export interface CommissionCalculationResult {
  policyId: string | null;
  amount: number;
  calculationType: CalculationType;
  baseValue: number;
  appliedMin: boolean;
  appliedMax: boolean;
}

/**
 * Find applicable commission policy for an agent
 */
export async function findCommissionPolicy(params: {
  companyId: string;
  branchId?: string | null;
  agentId: string;
  type: 'COLLECTION' | 'SALES';
}): Promise<CommissionPolicyData | null> {
  const { companyId, branchId, agentId, type } = params;

  // Priority order for finding policy:
  // 1. Agent-specific policy
  // 2. Branch-specific policy
  // 3. Company-wide policy

  // First, try to find agent-specific policy
  const agentPolicy = await db.commissionPolicy.findFirst({
    where: {
      companyId,
      agentId,
      type: { in: [type, 'BOTH'] },
      active: true,
    },
  });

  if (agentPolicy) {
    return agentPolicy as CommissionPolicyData;
  }

  // Second, try to find branch-specific policy
  if (branchId) {
    const branchPolicy = await db.commissionPolicy.findFirst({
      where: {
        companyId,
        branchId,
        agentId: null, // Not agent-specific
        type: { in: [type, 'BOTH'] },
        active: true,
      },
    });

    if (branchPolicy) {
      return branchPolicy as CommissionPolicyData;
    }
  }

  // Finally, try to find company-wide policy
  const companyPolicy = await db.commissionPolicy.findFirst({
    where: {
      companyId,
      branchId: null, // Not branch-specific
      agentId: null, // Not agent-specific
      type: { in: [type, 'BOTH'] },
      active: true,
    },
  });

  if (companyPolicy) {
    return companyPolicy as CommissionPolicyData;
  }

  return null;
}

/**
 * Calculate commission amount based on policy
 */
export function calculateCommissionAmount(
  policy: CommissionPolicyData,
  baseAmount: number,
  itemCount: number = 1
): CommissionCalculationResult {
  let commissionAmount: number;
  let appliedMin = false;
  let appliedMax = false;

  // Calculate base commission
  if (policy.calculationType === 'PERCENTAGE') {
    commissionAmount = baseAmount * (policy.value / 100);
  } else {
    // FIXED - check if per item
    if ((policy as any).perItem) {
      commissionAmount = policy.value * itemCount;
    } else {
      commissionAmount = policy.value;
    }
  }

  // Apply min/max constraints
  if (policy.minAmount !== null && policy.minAmount !== undefined) {
    if (commissionAmount < policy.minAmount) {
      commissionAmount = policy.minAmount;
      appliedMin = true;
    }
  }

  if (policy.maxAmount !== null && policy.maxAmount !== undefined) {
    if (commissionAmount > policy.maxAmount) {
      commissionAmount = policy.maxAmount;
      appliedMax = true;
    }
  }

  return {
    policyId: policy.id,
    amount: commissionAmount,
    calculationType: policy.calculationType,
    baseValue: policy.value,
    appliedMin,
    appliedMax,
  };
}

/**
 * Calculate and create commission for an agent
 */
export async function calculateAndCreateCommission(
  input: CommissionCalculationInput
): Promise<{
  success: boolean;
  commission?: any;
  policy?: CommissionPolicyData | null;
  error?: string;
}> {
  const { companyId, branchId, agentId, type, amount, referenceType, referenceId } = input;

  try {
    // Find applicable policy
    const policy = await findCommissionPolicy({
      companyId,
      branchId,
      agentId,
      type,
    });

    if (!policy) {
      return {
        success: false,
        policy: null,
        error: 'No applicable commission policy found',
      };
    }

    // Calculate commission amount
    const calculation = calculateCommissionAmount(policy, amount);

    // Check if commission already exists for this reference
    const existingCommission = await db.agentCommission.findFirst({
      where: {
        agentId,
        referenceType,
        referenceId,
        status: { not: 'cancelled' },
      },
    });

    if (existingCommission) {
      return {
        success: false,
        error: 'Commission already exists for this reference',
      };
    }

    // Create commission record
    const commission = await db.agentCommission.create({
      data: {
        companyId, // إضافة companyId
        agentId,
        policyId: policy.id,
        type,
        referenceType,
        referenceId,
        amount: calculation.amount,
        status: 'pending',
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            email: true,
          },
        },
        policy: {
          select: {
            id: true,
            name: true,
            type: true,
            calculationType: true,
            value: true,
          },
        },
      },
    });

    return {
      success: true,
      commission,
      policy,
    };
  } catch (error: any) {
    console.error('Error calculating commission:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate commission',
    };
  }
}

/**
 * Get commission summary for an agent
 */
export async function getAgentCommissionSummary(params: {
  agentId: string;
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalPending: number;
  totalPaid: number;
  totalCancelled: number;
  countPending: number;
  countPaid: number;
  countCancelled: number;
  byType: {
    COLLECTION: { pending: number; paid: number };
    SALES: { pending: number; paid: number };
  };
}> {
  const { agentId, companyId, startDate, endDate } = params;

  const where: any = { agentId };

  if (companyId) {
    where.policy = { companyId };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Get aggregated data
  const [pendingCommissions, paidCommissions, cancelledCommissions] = await Promise.all([
    db.agentCommission.aggregate({
      where: { ...where, status: 'pending' },
      _sum: { amount: true },
      _count: true,
    }),
    db.agentCommission.aggregate({
      where: { ...where, status: 'paid' },
      _sum: { amount: true },
      _count: true,
    }),
    db.agentCommission.aggregate({
      where: { ...where, status: 'cancelled' },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  // Get by type
  const collectionPending = await db.agentCommission.aggregate({
    where: { ...where, status: 'pending', type: 'COLLECTION' },
    _sum: { amount: true },
  });

  const collectionPaid = await db.agentCommission.aggregate({
    where: { ...where, status: 'paid', type: 'COLLECTION' },
    _sum: { amount: true },
  });

  const salesPending = await db.agentCommission.aggregate({
    where: { ...where, status: 'pending', type: 'SALES' },
    _sum: { amount: true },
  });

  const salesPaid = await db.agentCommission.aggregate({
    where: { ...where, status: 'paid', type: 'SALES' },
    _sum: { amount: true },
  });

  return {
    totalPending: pendingCommissions._sum.amount || 0,
    totalPaid: paidCommissions._sum.amount || 0,
    totalCancelled: cancelledCommissions._sum.amount || 0,
    countPending: pendingCommissions._count,
    countPaid: paidCommissions._count,
    countCancelled: cancelledCommissions._count,
    byType: {
      COLLECTION: {
        pending: collectionPending._sum.amount || 0,
        paid: collectionPaid._sum.amount || 0,
      },
      SALES: {
        pending: salesPending._sum.amount || 0,
        paid: salesPaid._sum.amount || 0,
      },
    },
  };
}

/**
 * Mark commissions as paid
 */
export async function markCommissionsAsPaid(params: {
  commissionIds: string[];
  paidDate?: Date;
}): Promise<{ success: boolean; count: number; error?: string }> {
  const { commissionIds, paidDate = new Date() } = params;

  try {
    const result = await db.agentCommission.updateMany({
      where: {
        id: { in: commissionIds },
        status: 'pending',
      },
      data: {
        status: 'paid',
        paidDate,
      },
    });

    return {
      success: true,
      count: result.count,
    };
  } catch (error: any) {
    console.error('Error marking commissions as paid:', error);
    return {
      success: false,
      count: 0,
      error: error.message || 'Failed to mark commissions as paid',
    };
  }
}

/**
 * Cancel commissions for a reference (e.g., when invoice/payment is cancelled)
 */
export async function cancelCommissionsForReference(params: {
  referenceType: 'INVOICE' | 'PAYMENT';
  referenceId: string;
}): Promise<{ success: boolean; count: number; error?: string }> {
  const { referenceType, referenceId } = params;

  try {
    const result = await db.agentCommission.updateMany({
      where: {
        referenceType,
        referenceId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });

    return {
      success: true,
      count: result.count,
    };
  } catch (error: any) {
    console.error('Error cancelling commissions:', error);
    return {
      success: false,
      count: 0,
      error: error.message || 'Failed to cancel commissions',
    };
  }
}

/**
 * Recalculate commission for a reference
 */
export async function recalculateCommission(params: {
  referenceType: 'INVOICE' | 'PAYMENT';
  referenceId: string;
  newAmount: number;
}): Promise<{ success: boolean; commission?: any; error?: string }> {
  const { referenceType, referenceId, newAmount } = params;

  try {
    // Get existing commission
    const existingCommission = await db.agentCommission.findFirst({
      where: {
        referenceType,
        referenceId,
        status: 'pending',
      },
      include: {
        policy: true,
      },
    });

    if (!existingCommission) {
      return {
        success: false,
        error: 'No pending commission found for this reference',
      };
    }

    if (!existingCommission.policy) {
      return {
        success: false,
        error: 'Commission policy not found',
      };
    }

    // Recalculate amount
    const calculation = calculateCommissionAmount(
      existingCommission.policy as CommissionPolicyData,
      newAmount
    );

    // Update commission
    const updatedCommission = await db.agentCommission.update({
      where: { id: existingCommission.id },
      data: { amount: calculation.amount },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            email: true,
          },
        },
        policy: {
          select: {
            id: true,
            name: true,
            type: true,
            calculationType: true,
            value: true,
          },
        },
      },
    });

    return {
      success: true,
      commission: updatedCommission,
    };
  } catch (error: any) {
    console.error('Error recalculating commission:', error);
    return {
      success: false,
      error: error.message || 'Failed to recalculate commission',
    };
  }
}
