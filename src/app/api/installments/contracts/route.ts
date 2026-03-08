import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateContractNumber } from '@/lib/utils/invoice-number';

// Types
interface CreateContractBody {
  invoiceId: string;
  customerId: string;
  agentId?: string;
  contractDate?: string;
  downPayment: number;
  numberOfPayments: number;
  paymentFrequency: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY';
  interestRate?: number;
  startDate: string;
  notes?: string;
}

interface UpdateContractBody {
  id: string;
  agentId?: string;
  startDate?: string;
  notes?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'defaulted';
}

// GET /api/installments/contracts - List installment contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Filters
    const companyId = searchParams.get('companyId');
    const customerId = searchParams.get('customerId');
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const paymentFrequency = searchParams.get('paymentFrequency');
    const search = searchParams.get('search');
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    // Filter by company through invoice relation
    if (companyId) {
      where.Invoice = { companyId };
    }
    
    if (customerId) where.customerId = customerId;
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;
    if (paymentFrequency) where.paymentFrequency = paymentFrequency;
    
    // Date range filters
    if (dateFrom || dateTo) {
      where.contractDate = {};
      if (dateFrom) (where.contractDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.contractDate as Record<string, Date>).lte = new Date(dateTo);
    }
    
    // Search by contract number or customer name
    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { Customer: { name: { contains: search, mode: 'insensitive' } } },
        { Customer: { nameAr: { contains: search, mode: 'insensitive' } } },
        { Customer: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // Get contracts with count
    const [contracts, total] = await Promise.all([
      db.installmentContract.findMany({
        where,
        skip,
        take: limit,
        include: {
          Invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              total: true,
              companyId: true,
              branchId: true,
              Branch: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          Customer: {
            select: {
              id: true,
              code: true,
              name: true,
              nameAr: true,
              phone: true,
              phone2: true,
              balance: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              email: true,
              phone: true,
            },
          },
          Installment: {
            orderBy: { installmentNumber: 'asc' },
            select: {
              id: true,
              installmentNumber: true,
              dueDate: true,
              amount: true,
              paidAmount: true,
              remainingAmount: true,
              status: true,
              lateFee: true,
            },
          },
          _count: {
            select: {
              Installment: true,
            },
          },
        },
        orderBy: {
          contractDate: 'desc',
        },
      }),
      db.installmentContract.count({ where }),
    ]);
    
    // Calculate summary stats for each contract
    const contractsWithStats = contracts.map((contract: any) => {
      const installments = contract.Installment || [];
      const totalPaid = installments.reduce((sum: number, i: any) => sum + i.paidAmount, 0);
      const totalRemaining = installments.reduce((sum: number, i: any) => sum + i.remainingAmount, 0);
      const paidInstallments = installments.filter((i: any) => i.status === 'paid').length;
      const overdueInstallments = installments.filter((i: any) => i.status === 'overdue').length;
      const nextDueInstallment = installments.find((i: any) => i.status === 'pending' || i.status === 'overdue');
      
      return {
        ...contract,
        invoice: contract.Invoice,
        customer: contract.Customer,
        agent: contract.User,
        installments: installments,
        stats: {
          totalPaid,
          totalRemaining,
          paidInstallments,
          pendingInstallments: installments.length - paidInstallments,
          overdueInstallments,
          progressPercentage: installments.length > 0 ? (paidInstallments / installments.length) * 100 : 0,
          nextDueDate: nextDueInstallment?.dueDate || null,
          nextDueAmount: nextDueInstallment?.remainingAmount || 0,
        },
      };
    });
    
    // Aggregate summary
    const summaryData = await db.installmentContract.aggregate({
      where,
      _sum: {
        totalAmount: true,
        downPayment: true,
        financedAmount: true,
        interestAmount: true,
      },
      _count: {
        id: true,
      },
    });
    
    // Get overdue count
    const overdueCount = await db.installment.count({
      where: {
        status: 'overdue',
      },
    });
    
    return NextResponse.json({
      success: true,
      data: contractsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalContracts: summaryData._count.id,
        totalAmount: summaryData._sum.totalAmount || 0,
        totalDownPayments: summaryData._sum.downPayment || 0,
        totalFinanced: summaryData._sum.financedAmount || 0,
        totalInterest: summaryData._sum.interestAmount || 0,
        overdueInstallments: overdueCount,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching installment contracts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch installment contracts';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/installments/contracts - Create a new installment contract
export async function POST(request: NextRequest) {
  try {
    const body: CreateContractBody = await request.json();
    
    const {
      invoiceId,
      customerId,
      agentId,
      contractDate,
      downPayment,
      numberOfPayments,
      paymentFrequency,
      interestRate = 0,
      startDate,
      notes,
    } = body;
    
    // Validate required fields
    if (!invoiceId || !customerId || !numberOfPayments || !paymentFrequency || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID, customer ID, number of payments, payment frequency, and start date are required' },
        { status: 400 }
      );
    }
    
    if (numberOfPayments < 1) {
      return NextResponse.json(
        { success: false, error: 'Number of payments must be at least 1' },
        { status: 400 }
      );
    }
    
    // Check if invoice exists and doesn't already have a contract
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        installmentContract: true,
        customer: true,
      },
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    if (invoice.installmentContract) {
      return NextResponse.json(
        { success: false, error: 'Invoice already has an installment contract' },
        { status: 400 }
      );
    }
    
    if (invoice.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: 'Invoice does not belong to this customer' },
        { status: 400 }
      );
    }
    
    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Calculate contract amounts
    const invoiceTotal = invoice.total;
    const financedAmount = invoiceTotal - downPayment;
    const interestAmount = financedAmount * (interestRate / 100);
    const totalContractAmount = financedAmount + interestAmount;
    const paymentAmount = totalContractAmount / numberOfPayments;
    
    // Calculate end date based on frequency
    const contractStartDate = new Date(startDate);
    const contractEndDate = new Date(contractStartDate);
    
    switch (paymentFrequency) {
      case 'WEEKLY':
        contractEndDate.setDate(contractEndDate.getDate() + (numberOfPayments * 7));
        break;
      case 'BI_WEEKLY':
        contractEndDate.setDate(contractEndDate.getDate() + (numberOfPayments * 14));
        break;
      case 'MONTHLY':
      default:
        contractEndDate.setMonth(contractEndDate.getMonth() + numberOfPayments);
        break;
    }
    
    // Generate contract number
    const contractNumber = await generateContractNumber();
    
    // Create contract with installment schedule in transaction
    const contract = await db.$transaction(async (tx) => {
      // Create installment contract
      const newContract = await tx.installmentContract.create({
        data: {
          invoiceId,
          customerId,
          agentId: agentId || null,
          contractNumber,
          contractDate: contractDate ? new Date(contractDate) : new Date(),
          totalAmount: totalContractAmount,
          downPayment,
          financedAmount,
          numberOfPayments,
          paymentFrequency,
          interestRate,
          interestAmount,
          startDate: contractStartDate,
          endDate: contractEndDate,
          status: 'active',
          notes: notes || null,
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
            },
          },
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              nameAr: true,
            },
          },
        },
      });
      
      // Create installment schedule
      const installments = [];
      for (let i = 1; i <= numberOfPayments; i++) {
        const dueDate = new Date(contractStartDate);
        
        switch (paymentFrequency) {
          case 'WEEKLY':
            dueDate.setDate(dueDate.getDate() + (i * 7));
            break;
          case 'BI_WEEKLY':
            dueDate.setDate(dueDate.getDate() + (i * 14));
            break;
          case 'MONTHLY':
          default:
            dueDate.setMonth(dueDate.getMonth() + i);
            break;
        }
        
        installments.push({
          contractId: newContract.id,
          installmentNumber: i,
          dueDate,
          amount: paymentAmount,
          paidAmount: 0,
          remainingAmount: paymentAmount,
          status: 'pending' as const,
        });
      }
      
      await tx.installment.createMany({
        data: installments,
      });
      
      // Update invoice type and remaining amount
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          type: 'INSTALLMENT',
          paidAmount: downPayment,
          remainingAmount: financedAmount,
          status: downPayment >= invoiceTotal ? 'paid' : 'partial',
        },
      });
      
      // Update customer balance
      const newBalance = customer.balance + financedAmount;
      await tx.customer.update({
        where: { id: customerId },
        data: { balance: newBalance },
      });
      
      return newContract;
    });
    
    // Fetch the created contract with installments
    const contractWithInstallments = await db.installmentContract.findUnique({
      where: { id: contract.id },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: contractWithInstallments,
      message: 'Installment contract created successfully',
    });
  } catch (error: unknown) {
    console.error('Error creating installment contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create installment contract';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/installments/contracts - Update an installment contract
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateContractBody = await request.json();
    
    const {
      id,
      agentId,
      startDate,
      notes,
      status,
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }
    
    // Get existing contract
    const existingContract = await db.installmentContract.findUnique({
      where: { id },
      include: {
        installments: true,
        invoice: true,
        customer: true,
      },
    });
    
    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (agentId !== undefined) updateData.agentId = agentId || null;
    if (notes !== undefined) updateData.notes = notes;
    
    // Handle status changes
    if (status !== undefined && status !== existingContract.status) {
      // Validate status transitions
      if (existingContract.status === 'cancelled') {
        return NextResponse.json(
          { success: false, error: 'Cannot modify cancelled contract' },
          { status: 400 }
        );
      }
      
      if (existingContract.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'Cannot modify completed contract' },
          { status: 400 }
        );
      }
      
      updateData.status = status;
    }
    
    // Update contract with transaction for status changes
    const contract = await db.$transaction(async (tx) => {
      const updatedContract = await tx.installmentContract.update({
        where: { id },
        data: updateData,
        include: {
          installments: {
            orderBy: { installmentNumber: 'asc' },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
            },
          },
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              nameAr: true,
            },
          },
        },
      });
      
      // Handle cancellation
      if (status === 'cancelled' && existingContract.status !== 'cancelled') {
        // Cancel all pending installments
        await tx.installment.updateMany({
          where: {
            contractId: id,
            status: { in: ['pending', 'partial', 'overdue'] },
          },
          data: { status: 'cancelled' },
        });
        
        // Reverse customer balance
        const totalRemaining = existingContract.installments
          .filter(i => i.status !== 'paid')
          .reduce((sum, i) => sum + i.remainingAmount, 0);
        
        await tx.customer.update({
          where: { id: existingContract.customerId },
          data: {
            balance: { decrement: totalRemaining },
          },
        });
        
        // Update invoice
        await tx.invoice.update({
          where: { id: existingContract.invoiceId },
          data: {
            status: 'cancelled',
          },
        });
      }
      
      return updatedContract;
    });
    
    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Installment contract updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating installment contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update installment contract';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/installments/contracts - Cancel a contract
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }
    
    // Get existing contract
    const existingContract = await db.installmentContract.findUnique({
      where: { id },
      include: {
        installments: true,
        invoice: true,
        customer: true,
      },
    });
    
    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    if (existingContract.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Contract is already cancelled' },
        { status: 400 }
      );
    }
    
    // Check if any installments are paid
    const paidInstallments = existingContract.installments.filter(i => i.status === 'paid');
    if (paidInstallments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel contract with paid installments. Please reverse payments first.' },
        { status: 400 }
      );
    }
    
    // Cancel contract with transaction
    await db.$transaction(async (tx) => {
      // Update contract status
      await tx.installmentContract.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      
      // Cancel all installments
      await tx.installment.updateMany({
        where: { contractId: id },
        data: { status: 'cancelled' },
      });
      
      // Reverse customer balance
      await tx.customer.update({
        where: { id: existingContract.customerId },
        data: {
          balance: { decrement: existingContract.financedAmount },
        },
      });
      
      // Update invoice
      await tx.invoice.update({
        where: { id: existingContract.invoiceId },
        data: {
          type: 'CASH',
          status: 'pending',
          paidAmount: 0,
          remainingAmount: existingContract.invoice.total,
        },
      });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Installment contract cancelled successfully',
    });
  } catch (error: unknown) {
    console.error('Error cancelling installment contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel installment contract';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
