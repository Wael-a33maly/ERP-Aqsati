import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Types
interface CreateInstallmentPaymentBody {
  agentId?: string;
  paymentDate?: string;
  amount: number;
  method: 'CASH' | 'BANK' | 'CHECK' | 'MOBILE';
  reference?: string;
  notes?: string;
  includeLateFee?: boolean;
}

// GET /api/installments/[id]/payments - Get payments for an installment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get installment with payments
    const installment = await db.installment.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            totalAmount: true,
            downPayment: true,
            financedAmount: true,
            numberOfPayments: true,
            status: true,
            customer: {
              select: {
                id: true,
                code: true,
                name: true,
                nameAr: true,
                phone: true,
                phone2: true,
                address: true,
              },
            },
            agent: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
      },
    });
    
    if (!installment) {
      return NextResponse.json(
        { success: false, error: 'Installment not found' },
        { status: 404 }
      );
    }
    
    // Calculate late fee if overdue
    let lateFee = 0;
    if (installment.status !== 'paid' && installment.status !== 'cancelled' && new Date() > installment.dueDate) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const lateFeeRate = 0.001; // 0.1% per day
      lateFee = installment.remainingAmount * lateFeeRate * daysOverdue;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...installment,
        calculatedLateFee: lateFee,
        totalDue: installment.remainingAmount + lateFee,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching installment payments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch installment payments';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/installments/[id]/payments - Record a payment for an installment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CreateInstallmentPaymentBody = await request.json();
    
    const {
      agentId,
      paymentDate,
      amount,
      method,
      reference,
      notes,
      includeLateFee = false,
    } = body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }
    
    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }
    
    // Get installment with contract details
    const installment = await db.installment.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            customer: true,
            invoice: true,
          },
        },
        payments: true,
      },
    });
    
    if (!installment) {
      return NextResponse.json(
        { success: false, error: 'Installment not found' },
        { status: 404 }
      );
    }
    
    // Check if installment can accept payments
    if (installment.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Installment is already fully paid' },
        { status: 400 }
      );
    }
    
    if (installment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot record payment for cancelled installment' },
        { status: 400 }
      );
    }
    
    // Calculate late fee if applicable
    let lateFee = 0;
    if (includeLateFee && new Date() > installment.dueDate) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const lateFeeRate = 0.001; // 0.1% per day
      lateFee = installment.remainingAmount * lateFeeRate * daysOverdue;
    }
    
    const totalDue = installment.remainingAmount + lateFee;
    
    // Validate payment amount
    if (amount > totalDue) {
      return NextResponse.json(
        { success: false, error: `Payment amount exceeds total due. Maximum allowed: ${totalDue.toFixed(2)}` },
        { status: 400 }
      );
    }
    
    // Record payment with transaction
    const result = await db.$transaction(async (tx) => {
      // Create installment payment record
      const payment = await tx.installmentPayment.create({
        data: {
          installmentId: id,
          companyId: installment.companyId, // إضافة companyId
          agentId: agentId || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amount,
          method,
          reference: reference || null,
          notes: notes || null,
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
        },
      });
      
      // Update installment status
      const newPaidAmount = installment.paidAmount + amount;
      const newRemainingAmount = installment.remainingAmount - amount + (includeLateFee ? lateFee : 0);
      
      let newStatus = installment.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      }
      
      await tx.installment.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date() : null,
          lateFee: includeLateFee ? { increment: lateFee } : installment.lateFee,
        },
      });
      
      // Update customer balance
      const customer = installment.contract.customer;
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          balance: { decrement: amount },
        },
      });
      
      // Check if contract is completed
      const allInstallments = await tx.installment.findMany({
        where: { contractId: installment.contractId },
        select: { status: true },
      });
      
      const allPaid = allInstallments.every(i => i.status === 'paid');
      
      if (allPaid) {
        await tx.installmentContract.update({
          where: { id: installment.contractId },
          data: { status: 'completed' },
        });
        
        // Update invoice status
        await tx.invoice.update({
          where: { id: installment.contract.invoiceId },
          data: {
            status: 'paid',
            paidAmount: installment.contract.totalAmount,
            remainingAmount: 0,
          },
        });
      }
      
      // Create agent commission if applicable
      if (agentId) {
        const commissionPolicy = await tx.commissionPolicy.findFirst({
          where: {
            companyId: installment.contract.invoice.companyId,
            OR: [
              { agentId },
              { agentId: null },
            ],
            type: { in: ['COLLECTION', 'BOTH'] },
            active: true,
          },
        });
        
        if (commissionPolicy) {
          let commissionAmount = 0;
          
          if (commissionPolicy.calculationType === 'PERCENTAGE') {
            commissionAmount = amount * (commissionPolicy.value / 100);
          } else {
            commissionAmount = commissionPolicy.value;
          }
          
          // Apply min/max if set
          if (commissionPolicy.minAmount && commissionAmount < commissionPolicy.minAmount) {
            commissionAmount = commissionPolicy.minAmount;
          }
          if (commissionPolicy.maxAmount && commissionAmount > commissionPolicy.maxAmount) {
            commissionAmount = commissionPolicy.maxAmount;
          }
          
          await tx.agentCommission.create({
            data: {
              companyId: installment.contract.invoice.companyId, // إضافة companyId
              agentId,
              policyId: commissionPolicy.id,
              type: 'COLLECTION',
              referenceType: 'PAYMENT',
              referenceId: payment.id,
              amount: commissionAmount,
              status: 'pending',
            },
          });
        }
      }
      
      return payment;
    });
    
    // Fetch updated installment
    const updatedInstallment = await db.installment.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                balance: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        payment: result,
        installment: updatedInstallment,
      },
      message: 'Installment payment recorded successfully',
    });
  } catch (error: unknown) {
    console.error('Error recording installment payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to record installment payment';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/installments/[id]/payments - Reverse an installment payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    // Get installment and payment
    const installment = await db.installment.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            customer: true,
            invoice: true,
          },
        },
        payments: {
          where: { id: paymentId },
        },
      },
    });
    
    if (!installment) {
      return NextResponse.json(
        { success: false, error: 'Installment not found' },
        { status: 404 }
      );
    }
    
    const payment = installment.payments[0];
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Reverse payment with transaction
    await db.$transaction(async (tx) => {
      // Delete the payment record
      await tx.installmentPayment.delete({
        where: { id: paymentId },
      });
      
      // Update installment status
      const newPaidAmount = installment.paidAmount - payment.amount;
      const newRemainingAmount = installment.remainingAmount + payment.amount;
      
      let newStatus = 'pending';
      if (newPaidAmount > 0) {
        newStatus = 'partial';
      }
      
      // Check if overdue
      if (new Date() > installment.dueDate && newRemainingAmount > 0) {
        newStatus = 'overdue';
      }
      
      await tx.installment.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paidDate: null,
        },
      });
      
      // Update customer balance
      await tx.customer.update({
        where: { id: installment.contract.customerId },
        data: {
          balance: { increment: payment.amount },
        },
      });
      
      // Check if contract needs to be reactivated
      if (installment.contract.status === 'completed') {
        await tx.installmentContract.update({
          where: { id: installment.contractId },
          data: { status: 'active' },
        });
        
        await tx.invoice.update({
          where: { id: installment.contract.invoiceId },
          data: {
            status: 'partial',
            remainingAmount: payment.amount,
          },
        });
      }
      
      // Cancel agent commissions
      await tx.agentCommission.updateMany({
        where: {
          referenceType: 'PAYMENT',
          referenceId: paymentId,
        },
        data: { status: 'cancelled' },
      });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Installment payment reversed successfully',
    });
  } catch (error: unknown) {
    console.error('Error reversing installment payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reverse installment payment';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
