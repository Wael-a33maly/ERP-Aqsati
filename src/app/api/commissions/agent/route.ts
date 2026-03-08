import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog, getErrorMessage } from '@/lib/audit';
import {
  getAgentCommissionSummary,
  markCommissionsAsPaid,
  calculateAndCreateCommission,
} from '@/lib/utils/commission';

// Types
interface MarkPaidBody {
  commissionIds: string[];
  paidDate?: string;
  userId?: string;
}

interface CreateCommissionBody {
  companyId: string;
  branchId?: string;
  agentId: string;
  type: 'COLLECTION' | 'SALES';
  amount: number;
  referenceType: 'INVOICE' | 'PAYMENT';
  referenceId: string;
  userId?: string;
}

// GET /api/commissions/agent - List agent commissions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const companyId = searchParams.get('companyId');
    const branchId = searchParams.get('branchId');
    const agentId = searchParams.get('agentId');
    const policyId = searchParams.get('policyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const referenceType = searchParams.get('referenceType');
    const referenceId = searchParams.get('referenceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    // Check for summary request
    const summary = searchParams.get('summary') === 'true';

    // If requesting summary for an agent
    if (summary && agentId) {
      const summaryData = await getAgentCommissionSummary({
        agentId,
        companyId: companyId || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return NextResponse.json({
        success: true,
        data: summaryData,
      });
    }

    // Build where clause
    const where: any = {};

    // Filter by policy's company
    if (companyId) {
      where.policy = { companyId };
    }

    if (agentId) where.agentId = agentId;
    if (policyId) where.policyId = policyId;
    if (type && ['COLLECTION', 'SALES'].includes(type)) {
      where.type = type;
    }
    if (status && ['pending', 'paid', 'cancelled'].includes(status)) {
      where.status = status;
    }
    if (referenceType && ['INVOICE', 'PAYMENT'].includes(referenceType)) {
      where.referenceType = referenceType;
    }
    if (referenceId) where.referenceId = referenceId;

    // Date range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Amount filters
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    // Get commissions with count
    const [commissions, total] = await Promise.all([
      db.agentCommission.findMany({
        where,
        skip,
        take: limit,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              email: true,
              phone: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              branch: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          policy: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              type: true,
              calculationType: true,
              value: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.agentCommission.count({ where }),
    ]);

    // Get summary stats
    const stats = await db.agentCommission.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get counts by status
    const byStatus = await db.agentCommission.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Get counts by type
    const byType = await db.agentCommission.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalCommissions: stats._count.id,
        totalAmount: stats._sum.amount || 0,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count.id,
            amount: item._sum.amount || 0,
          };
          return acc;
        }, {} as Record<string, { count: number; amount: number }>),
        byType: byType.reduce((acc, item) => {
          acc[item.type] = {
            count: item._count.id,
            amount: item._sum.amount || 0,
          };
          return acc;
        }, {} as Record<string, { count: number; amount: number }>),
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent commissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch agent commissions' },
      { status: 500 }
    );
  }
}

// POST /api/commissions/agent - Create a new commission manually
export async function POST(request: NextRequest) {
  try {
    const body: CreateCommissionBody = await request.json();

    const {
      companyId,
      branchId,
      agentId,
      type,
      amount,
      referenceType,
      referenceId,
      userId,
    } = body;

    // Validate required fields
    if (!companyId || !agentId || !type || !amount || !referenceType || !referenceId) {
      return NextResponse.json(
        { success: false, error: 'Company ID, agent ID, type, amount, reference type, and reference ID are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['COLLECTION', 'SALES'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be COLLECTION or SALES' },
        { status: 400 }
      );
    }

    // Validate reference type
    if (!['INVOICE', 'PAYMENT'].includes(referenceType)) {
      return NextResponse.json(
        { success: false, error: 'Reference type must be INVOICE or PAYMENT' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Calculate and create commission
    const result = await calculateAndCreateCommission({
      companyId,
      branchId,
      agentId,
      type,
      amount,
      referenceType,
      referenceId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Create audit log
    await createAuditLog({
      companyId,
      branchId,
      userId,
      action: 'CREATE',
      entityType: 'AgentCommission',
      entityId: result.commission.id,
      newData: result.commission,
    });

    return NextResponse.json({
      success: true,
      data: result.commission,
      message: 'Commission created successfully',
    });
  } catch (error: any) {
    console.error('Error creating commission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create commission' },
      { status: 500 }
    );
  }
}

// PUT /api/commissions/agent - Update commission status (mark as paid)
export async function PUT(request: NextRequest) {
  try {
    const body: MarkPaidBody = await request.json();

    const { commissionIds, paidDate, userId } = body;

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Commission IDs array is required' },
        { status: 400 }
      );
    }

    // Get commissions before update for audit log
    const commissions = await db.agentCommission.findMany({
      where: {
        id: { in: commissionIds },
        status: 'pending',
      },
      include: {
        policy: {
          select: {
            companyId: true,
            branchId: true,
          },
        },
      },
    });

    if (commissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No pending commissions found with the provided IDs' },
        { status: 400 }
      );
    }

    // Mark as paid
    const result = await markCommissionsAsPaid({
      commissionIds,
      paidDate: paidDate ? new Date(paidDate) : new Date(),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Create audit logs
    for (const commission of commissions) {
      await createAuditLog({
        companyId: commission.policy?.companyId,
        branchId: commission.policy?.branchId,
        userId,
        action: 'UPDATE',
        entityType: 'AgentCommission',
        entityId: commission.id,
        oldData: { status: 'pending' },
        newData: { status: 'paid', paidDate: paidDate || new Date() },
      });
    }

    // Get updated commissions
    const updatedCommissions = await db.agentCommission.findMany({
      where: {
        id: { in: commissionIds },
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCommissions,
      message: `${result.count} commission(s) marked as paid`,
    });
  } catch (error: any) {
    console.error('Error updating commissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update commissions' },
      { status: 500 }
    );
  }
}

// DELETE /api/commissions/agent - Cancel commissions
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commissionIds = searchParams.get('ids')?.split(',') || [];
    const userId = searchParams.get('userId');

    if (commissionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Commission IDs are required' },
        { status: 400 }
      );
    }

    // Get commissions before update for audit log
    const commissions = await db.agentCommission.findMany({
      where: {
        id: { in: commissionIds },
        status: 'pending',
      },
      include: {
        policy: {
          select: {
            companyId: true,
            branchId: true,
          },
        },
      },
    });

    if (commissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No pending commissions found with the provided IDs' },
        { status: 400 }
      );
    }

    // Cancel commissions
    const result = await db.agentCommission.updateMany({
      where: {
        id: { in: commissionIds },
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });

    // Create audit logs
    for (const commission of commissions) {
      await createAuditLog({
        companyId: commission.policy?.companyId,
        branchId: commission.policy?.branchId,
        userId: userId || undefined,
        action: 'UPDATE',
        entityType: 'AgentCommission',
        entityId: commission.id,
        oldData: { status: 'pending' },
        newData: { status: 'cancelled' },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} commission(s) cancelled`,
    });
  } catch (error: any) {
    console.error('Error cancelling commissions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel commissions' },
      { status: 500 }
    );
  }
}
