import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Statement transaction types
type TransactionType = 'invoice' | 'payment' | 'return' | 'installment_payment' | 'installment_due';

interface StatementTransaction {
  id: string;
  type: TransactionType;
  date: Date;
  reference: string;
  description: string;
  debit: number;  // Amount owed (invoices, installments)
  credit: number; // Amount paid (payments, returns)
  balance: number; // Running balance
  status: string;
  relatedId?: string;
  relatedType?: string;
}

// GET /api/customers/[id]/statement - Get customer statement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Date range filter
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Transaction type filter
    const types = searchParams.get('types')?.split(',') || null;
    
    // Get customer
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        zone: {
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
            nameAr: true,
            phone: true,
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
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Build date filter
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    
    // Fetch all transactions in parallel
    const [
      invoices,
      payments,
      returns,
      installmentContracts,
      installmentPayments,
    ] = await Promise.all([
      // Get invoices
      db.invoice.findMany({
        where: {
          customerId: id,
          status: { not: 'cancelled' },
          ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter }),
        },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          type: true,
          status: true,
          total: true,
          paidAmount: true,
          remainingAmount: true,
          items: {
            select: {
              productId: true,
              product: { select: { name: true } },
              quantity: true,
              total: true,
            },
          },
        },
        orderBy: { invoiceDate: 'asc' },
      }),
      
      // Get payments
      db.payment.findMany({
        where: {
          customerId: id,
          status: { not: 'cancelled' },
          ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter }),
        },
        select: {
          id: true,
          paymentNumber: true,
          paymentDate: true,
          method: true,
          amount: true,
          status: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: { paymentDate: 'asc' },
      }),
      
      // Get returns
      db.return.findMany({
        where: {
          customerId: id,
          status: 'approved',
          ...(Object.keys(dateFilter).length > 0 && { returnDate: dateFilter }),
        },
        select: {
          id: true,
          returnNumber: true,
          returnDate: true,
          type: true,
          total: true,
          status: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: { returnDate: 'asc' },
      }),
      
      // Get installment contracts
      db.installmentContract.findMany({
        where: {
          customerId: id,
          status: { not: 'cancelled' },
        },
        select: {
          id: true,
          contractNumber: true,
          totalAmount: true,
          downPayment: true,
          financedAmount: true,
          contractDate: true,
          status: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
          installments: {
            where: {
              status: { not: 'cancelled' },
              ...(Object.keys(dateFilter).length > 0 && { dueDate: dateFilter }),
            },
            select: {
              id: true,
              installmentNumber: true,
              dueDate: true,
              amount: true,
              paidAmount: true,
              remainingAmount: true,
              status: true,
              payments: {
                select: {
                  id: true,
                  paymentDate: true,
                  amount: true,
                  method: true,
                },
              },
            },
            orderBy: { dueDate: 'asc' },
          },
        },
      }),
      
      // Get all installment payments for this customer
      db.installmentPayment.findMany({
        where: {
          installment: {
            contract: { customerId: id },
          },
          ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter }),
        },
        select: {
          id: true,
          paymentDate: true,
          amount: true,
          method: true,
          installment: {
            select: {
              id: true,
              installmentNumber: true,
              contract: {
                select: {
                  id: true,
                  contractNumber: true,
                },
              },
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { paymentDate: 'asc' },
      }),
    ]);
    
    // Build statement transactions
    const transactions: StatementTransaction[] = [];
    
    // Add invoices
    if (!types || types.includes('invoice')) {
      invoices.forEach(invoice => {
        transactions.push({
          id: `inv-${invoice.id}`,
          type: 'invoice',
          date: invoice.invoiceDate,
          reference: invoice.invoiceNumber,
          description: `Invoice (${invoice.type}) - ${invoice.items.length} items`,
          debit: invoice.total,
          credit: 0,
          balance: 0, // Will be calculated later
          status: invoice.status,
          relatedId: invoice.id,
          relatedType: 'invoice',
        });
      });
    }
    
    // Add payments
    if (!types || types.includes('payment')) {
      payments.forEach(payment => {
        transactions.push({
          id: `pay-${payment.id}`,
          type: 'payment',
          date: payment.paymentDate,
          reference: payment.paymentNumber,
          description: `Payment (${payment.method})${payment.invoice ? ` - Invoice ${payment.invoice.invoiceNumber}` : ''}`,
          debit: 0,
          credit: payment.amount,
          balance: 0,
          status: payment.status,
          relatedId: payment.id,
          relatedType: 'payment',
        });
      });
    }
    
    // Add returns
    if (!types || types.includes('return')) {
      returns.forEach(ret => {
        transactions.push({
          id: `ret-${ret.id}`,
          type: 'return',
          date: ret.returnDate,
          reference: ret.returnNumber,
          description: `Return (${ret.type})${ret.invoice ? ` - Invoice ${ret.invoice.invoiceNumber}` : ''}`,
          debit: 0,
          credit: ret.total,
          balance: 0,
          status: ret.status,
          relatedId: ret.id,
          relatedType: 'return',
        });
      });
    }
    
    // Add installment due dates
    if (!types || types.includes('installment_due')) {
      installmentContracts.forEach(contract => {
        contract.installments.forEach(installment => {
          transactions.push({
            id: `inst-due-${installment.id}`,
            type: 'installment_due',
            date: installment.dueDate,
            reference: `${contract.contractNumber}/${installment.installmentNumber}`,
            description: `Installment #${installment.installmentNumber} due`,
            debit: installment.amount,
            credit: 0,
            balance: 0,
            status: installment.status,
            relatedId: installment.id,
            relatedType: 'installment',
          });
        });
      });
    }
    
    // Add installment payments
    if (!types || types.includes('installment_payment')) {
      installmentPayments.forEach(payment => {
        transactions.push({
          id: `inst-pay-${payment.id}`,
          type: 'installment_payment',
          date: payment.paymentDate,
          reference: `${payment.installment.contract.contractNumber}/${payment.installment.installmentNumber}`,
          description: `Installment Payment (${payment.method}) - #${payment.installment.installmentNumber}${payment.agent ? ` by ${payment.agent.name}` : ''}`,
          debit: 0,
          credit: payment.amount,
          balance: 0,
          status: 'completed',
          relatedId: payment.id,
          relatedType: 'installment_payment',
        });
      });
    }
    
    // Sort by date
    transactions.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        // Same date: invoices first, then payments, then others
        const typeOrder: Record<TransactionType, number> = {
          invoice: 1,
          installment_due: 2,
          payment: 3,
          installment_payment: 4,
          return: 5,
        };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return dateCompare;
    });
    
    // Calculate running balance
    let runningBalance = 0;
    transactions.forEach(tx => {
      runningBalance += tx.debit - tx.credit;
      tx.balance = runningBalance;
    });
    
    // Calculate summary
    const totalDebit = transactions.reduce((sum, tx) => sum + tx.debit, 0);
    const totalCredit = transactions.reduce((sum, tx) => sum + tx.credit, 0);
    
    // Get current status
    const currentBalance = customer.balance;
    
    // Get active installment contracts summary
    const activeContracts = installmentContracts.filter(c => c.status === 'active');
    const totalInstallmentRemaining = activeContracts.reduce((sum, c) => {
      return sum + c.installments.reduce((s, i) => s + i.remainingAmount, 0);
    }, 0);
    
    // Get overdue installments
    const overdueInstallments = activeContracts.flatMap(c => 
      c.installments.filter(i => 
        (i.status === 'pending' || i.status === 'partial' || i.status === 'overdue') && 
        new Date() > i.dueDate
      )
    );
    
    const totalOverdue = overdueInstallments.reduce((sum, i) => sum + i.remainingAmount, 0);
    
    // Build summary
    const summary = {
      customer: {
        id: customer.id,
        code: customer.code,
        name: customer.name,
        nameAr: customer.nameAr,
        phone: customer.phone,
        phone2: customer.phone2,
        address: customer.address,
        creditLimit: customer.creditLimit,
        currentBalance,
        zone: customer.zone,
        agent: customer.agent,
        branch: customer.branch,
      },
      period: {
        from: dateFrom ? new Date(dateFrom) : null,
        to: dateTo ? new Date(dateTo) : null,
      },
      totals: {
        totalDebit,
        totalCredit,
        netChange: totalDebit - totalCredit,
        openingBalance: currentBalance - (totalDebit - totalCredit), // Estimated
        closingBalance: currentBalance,
      },
      invoices: {
        count: invoices.length,
        total: invoices.reduce((sum, i) => sum + i.total, 0),
        paid: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
        outstanding: invoices.reduce((sum, i) => sum + i.remainingAmount, 0),
      },
      payments: {
        count: payments.length,
        total: payments.reduce((sum, p) => sum + p.amount, 0),
        byMethod: payments.reduce((acc, p) => {
          acc[p.method] = (acc[p.method] || 0) + p.amount;
          return acc;
        }, {} as Record<string, number>),
      },
      returns: {
        count: returns.length,
        total: returns.reduce((sum, r) => sum + r.total, 0),
      },
      installments: {
        activeContracts: activeContracts.length,
        totalRemaining: totalInstallmentRemaining,
        overdueCount: overdueInstallments.length,
        overdueAmount: totalOverdue,
      },
    };
    
    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary,
        customer: summary.customer,
      },
    });
  } catch (error: unknown) {
    console.error('Error generating customer statement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate customer statement';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
