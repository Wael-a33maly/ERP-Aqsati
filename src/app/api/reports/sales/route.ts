import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// GET /api/reports/sales - Sales report with multiple views
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
    const view = searchParams.get('view') || 'summary'; // summary, byAgent, byBranch, byProduct, byCustomer, byPeriod

    // Determine company filter
    const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId;
    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    // Build base where clause
    const where: any = { companyId: targetCompanyId };
    if (branchId) where.branchId = branchId;

    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) where.invoiceDate.gte = new Date(dateFrom);
      if (dateTo) where.invoiceDate.lte = new Date(dateTo);
    }

    // Get base data first
    const invoices = await db.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, code: true, name: true, nameAr: true, zoneId: true } },
        agent: { select: { id: true, name: true, nameAr: true } },
        branch: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                nameAr: true,
                costPrice: true,
                sellPrice: true,
                categoryId: true,
              },
            },
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    let reportData: any = {};

    switch (view) {
      case 'byAgent':
        reportData = await getSalesByAgent(invoices);
        break;
      case 'byBranch':
        reportData = await getSalesByBranch(invoices);
        break;
      case 'byProduct':
        reportData = await getSalesByProduct(invoices);
        break;
      case 'byCustomer':
        reportData = await getSalesByCustomer(invoices);
        break;
      case 'byPeriod':
        reportData = await getSalesByPeriod(invoices, dateFrom, dateTo);
        break;
      case 'summary':
      default:
        reportData = await getSalesSummary(invoices);
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
    console.error('Error generating sales report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate sales report' },
      { status: 500 }
    );
  }
}

// Sales summary view
async function getSalesSummary(invoices: any[]) {
  const summary = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalSubtotal: invoices.reduce((sum, inv) => sum + inv.subtotal, 0),
    totalTax: invoices.reduce((sum, inv) => sum + inv.taxAmount, 0),
    totalDiscount: invoices.reduce((sum, inv) => sum + inv.discount, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    totalRemaining: invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
    averageInvoiceValue: 0,
    byStatus: {} as Record<string, { count: number; total: number }>,
    byType: { CASH: { count: 0, total: 0 }, INSTALLMENT: { count: 0, total: 0 } },
    topProducts: [] as { id: string; name: string; quantity: number; total: number }[],
    topCustomers: [] as { id: string; name: string; count: number; total: number }[],
    dailyTrend: [] as { date: string; count: number; total: number }[],
  };

  // Calculate average
  summary.averageInvoiceValue = invoices.length > 0 ? summary.totalAmount / invoices.length : 0;

  // By status and type
  for (const inv of invoices) {
    // By status
    if (!summary.byStatus[inv.status]) {
      summary.byStatus[inv.status] = { count: 0, total: 0 };
    }
    summary.byStatus[inv.status].count++;
    summary.byStatus[inv.status].total += inv.total;

    // By type
    summary.byType[inv.type].count++;
    summary.byType[inv.type].total += inv.total;
  }

  // Top products
  const productSales: Record<string, { id: string; name: string; quantity: number; total: number }> = {};
  for (const inv of invoices) {
    for (const item of inv.items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          id: item.productId,
          name: item.product.name,
          quantity: 0,
          total: 0,
        };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].total += item.total;
    }
  }
  summary.topProducts = Object.values(productSales)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Top customers
  const customerSales: Record<string, { id: string; name: string; count: number; total: number }> = {};
  for (const inv of invoices) {
    if (!customerSales[inv.customerId]) {
      customerSales[inv.customerId] = {
        id: inv.customerId,
        name: inv.customer.name,
        count: 0,
        total: 0,
      };
    }
    customerSales[inv.customerId].count++;
    customerSales[inv.customerId].total += inv.total;
  }
  summary.topCustomers = Object.values(customerSales)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Daily trend
  const dailySales: Record<string, { date: string; count: number; total: number }> = {};
  for (const inv of invoices) {
    const dateKey = new Date(inv.invoiceDate).toISOString().split('T')[0];
    if (!dailySales[dateKey]) {
      dailySales[dateKey] = { date: dateKey, count: 0, total: 0 };
    }
    dailySales[dateKey].count++;
    dailySales[dateKey].total += inv.total;
  }
  summary.dailyTrend = Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary,
    invoices: invoices.slice(0, 100), // Return first 100 invoices
  };
}

