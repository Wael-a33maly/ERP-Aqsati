import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog, ERROR_MESSAGES, getErrorMessage } from '@/lib/audit';

// Types
interface CreatePolicyBody {
  companyId: string;
  branchId?: string;
  agentId?: string;
  name: string;
  nameAr?: string;
  type: 'COLLECTION' | 'SALES' | 'BOTH';
  calculationType: 'PERCENTAGE' | 'FIXED';
  value: number;
  perItem?: boolean;
  minAmount?: number;
  maxAmount?: number;
  active?: boolean;
}

interface UpdatePolicyBody {
  id: string;
  name?: string;
  nameAr?: string;
  type?: 'COLLECTION' | 'SALES' | 'BOTH';
  calculationType?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  perItem?: boolean;
  minAmount?: number | null;
  maxAmount?: number | null;
  active?: boolean;
}

// GET /api/commissions/policies - List commission policies
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
    const type = searchParams.get('type');
    const calculationType = searchParams.get('calculationType');
    const active = searchParams.get('active');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (companyId) where.companyId = companyId;
    if (branchId) where.branchId = branchId;
    if (agentId) where.agentId = agentId;
    if (type && ['COLLECTION', 'SALES', 'BOTH'].includes(type)) {
      where.type = type;
    }
    if (calculationType && ['PERCENTAGE', 'FIXED'].includes(calculationType)) {
      where.calculationType = calculationType;
    }
    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    // Search by name
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get policies with count
    const [policies, total] = await Promise.all([
      db.commissionPolicy.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              code: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              code: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              email: true,
            },
          },
          _count: {
            select: {
              commissions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.commissionPolicy.count({ where }),
    ]);

    // Get summary stats
    const stats = await db.commissionPolicy.aggregate({
      where,
      _count: {
        id: true,
      },
      _avg: {
        value: true,
      },
    });

    // Count by type
    const byType = await db.commissionPolicy.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true,
      },
    });

    // Count by calculation type
    const byCalculationType = await db.commissionPolicy.groupBy({
      by: ['calculationType'],
      where,
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: policies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalPolicies: stats._count.id,
        avgValue: stats._avg.value || 0,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byCalculationType: byCalculationType.reduce((acc, item) => {
          acc[item.calculationType] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error: any) {
    console.error('Error fetching commission policies:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch commission policies' },
      { status: 500 }
    );
  }
}

// POST /api/commissions/policies - Create a new commission policy
export async function POST(request: NextRequest) {
  try {
    const body: CreatePolicyBody = await request.json();

    const {
      companyId,
      branchId,
      agentId,
      name,
      nameAr,
      type,
      calculationType,
      value,
      perItem = false,
      minAmount,
      maxAmount,
      active = true,
    } = body;

    // Validate required fields
    if (!companyId || !name || !type || !calculationType || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Company ID, name, type, calculation type, and value are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['COLLECTION', 'SALES', 'BOTH'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be COLLECTION, SALES, or BOTH' },
        { status: 400 }
      );
    }

    // Validate calculation type
    if (!['PERCENTAGE', 'FIXED'].includes(calculationType)) {
      return NextResponse.json(
        { success: false, error: 'Calculation type must be PERCENTAGE or FIXED' },
        { status: 400 }
      );
    }

    // Validate value
    if (value < 0) {
      return NextResponse.json(
        { success: false, error: 'Value must be non-negative' },
        { status: 400 }
      );
    }

    // For percentage, value should not exceed 100
    if (calculationType === 'PERCENTAGE' && value > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage value cannot exceed 100' },
        { status: 400 }
      );
    }

    // Validate min/max amounts
    if (minAmount !== undefined && minAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Minimum amount must be non-negative' },
        { status: 400 }
      );
    }

    if (maxAmount !== undefined && maxAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Maximum amount must be non-negative' },
        { status: 400 }
      );
    }

    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
      return NextResponse.json(
        { success: false, error: 'Minimum amount cannot be greater than maximum amount' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Verify branch if provided
    if (branchId) {
      const branch = await db.branch.findFirst({
        where: { id: branchId, companyId },
      });

      if (!branch) {
        return NextResponse.json(
          { success: false, error: 'Branch not found or does not belong to company' },
          { status: 404 }
        );
      }
    }

    // Verify agent if provided
    if (agentId) {
      const agent = await db.user.findFirst({
        where: {
          id: agentId,
          companyId,
          role: { in: ['AGENT', 'BRANCH_MANAGER'] },
        },
      });

      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Agent not found or does not belong to company' },
          { status: 404 }
        );
      }
    }

    // Check for conflicting policy
    const existingPolicy = await db.commissionPolicy.findFirst({
      where: {
        companyId,
        branchId: branchId || null,
        agentId: agentId || null,
        type: type === 'BOTH' ? { in: ['COLLECTION', 'SALES', 'BOTH'] } : type,
        active: true,
      },
    });

    if (existingPolicy) {
      return NextResponse.json(
        { success: false, error: 'An active policy already exists for this scope and type' },
        { status: 400 }
      );
    }

    // Create policy
    const policy = await db.commissionPolicy.create({
      data: {
        companyId,
        branchId: branchId || null,
        agentId: agentId || null,
        name,
        nameAr,
        type,
        calculationType,
        value,
        perItem,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        active,
      },
      include: {
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
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      companyId,
      branchId,
      action: 'CREATE',
      entityType: 'CommissionPolicy',
      entityId: policy.id,
      newData: policy,
    });

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Commission policy created successfully',
    });
  } catch (error: any) {
    console.error('Error creating commission policy:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create commission policy' },
      { status: 500 }
    );
  }
}

