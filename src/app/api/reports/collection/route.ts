import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// GET /api/reports/collection - Collection report with multiple views
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Common parameters
    const companyId = searchParams.get('companyId');
    const branchId = searchParams.get('branchId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Report view type
    const view = searchParams.get('view') || 'summary'; // summary, byAgent, overdue, performance

    // Determine company filter
    const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId;
    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    let reportData: any = {};

    switch (view) {
      case 'byAgent':
        reportData = await getCollectionByAgent(targetCompanyId, branchId, dateFrom, dateTo);
        break;
      case 'overdue':
        reportData = await getOverdueInstallments(targetCompanyId, branchId);
        break;
      case 'performance':
        reportData = await getAgentPerformance(targetCompanyId, branchId, dateFrom, dateTo);
        break;
      case 'summary':
      default:
        reportData = await getCollectionSummary(targetCompanyId, branchId, dateFrom, dateTo);
        break;
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        view,
        companyId: targetCompanyId,
        branchId,
        dateFrom,
        dateTo,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating collection report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate collection report' },
      { status: 500 }
    );
  }
}

// Collection summary view
async function getCollectionSummary(companyId: string, branchId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  // Build payment where clause
  const paymentWhere: any = { companyId, status: 'completed' };
  if (branchId) paymentWhere.branchId = branchId;

  if (dateFrom || dateTo) {
    paymentWhere.paymentDate = {};
    if (dateFrom) paymentWhere.paymentDate.gte = new Date(dateFrom);
    if (dateTo) paymentWhere.paymentDate.lte = new Date(dateTo);
  }

  // Get payments
  const payments = await db.payment.findMany({
    where: paymentWhere,
    include: {
      customer: { select: { id: true, code: true, name: true, nameAr: true } },
      agent: { select: { id: true, name: true, nameAr: true } },
      branch: { select: { id: true, name: true, code: true } },
      invoice: { select: { invoiceNumber: true, type: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });

  // Get installment payments
  const installmentPaymentWhere: any = {
    installment: {
      contract: {
        invoice: { companyId },
      },
    },
  };

  if (branchId) {
    installmentPaymentWhere.installment.contract.invoice.branchId = branchId;
  }

  if (dateFrom || dateTo) {
    installmentPaymentWhere.paymentDate = {};
    if (dateFrom) installmentPaymentWhere.paymentDate.gte = new Date(dateFrom);
    if (dateTo) installmentPaymentWhere.paymentDate.lte = new Date(dateTo);
  }

  const installmentPayments = await db.installmentPayment.findMany({
    where: installmentPaymentWhere,
    include: {
      installment: {
        include: {
          contract: {
            include: {
              customer: { select: { id: true, code: true, name: true } },
              invoice: { select: { invoiceNumber: true } },
            },
          },
        },
      },
      agent: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });

  // Calculate summaries
  const summary = {
    payments: {
      count: payments.length,
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      byMethod: {} as Record<string, { count: number; total: number }>,
      byBranch: {} as Record<string, { name: string; count: number; total: number }>,
    },
    installmentPayments: {
      count: installmentPayments.length,
      total: installmentPayments.reduce((sum, ip) => sum + ip.amount, 0),
    },
    combined: {
      count: payments.length + installmentPayments.length,
      total: payments.reduce((sum, p) => sum + p.amount, 0) +
             installmentPayments.reduce((sum, ip) => sum + ip.amount, 0),
    },
    dailyTrend: [] as { date: string; count: number; total: number }[],
    topCollectors: [] as { id: string; name: string; count: number; total: number }[],
  };

  // By payment method
  for (const p of payments) {
    if (!summary.payments.byMethod[p.method]) {
      summary.payments.byMethod[p.method] = { count: 0, total: 0 };
    }
    summary.payments.byMethod[p.method].count++;
    summary.payments.byMethod[p.method].total += p.amount;
  }

  // By branch
  for (const p of payments) {
    if (p.branch) {
      if (!summary.payments.byBranch[p.branch.id]) {
        summary.payments.byBranch[p.branch.id] = { name: p.branch.name, count: 0, total: 0 };
      }
      summary.payments.byBranch[p.branch.id].count++;
      summary.payments.byBranch[p.branch.id].total += p.amount;
    }
  }

  // Daily trend
  const dailyCollections: Record<string, { date: string; count: number; total: number }> = {};
  
  // Add regular payments
  for (const p of payments) {
    const dateKey = new Date(p.paymentDate).toISOString().split('T')[0];
    if (!dailyCollections[dateKey]) {
      dailyCollections[dateKey] = { date: dateKey, count: 0, total: 0 };
    }
    dailyCollections[dateKey].count++;
    dailyCollections[dateKey].total += p.amount;
  }
  
  // Add installment payments
  for (const ip of installmentPayments) {
    const dateKey = new Date(ip.paymentDate).toISOString().split('T')[0];
    if (!dailyCollections[dateKey]) {
      dailyCollections[dateKey] = { date: dateKey, count: 0, total: 0 };
    }
    dailyCollections[dateKey].count++;
    dailyCollections[dateKey].total += ip.amount;
  }
  
  summary.dailyTrend = Object.values(dailyCollections).sort((a, b) => a.date.localeCompare(b.date));

  // Top collectors
  const collectorStats: Record<string, { id: string; name: string; count: number; total: number }> = {};
  
  for (const p of payments) {
    if (p.agent) {
      if (!collectorStats[p.agent.id]) {
        collectorStats[p.agent.id] = { id: p.agent.id, name: p.agent.name, count: 0, total: 0 };
      }
      collectorStats[p.agent.id].count++;
      collectorStats[p.agent.id].total += p.amount;
    }
  }
  
  for (const ip of installmentPayments) {
    if (ip.agent) {
      if (!collectorStats[ip.agent.id]) {
        collectorStats[ip.agent.id] = { id: ip.agent.id, name: ip.agent.name, count: 0, total: 0 };
      }
      collectorStats[ip.agent.id].count++;
      collectorStats[ip.agent.id].total += ip.amount;
    }
  }
  
  summary.topCollectors = Object.values(collectorStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    summary,
    payments: payments.slice(0, 100),
    installmentPayments: installmentPayments.slice(0, 100),
  };
}

// Collection by agent view
async function getCollectionByAgent(companyId: string, branchId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  // Build where clauses
  const paymentWhere: any = { companyId, status: 'completed' };
  if (branchId) paymentWhere.branchId = branchId;

  if (dateFrom || dateTo) {
    paymentWhere.paymentDate = {};
    if (dateFrom) paymentWhere.paymentDate.gte = new Date(dateFrom);
    if (dateTo) paymentWhere.paymentDate.lte = new Date(dateTo);
  }

  const payments = await db.payment.findMany({
    where: paymentWhere,
    include: {
      agent: { select: { id: true, name: true, nameAr: true, email: true } },
    },
  });

  // Get installment payments
  const installmentPaymentWhere: any = {
    installment: { contract: { invoice: { companyId } } },
  };
  if (branchId) installmentPaymentWhere.installment.contract.invoice.branchId = branchId;
  if (dateFrom || dateTo) {
    installmentPaymentWhere.paymentDate = {};
    if (dateFrom) installmentPaymentWhere.paymentDate.gte = new Date(dateFrom);
    if (dateTo) installmentPaymentWhere.paymentDate.lte = new Date(dateTo);
  }

  const installmentPayments = await db.installmentPayment.findMany({
    where: installmentPaymentWhere,
    include: {
      agent: { select: { id: true, name: true, nameAr: true, email: true } },
    },
  });

  // Aggregate by agent
  const agentCollections: Record<string, {
    id: string;
    name: string;
    nameAr: string | null;
    email: string | null;
    paymentCount: number;
    totalCollected: number;
    regularPayments: number;
    installmentPayments: number;
    byMethod: Record<string, number>;
    customers: Set<string>;
  }> = {};

  // Process regular payments
  for (const p of payments) {
    const agentId = p.agentId || 'no-agent';
    if (!agentCollections[agentId]) {
      agentCollections[agentId] = {
        id: agentId,
        name: p.agent?.name || 'Unassigned',
        nameAr: p.agent?.nameAr || null,
        email: p.agent?.email || null,
        paymentCount: 0,
        totalCollected: 0,
        regularPayments: 0,
        installmentPayments: 0,
        byMethod: {},
        customers: new Set(),
      };
    }
    agentCollections[agentId].paymentCount++;
    agentCollections[agentId].totalCollected += p.amount;
    agentCollections[agentId].regularPayments++;
    agentCollections[agentId].byMethod[p.method] = (agentCollections[agentId].byMethod[p.method] || 0) + p.amount;
    agentCollections[agentId].customers.add(p.customerId);
  }

  // Process installment payments
  for (const ip of installmentPayments) {
    const agentId = ip.agentId || 'no-agent';
    if (!agentCollections[agentId]) {
      agentCollections[agentId] = {
        id: agentId,
        name: ip.agent?.name || 'Unassigned',
        nameAr: ip.agent?.nameAr || null,
        email: ip.agent?.email || null,
        paymentCount: 0,
        totalCollected: 0,
        regularPayments: 0,
        installmentPayments: 0,
        byMethod: {},
        customers: new Set(),
      };
    }
    agentCollections[agentId].paymentCount++;
    agentCollections[agentId].totalCollected += ip.amount;
    agentCollections[agentId].installmentPayments++;
    agentCollections[agentId].byMethod['INSTALLMENT'] = (agentCollections[agentId].byMethod['INSTALLMENT'] || 0) + ip.amount;
  }

  // Convert to array and calculate derived values
  const result = Object.values(agentCollections).map(agent => ({
    id: agent.id,
    name: agent.name,
    nameAr: agent.nameAr,
    email: agent.email,
    paymentCount: agent.paymentCount,
    totalCollected: agent.totalCollected,
    regularPayments: agent.regularPayments,
    installmentPayments: agent.installmentPayments,
    byMethod: agent.byMethod,
    customerCount: agent.customers.size,
    averageCollection: agent.paymentCount > 0 ? agent.totalCollected / agent.paymentCount : 0,
  }));

  // Sort by total collected
  result.sort((a, b) => b.totalCollected - a.totalCollected);

  return {
    agents: result,
    totals: {
      totalAgents: result.length,
      totalCollected: result.reduce((sum, a) => sum + a.totalCollected, 0),
      totalPayments: result.reduce((sum, a) => sum + a.paymentCount, 0),
      averagePerAgent: result.length > 0 ? result.reduce((sum, a) => sum + a.totalCollected, 0) / result.length : 0,
    },
  };
}

// Overdue installments view
async function getOverdueInstallments(companyId: string, branchId?: string | null) {
  // Get overdue installments
  const overdueWhere: any = {
    status: { in: ['pending', 'partial', 'overdue'] },
    dueDate: { lt: new Date() },
    contract: {
      status: 'active',
      invoice: { companyId },
    },
  };

  if (branchId) {
    overdueWhere.contract.invoice.branchId = branchId;
  }

  const overdueInstallments = await db.installment.findMany({
    where: overdueWhere,
    include: {
      contract: {
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              nameAr: true,
              phone: true,
              phone2: true,
              address: true,
              zone: { select: { id: true, name: true } },
            },
          },
          invoice: {
            select: {
              invoiceNumber: true,
              branch: { select: { id: true, name: true } },
            },
          },
          agent: { select: { id: true, name: true, nameAr: true } },
        },
      },
      payments: true,
    },
    orderBy: { dueDate: 'asc' },
  });

  // Calculate overdue statistics
  const now = new Date();
  const summary = {
    totalOverdue: overdueInstallments.length,
    totalOverdueAmount: overdueInstallments.reduce((sum, i) => sum + i.remainingAmount, 0),
    byAge: {
      current: 0,        // 0-30 days
      thirtyDays: 0,     // 31-60 days
      sixtyDays: 0,      // 61-90 days
      ninetyDays: 0,     // 91-180 days
      oneEightyDays: 0,  // 180+ days
    },
    byAmountRange: {
      small: 0,      // < 100
      medium: 0,     // 100-500
      large: 0,      // 500-1000
      veryLarge: 0,  // > 1000
    },
    totalLateFees: overdueInstallments.reduce((sum, i) => sum + i.lateFee, 0),
    averageDaysOverdue: 0,
    byZone: {} as Record<string, { name: string; count: number; amount: number }>,
    byAgent: {} as Record<string, { name: string; count: number; amount: number }>,
  };

  let totalDaysOverdue = 0;

  for (const installment of overdueInstallments) {
    // Calculate days overdue
    const daysOverdue = Math.floor((now.getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    totalDaysOverdue += daysOverdue;

    // By age
    if (daysOverdue <= 30) summary.byAge.current++;
    else if (daysOverdue <= 60) summary.byAge.thirtyDays++;
    else if (daysOverdue <= 90) summary.byAge.sixtyDays++;
    else if (daysOverdue <= 180) summary.byAge.ninetyDays++;
    else summary.byAge.oneEightyDays++;

    // By amount range
    if (installment.remainingAmount < 100) summary.byAmountRange.small++;
    else if (installment.remainingAmount < 500) summary.byAmountRange.medium++;
    else if (installment.remainingAmount < 1000) summary.byAmountRange.large++;
    else summary.byAmountRange.veryLarge++;

    // By zone
    const zone = installment.contract.customer.zone;
    if (zone) {
      if (!summary.byZone[zone.id]) {
        summary.byZone[zone.id] = { name: zone.name, count: 0, amount: 0 };
      }
      summary.byZone[zone.id].count++;
      summary.byZone[zone.id].amount += installment.remainingAmount;
    }

    // By agent
    const agent = installment.contract.agent;
    if (agent) {
      if (!summary.byAgent[agent.id]) {
        summary.byAgent[agent.id] = { name: agent.name, count: 0, amount: 0 };
      }
      summary.byAgent[agent.id].count++;
      summary.byAgent[agent.id].amount += installment.remainingAmount;
    }
  }

  summary.averageDaysOverdue = overdueInstallments.length > 0 ? totalDaysOverdue / overdueInstallments.length : 0;

  // Format overdue installments with additional info
  const formattedInstallments = overdueInstallments.map(installment => {
    const daysOverdue = Math.floor((now.getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: installment.id,
      installmentNumber: installment.installmentNumber,
      amount: installment.amount,
      paidAmount: installment.paidAmount,
      remainingAmount: installment.remainingAmount,
      dueDate: installment.dueDate,
      daysOverdue,
      lateFee: installment.lateFee,
      contract: {
        contractNumber: installment.contract.contractNumber,
        invoiceNumber: installment.contract.invoice?.invoiceNumber,
      },
      customer: installment.contract.customer,
      branch: installment.contract.invoice?.branch,
      agent: installment.contract.agent,
    };
  });

  return {
    summary,
    installments: formattedInstallments,
  };
}

// Agent performance view
async function getAgentPerformance(companyId: string, branchId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  // Get agents with collection role
  const agents = await db.user.findMany({
    where: {
      companyId,
      role: { in: ['AGENT', 'COLLECTOR'] },
      active: true,
      ...(branchId ? { branchId } : {}),
    },
    select: {
      id: true,
      name: true,
      nameAr: true,
      email: true,
      branch: { select: { id: true, name: true } },
    },
  });

  // Get date range
  const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
  const endDate = dateTo ? new Date(dateTo) : new Date();

  // Get collections for each agent
  const agentPerformance = await Promise.all(agents.map(async (agent) => {
    // Regular payments
    const payments = await db.payment.findMany({
      where: {
        agentId: agent.id,
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
    });

    // Installment payments
    const installmentPayments = await db.installmentPayment.findMany({
      where: {
        agentId: agent.id,
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Assigned customers count
    const assignedCustomers = await db.customer.count({
      where: {
        agentId: agent.id,
        active: true,
      },
    });

    // Active contracts count
    const activeContracts = await db.installmentContract.count({
      where: {
        agentId: agent.id,
        status: 'active',
      },
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0) +
                          installmentPayments.reduce((sum, ip) => sum + ip.amount, 0);
    const totalPayments = payments.length + installmentPayments.length;

    // Calculate daily average
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = totalCollected / daysDiff;

    // Get overdue count for this agent's contracts
    const overdueCount = await db.installment.count({
      where: {
        status: { in: ['pending', 'partial', 'overdue'] },
        dueDate: { lt: new Date() },
        contract: {
          agentId: agent.id,
          status: 'active',
        },
      },
    });

    return {
      id: agent.id,
      name: agent.name,
      nameAr: agent.nameAr,
      email: agent.email,
      branch: agent.branch,
      metrics: {
        totalCollected,
        totalPayments,
        dailyAverage,
        assignedCustomers,
        activeContracts,
        overdueContracts: overdueCount,
        collectionRate: activeContracts > 0 ? ((activeContracts - overdueCount) / activeContracts) * 100 : 100,
      },
    };
  }));

  // Sort by total collected
  agentPerformance.sort((a, b) => b.metrics.totalCollected - a.metrics.totalCollected);

  // Calculate team averages
  const teamAverages = {
    averageCollected: agentPerformance.length > 0
      ? agentPerformance.reduce((sum, a) => sum + a.metrics.totalCollected, 0) / agentPerformance.length
      : 0,
    averagePayments: agentPerformance.length > 0
      ? agentPerformance.reduce((sum, a) => sum + a.metrics.totalPayments, 0) / agentPerformance.length
      : 0,
    averageDaily: agentPerformance.length > 0
      ? agentPerformance.reduce((sum, a) => sum + a.metrics.dailyAverage, 0) / agentPerformance.length
      : 0,
  };

  return {
    agents: agentPerformance,
    teamAverages,
    period: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    },
  };
}