// Sales by agent view
async function getSalesByAgent(invoices: any[]) {
  const agentSales: Record<string, {
    id: string;
    name: string;
    nameAr: string | null;
    invoiceCount: number;
    totalSales: number;
    totalPaid: number;
    totalRemaining: number;
    averageSale: number;
    cashSales: number;
    installmentSales: number;
    customers: Set<string>;
  }> = {};

  for (const inv of invoices) {
    const agentId = inv.agentId || 'no-agent';
    if (!agentSales[agentId]) {
      agentSales[agentId] = {
        id: agentId,
        name: inv.agent?.name || 'Unassigned',
        nameAr: inv.agent?.nameAr || null,
        invoiceCount: 0,
        totalSales: 0,
        totalPaid: 0,
        totalRemaining: 0,
        averageSale: 0,
        cashSales: 0,
        installmentSales: 0,
        customers: new Set(),
      };
    }
    agentSales[agentId].invoiceCount++;
    agentSales[agentId].totalSales += inv.total;
    agentSales[agentId].totalPaid += inv.paidAmount;
    agentSales[agentId].totalRemaining += inv.remainingAmount;
    if (inv.type === 'CASH') {
      agentSales[agentId].cashSales += inv.total;
    } else {
      agentSales[agentId].installmentSales += inv.total;
    }
    agentSales[agentId].customers.add(inv.customerId);
  }

  // Calculate averages and convert sets to counts
  const result = Object.values(agentSales).map(agent => ({
    ...agent,
    averageSale: agent.invoiceCount > 0 ? agent.totalSales / agent.invoiceCount : 0,
    customerCount: agent.customers.size,
    customers: undefined,
  }));

  // Sort by total sales
  result.sort((a, b) => b.totalSales - a.totalSales);

  return {
    agents: result,
    totals: {
      totalAgents: result.length,
      totalSales: result.reduce((sum, a) => sum + a.totalSales, 0),
      totalPaid: result.reduce((sum, a) => sum + a.totalPaid, 0),
      totalRemaining: result.reduce((sum, a) => sum + a.totalRemaining, 0),
    },
  };
}

// Sales by branch view
async function getSalesByBranch(invoices: any[]) {
  const branchSales: Record<string, {
    id: string;
    name: string;
    code: string;
    invoiceCount: number;
    totalSales: number;
    totalPaid: number;
    totalRemaining: number;
    averageSale: number;
    cashSales: number;
    installmentSales: number;
    agents: Set<string>;
    customers: Set<string>;
  }> = {};

  for (const inv of invoices) {
    const branchId = inv.branchId || 'no-branch';
    if (!branchSales[branchId]) {
      branchSales[branchId] = {
        id: branchId,
        name: inv.branch?.name || 'Unassigned',
        code: inv.branch?.code || 'N/A',
        invoiceCount: 0,
        totalSales: 0,
        totalPaid: 0,
        totalRemaining: 0,
        averageSale: 0,
        cashSales: 0,
        installmentSales: 0,
        agents: new Set(),
        customers: new Set(),
      };
    }
    branchSales[branchId].invoiceCount++;
    branchSales[branchId].totalSales += inv.total;
    branchSales[branchId].totalPaid += inv.paidAmount;
    branchSales[branchId].totalRemaining += inv.remainingAmount;
    if (inv.type === 'CASH') {
      branchSales[branchId].cashSales += inv.total;
    } else {
      branchSales[branchId].installmentSales += inv.total;
    }
    if (inv.agentId) branchSales[branchId].agents.add(inv.agentId);
    branchSales[branchId].customers.add(inv.customerId);
  }

  // Calculate averages and convert sets to counts
  const result = Object.values(branchSales).map(branch => ({
    ...branch,
    averageSale: branch.invoiceCount > 0 ? branch.totalSales / branch.invoiceCount : 0,
    agentCount: branch.agents.size,
    customerCount: branch.customers.size,
    agents: undefined,
    customers: undefined,
  }));

  // Sort by total sales
  result.sort((a, b) => b.totalSales - a.totalSales);

  return {
    branches: result,
    totals: {
      totalBranches: result.length,
      totalSales: result.reduce((sum, b) => sum + b.totalSales, 0),
      totalPaid: result.reduce((sum, b) => sum + b.totalPaid, 0),
      totalRemaining: result.reduce((sum, b) => sum + b.totalRemaining, 0),
    },
  };
}

// Sales by product view
async function getSalesByProduct(invoices: any[]) {
  const productSales: Record<string, {
    id: string;
    sku: string;
    name: string;
    nameAr: string | null;
    categoryId: string | null;
    quantitySold: number;
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    invoiceCount: number;
    averagePrice: number;
  }> = {};

  for (const inv of invoices) {
    for (const item of inv.items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          id: item.productId,
          sku: item.product.sku,
          name: item.product.name,
          nameAr: item.product.nameAr,
          categoryId: item.product.categoryId,
          quantitySold: 0,
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          invoiceCount: 0,
          averagePrice: 0,
        };
      }
      productSales[item.productId].quantitySold += item.quantity;
      productSales[item.productId].totalRevenue += item.total;
      productSales[item.productId].totalCost += item.quantity * item.product.costPrice;
      productSales[item.productId].invoiceCount++;
    }
  }

  // Calculate derived values
  const result = Object.values(productSales).map(product => ({
    ...product,
    grossProfit: product.totalRevenue - product.totalCost,
    averagePrice: product.quantitySold > 0 ? product.totalRevenue / product.quantitySold : 0,
    profitMargin: product.totalRevenue > 0 ? ((product.totalRevenue - product.totalCost) / product.totalRevenue) * 100 : 0,
  }));

  // Sort by total revenue
  result.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    products: result,
    totals: {
      totalProducts: result.length,
      totalQuantity: result.reduce((sum, p) => sum + p.quantitySold, 0),
      totalRevenue: result.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalCost: result.reduce((sum, p) => sum + p.totalCost, 0),
      totalGrossProfit: result.reduce((sum, p) => sum + p.grossProfit, 0),
    },
  };
}