// PUT /api/commissions/policies - Update a commission policy
export async function PUT(request: NextRequest) {
  try {
    const body: UpdatePolicyBody = await request.json();

    const {
      id,
      name,
      nameAr,
      type,
      calculationType,
      value,
      perItem,
      minAmount,
      maxAmount,
      active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    // Get existing policy
    const existingPolicy = await db.commissionPolicy.findUnique({
      where: { id },
    });

    if (!existingPolicy) {
      return NextResponse.json(
        { success: false, error: 'Commission policy not found' },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (type && !['COLLECTION', 'SALES', 'BOTH'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be COLLECTION, SALES, or BOTH' },
        { status: 400 }
      );
    }

    // Validate calculation type if provided
    if (calculationType && !['PERCENTAGE', 'FIXED'].includes(calculationType)) {
      return NextResponse.json(
        { success: false, error: 'Calculation type must be PERCENTAGE or FIXED' },
        { status: 400 }
      );
    }

    // Validate value if provided
    if (value !== undefined && value < 0) {
      return NextResponse.json(
        { success: false, error: 'Value must be non-negative' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (type !== undefined) updateData.type = type;
    if (calculationType !== undefined) updateData.calculationType = calculationType;
    if (value !== undefined) updateData.value = value;
    if (perItem !== undefined) updateData.perItem = perItem;
    if (minAmount !== undefined) updateData.minAmount = minAmount;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
    if (active !== undefined) updateData.active = active;

    // Update policy
    const policy = await db.commissionPolicy.update({
      where: { id },
      data: updateData,
      include: {
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
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      companyId: existingPolicy.companyId,
      branchId: existingPolicy.branchId,
      action: 'UPDATE',
      entityType: 'CommissionPolicy',
      entityId: id,
      oldData: existingPolicy,
      newData: policy,
    });

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Commission policy updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating commission policy:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update commission policy' },
      { status: 500 }
    );
  }
}

// DELETE /api/commissions/policies - Delete a commission policy
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    // Get existing policy
    const existingPolicy = await db.commissionPolicy.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            commissions: true,
          },
        },
      },
    });

    if (!existingPolicy) {
      return NextResponse.json(
        { success: false, error: 'Commission policy not found' },
        { status: 404 }
      );
    }

    // Check if policy has associated commissions
    if (existingPolicy._count.commissions > 0) {
      // Don't delete, just deactivate
      const policy = await db.commissionPolicy.update({
        where: { id },
        data: { active: false },
      });

      // Create audit log
      await createAuditLog({
        companyId: existingPolicy.companyId,
        branchId: existingPolicy.branchId,
        userId: userId || undefined,
        action: 'UPDATE',
        entityType: 'CommissionPolicy',
        entityId: id,
        oldData: { active: true },
        newData: { active: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Commission policy deactivated (has associated commissions)',
        data: policy,
      });
    }

    // Delete policy if no commissions
    await db.commissionPolicy.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      companyId: existingPolicy.companyId,
      branchId: existingPolicy.branchId,
      userId: userId || undefined,
      action: 'DELETE',
      entityType: 'CommissionPolicy',
      entityId: id,
      oldData: existingPolicy,
    });

    return NextResponse.json({
      success: true,
      message: 'Commission policy deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting commission policy:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete commission policy' },
      { status: 500 }
    );
  }
}