// Sales by customer view
async function getSalesByCustomer(invoices: any[]) {
  const customerSales: Record<string, {
    id: string;
    code: string;
    name: string;
    nameAr: string | null;
    zoneId: string | null;
    invoiceCount: number;
    totalPurchases: number;
    totalPaid: number;
    totalRemaining: number;
    averagePurchase: number;
    cashPurchases: number;
    installmentPurchases: number;
    lastPurchaseDate: Date | null;
  }> = {};

  for (const inv of invoices) {
    if (!customerSales[inv.customerId]) {
      customerSales[inv.customerId] = {
        id: inv.customerId,
        code: inv.customer.code,
        name: inv.customer.name,
        nameAr: inv.customer.nameAr,
        zoneId: inv.customer.zoneId,
        invoiceCount: 0,
        totalPurchases: 0,
        totalPaid: 0,
        totalRemaining: 0,
        averagePurchase: 0,
        cashPurchases: 0,
        installmentPurchases: 0,
        lastPurchaseDate: null,
      };
    }
    customerSales[inv.customerId].invoiceCount++;
    customerSales[inv.customerId].totalPurchases += inv.total;
    customerSales[inv.customerId].totalPaid += inv.paidAmount;
    customerSales[inv.customerId].totalRemaining += inv.remainingAmount;
    if (inv.type === 'CASH') {
      customerSales[inv.customerId].cashPurchases += inv.total;
    } else {
      customerSales[inv.customerId].installmentPurchases += inv.total;
    }
    if (!customerSales[inv.customerId].lastPurchaseDate || new Date(inv.invoiceDate) > customerSales[inv.customerId].lastPurchaseDate!) {
      customerSales[inv.customerId].lastPurchaseDate = new Date(inv.invoiceDate);
    }
  }

  // Calculate averages
  const result = Object.values(customerSales).map(customer => ({
    ...customer,
    averagePurchase: customer.invoiceCount > 0 ? customer.totalPurchases / customer.invoiceCount : 0,
  }));

  // Sort by total purchases
  result.sort((a, b) => b.totalPurchases - a.totalPurchases);

  return {
    customers: result,
    totals: {
      totalCustomers: result.length,
      totalPurchases: result.reduce((sum, c) => sum + c.totalPurchases, 0),
      totalPaid: result.reduce((sum, c) => sum + c.totalPaid, 0),
      totalRemaining: result.reduce((sum, c) => sum + c.totalRemaining, 0),
    },
  };
}

// Sales by period view
async function getSalesByPeriod(invoices: any[], dateFrom: string | null, dateTo: string | null) {
  const periodSales: Record<string, {
    period: string;
    invoiceCount: number;
    totalSales: number;
    totalPaid: number;
    totalRemaining: number;
    cashSales: number;
    installmentSales: number;
  }> = {};

  for (const inv of invoices) {
    // Group by month
    const date = new Date(inv.invoiceDate);
    const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!periodSales[periodKey]) {
      periodSales[periodKey] = {
        period: periodKey,
        invoiceCount: 0,
        totalSales: 0,
        totalPaid: 0,
        totalRemaining: 0,
        cashSales: 0,
        installmentSales: 0,
      };
    }
    periodSales[periodKey].invoiceCount++;
    periodSales[periodKey].totalSales += inv.total;
    periodSales[periodKey].totalPaid += inv.paidAmount;
    periodSales[periodKey].totalRemaining += inv.remainingAmount;
    if (inv.type === 'CASH') {
      periodSales[periodKey].cashSales += inv.total;
    } else {
      periodSales[periodKey].installmentSales += inv.total;
    }
  }

  // Convert to array and sort by period
  const result = Object.values(periodSales).sort((a, b) => a.period.localeCompare(b.period));

  // Calculate growth rates
  const withGrowth = result.map((period, index) => ({
    ...period,
    growthRate: index > 0 && result[index - 1].totalSales > 0
      ? ((period.totalSales - result[index - 1].totalSales) / result[index - 1].totalSales) * 100
      : 0,
  }));

  return {
    periods: withGrowth,
    totals: {
      totalPeriods: withGrowth.length,
      totalSales: withGrowth.reduce((sum, p) => sum + p.totalSales, 0),
      totalPaid: withGrowth.reduce((sum, p) => sum + p.totalPaid, 0),
      totalRemaining: withGrowth.reduce((sum, p) => sum + p.totalRemaining, 0),
      averageGrowthRate: withGrowth.length > 1
        ? withGrowth.slice(1).reduce((sum, p) => sum + p.growthRate, 0) / (withGrowth.length - 1)
        : 0,
    },
  };
}
