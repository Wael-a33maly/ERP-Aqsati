import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

interface GenerateReportBody {
  templateId?: string;
  companyId?: string;
  branchId?: string;
  name?: string;
  type: 'SALES' | 'COLLECTION' | 'INVENTORY' | 'COMMISSION' | 'FINANCIAL';
  parameters?: {
    dateFrom?: string;
    dateTo?: string;
    customerIds?: string[];
    agentIds?: string[];
    zoneIds?: string[];
    branchIds?: string[];
    productIds?: string[];
    categoryIds?: string[];
    status?: string[];
    [key: string]: unknown;
  };
  format?: 'PDF' | 'EXCEL' | 'HTML' | 'JSON';
}

// GET /api/reports/generate - Get generated reports history
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
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const generatedBy = searchParams.get('generatedBy');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Apply company filter
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.companyId) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      where.companyId = user.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (type) where.type = type;
    if (generatedBy) where.generatedBy = generatedBy;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [reports, total] = await Promise.all([
      db.generatedReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.generatedReport.count({ where }),
    ]);

    // Parse JSON fields
    const parsedReports = reports.map(report => ({
      ...report,
      parameters: report.parameters ? JSON.parse(report.parameters) : null,
      data: report.data ? JSON.parse(report.data) : null,
    }));

    return NextResponse.json({
      success: true,
      data: parsedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching generated reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch generated reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports/generate - Generate a new report
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body: GenerateReportBody = await request.json();
    const {
      templateId,
      companyId,
      branchId,
      name,
      type,
      parameters = {},
      format = 'JSON'
    } = body;

    if (!type) {
      return NextResponse.json({ success: false, error: 'Report type is required' }, { status: 400 });
    }

    // Determine company
    const targetCompanyId = user.role === 'SUPER_ADMIN' ? (companyId || parameters.branchIds?.[0]) : user.companyId;
    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    // Get template if specified
    let template = null;
    if (templateId) {
      template = await db.reportTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
    }

    // Generate report data based on type
    let reportData: any = {};

    switch (type) {
      case 'SALES':
        reportData = await generateSalesReport(targetCompanyId, branchId, parameters);
        break;
      case 'COLLECTION':
        reportData = await generateCollectionReport(targetCompanyId, branchId, parameters);
        break;
      case 'INVENTORY':
        reportData = await generateInventoryReport(targetCompanyId, parameters);
        break;
      case 'COMMISSION':
        reportData = await generateCommissionReport(targetCompanyId, parameters);
        break;
      case 'FINANCIAL':
        reportData = await generateFinancialReport(targetCompanyId, branchId, parameters);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid report type' }, { status: 400 });
    }

    // Generate report name if not provided
    const reportName = name || `${type} Report - ${new Date().toLocaleDateString()}`;

    // Save generated report
    const generatedReport = await db.generatedReport.create({
      data: {
        templateId: template?.id || null,
        companyId: targetCompanyId,
        generatedBy: user.id,
        name: reportName,
        type,
        parameters: JSON.stringify(parameters),
        format,
        data: JSON.stringify(reportData),
        status: 'completed',
      },
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: targetCompanyId,
        branchId: branchId || null,
        userId: user.id,
        action: 'CREATE',
        entityType: 'GeneratedReport',
        entityId: generatedReport.id,
        newData: JSON.stringify({ type, parameters, name: reportName }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...generatedReport,
        parameters: JSON.parse(generatedReport.parameters),
        data: JSON.parse(generatedReport.data),
      },
      message: 'Report generated successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Helper function to generate sales report data
async function generateSalesReport(companyId: string, branchId?: string, parameters?: any) {
  const { dateFrom, dateTo, customerIds, agentIds, branchIds, productIds, status } = parameters || {};

  // Build where clause
  const where: any = { companyId };

  if (branchId) where.branchId = branchId;
  if (branchIds && branchIds.length > 0) where.branchId = { in: branchIds };
  if (customerIds && customerIds.length > 0) where.customerId = { in: customerIds };
  if (agentIds && agentIds.length > 0) where.agentId = { in: agentIds };
  if (status && status.length > 0) where.status = { in: status };

  if (dateFrom || dateTo) {
    where.invoiceDate = {};
    if (dateFrom) where.invoiceDate.gte = new Date(dateFrom);
    if (dateTo) where.invoiceDate.lte = new Date(dateTo);
  }

  // Get invoices
  const invoices = await db.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, code: true, name: true, nameAr: true } },
      agent: { select: { id: true, name: true, nameAr: true } },
      branch: { select: { id: true, name: true, code: true } },
      items: {
        include: {
          product: { select: { id: true, sku: true, name: true } },
        },
      },
    },
    orderBy: { invoiceDate: 'desc' },
  });

  // Calculate summaries
  const summary = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    totalRemaining: invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
    totalTax: invoices.reduce((sum, inv) => sum + inv.taxAmount, 0),
    byStatus: {} as Record<string, number>,
    byType: { CASH: 0, INSTALLMENT: 0 },
    byBranch: {} as Record<string, { name: string; count: number; total: number }>,
    byAgent: {} as Record<string, { name: string; count: number; total: number }>,
    byProduct: {} as Record<string, { name: string; quantity: number; total: number }>,
  };

  // Calculate by status
  for (const inv of invoices) {
    summary.byStatus[inv.status] = (summary.byStatus[inv.status] || 0) + 1;
    summary.byType[inv.type] = (summary.byType[inv.type] || 0) + 1;

    // By branch
    if (inv.branch) {
      if (!summary.byBranch[inv.branch.id]) {
        summary.byBranch[inv.branch.id] = { name: inv.branch.name, count: 0, total: 0 };
      }
      summary.byBranch[inv.branch.id].count++;
      summary.byBranch[inv.branch.id].total += inv.total;
    }

    // By agent
    if (inv.agent) {
      if (!summary.byAgent[inv.agent.id]) {
        summary.byAgent[inv.agent.id] = { name: inv.agent.name, count: 0, total: 0 };
      }
      summary.byAgent[inv.agent.id].count++;
      summary.byAgent[inv.agent.id].total += inv.total;
    }

    // By product
    for (const item of inv.items) {
      if (productIds && productIds.length > 0 && !productIds.includes(item.productId)) continue;
      if (!summary.byProduct[item.productId]) {
        summary.byProduct[item.productId] = { name: item.product.name, quantity: 0, total: 0 };
      }
      summary.byProduct[item.productId].quantity += item.quantity;
      summary.byProduct[item.productId].total += item.total;
    }
  }

  return {
    invoices,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate collection report data
async function generateCollectionReport(companyId: string, branchId?: string, parameters?: any) {
  const { dateFrom, dateTo, customerIds, agentIds, branchIds } = parameters || {};

  // Build payment where clause
  const paymentWhere: any = { companyId };

  if (branchId) paymentWhere.branchId = branchId;
  if (branchIds && branchIds.length > 0) paymentWhere.branchId = { in: branchIds };
  if (customerIds && customerIds.length > 0) paymentWhere.customerId = { in: customerIds };
  if (agentIds && agentIds.length > 0) paymentWhere.agentId = { in: agentIds };

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
      invoice: { select: { id: true, invoiceNumber: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });

  // Get overdue installments
  const overdueWhere: any = {
    status: { in: ['pending', 'partial', 'overdue'] },
    dueDate: { lt: new Date() },
    contract: { invoice: { companyId } },
  };

  if (branchId) overdueWhere.contract.invoice = { branchId };
  if (branchIds && branchIds.length > 0) overdueWhere.contract.invoice = { branchId: { in: branchIds } };
  if (customerIds && customerIds.length > 0) overdueWhere.contract.customerId = { in: customerIds };

  const overdueInstallments = await db.installment.findMany({
    where: overdueWhere,
    include: {
      contract: {
        include: {
          customer: { select: { id: true, code: true, name: true, nameAr: true, phone: true } },
          invoice: { select: { invoiceNumber: true, branch: { select: { name: true } } } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Calculate summaries
  const summary = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    byMethod: {} as Record<string, number>,
    byAgent: {} as Record<string, { name: string; count: number; total: number }>,
    totalOverdue: overdueInstallments.length,
    totalOverdueAmount: overdueInstallments.reduce((sum, i) => sum + i.remainingAmount, 0),
    overdueByCustomer: {} as Record<string, { name: string; phone: string; count: number; total: number }>,
  };

  // Calculate by method
  for (const p of payments) {
    summary.byMethod[p.method] = (summary.byMethod[p.method] || 0) + p.amount;
    if (p.agent) {
      if (!summary.byAgent[p.agent.id]) {
        summary.byAgent[p.agent.id] = { name: p.agent.name, count: 0, total: 0 };
      }
      summary.byAgent[p.agent.id].count++;
      summary.byAgent[p.agent.id].total += p.amount;
    }
  }

  // Calculate overdue by customer
  for (const installment of overdueInstallments) {
    const customerId = installment.contract.customerId;
    const customer = installment.contract.customer;
    if (!summary.overdueByCustomer[customerId]) {
      summary.overdueByCustomer[customerId] = { name: customer.name, phone: customer.phone || '', count: 0, total: 0 };
    }
    summary.overdueByCustomer[customerId].count++;
    summary.overdueByCustomer[customerId].total += installment.remainingAmount;
  }

  return {
    payments,
    overdueInstallments,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate inventory report data
async function generateInventoryReport(companyId: string, parameters?: any) {
  const { warehouseId, productIds, categoryIds, lowStockOnly } = parameters || {};

  // Build where clause for products
  const productWhere: any = { companyId, active: true };
  if (categoryIds && categoryIds.length > 0) productWhere.categoryId = { in: categoryIds };

  // Get products with inventory
  const products = await db.product.findMany({
    where: productWhere,
    include: {
      category: { select: { id: true, name: true, code: true } },
      inventory: {
        include: {
          warehouse: { select: { id: true, name: true, code: true, branchId: true } },
        },
        ...(warehouseId ? { where: { warehouseId } } : {}),
      },
    },
  });

  // Get inventory movements
  const movementWhere: any = {
    warehouse: { companyId },
  };
  if (warehouseId) movementWhere.warehouseId = warehouseId;

  const movements = await db.inventoryMovement.findMany({
    where: movementWhere,
    include: {
      product: { select: { id: true, sku: true, name: true } },
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit movements for report
  });

  // Process inventory data
  let inventoryData = products.map(product => {
    const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalMinQuantity = product.inventory.reduce((sum, inv) => sum + inv.minQuantity, 0);
    const isLowStock = totalQuantity <= totalMinQuantity;

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      nameAr: product.nameAr,
      unit: product.unit,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      category: product.category,
      totalQuantity,
      totalMinQuantity,
      isLowStock,
      inventory: product.inventory,
      inventoryValue: totalQuantity * product.costPrice,
    };
  });

  // Filter by product IDs if provided
  if (productIds && productIds.length > 0) {
    inventoryData = inventoryData.filter(p => productIds.includes(p.id));
  }

  // Filter low stock only
  if (lowStockOnly === true || lowStockOnly === 'true') {
    inventoryData = inventoryData.filter(p => p.isLowStock);
  }

  // Calculate summaries
  const summary = {
    totalProducts: inventoryData.length,
    totalQuantity: inventoryData.reduce((sum, p) => sum + p.totalQuantity, 0),
    totalValue: inventoryData.reduce((sum, p) => sum + p.inventoryValue, 0),
    lowStockCount: inventoryData.filter(p => p.isLowStock).length,
    outOfStockCount: inventoryData.filter(p => p.totalQuantity === 0).length,
    byCategory: {} as Record<string, { name: string; count: number; quantity: number; value: number }>,
  };

  // Calculate by category
  for (const p of inventoryData) {
    const categoryId = p.category?.id || 'uncategorized';
    const categoryName = p.category?.name || 'Uncategorized';
    if (!summary.byCategory[categoryId]) {
      summary.byCategory[categoryId] = { name: categoryName, count: 0, quantity: 0, value: 0 };
    }
    summary.byCategory[categoryId].count++;
    summary.byCategory[categoryId].quantity += p.totalQuantity;
    summary.byCategory[categoryId].value += p.inventoryValue;
  }

  return {
    inventory: inventoryData,
    movements,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate commission report data
async function generateCommissionReport(companyId: string, parameters?: any) {
  const { dateFrom, dateTo, agentIds, status } = parameters || {};

  // Build where clause
  const where: any = {
    agent: { companyId },
  };

  if (agentIds && agentIds.length > 0) where.agentId = { in: agentIds };
  if (status && status.length > 0) where.status = { in: status };

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  // Get commissions
  const commissions = await db.agentCommission.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true, nameAr: true, email: true } },
      policy: { select: { id: true, name: true, type: true, calculationType: true, value: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate summaries
  const summary = {
    totalCommissions: commissions.length,
    totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
    pendingAmount: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
    paidAmount: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
    cancelledAmount: commissions.filter(c => c.status === 'cancelled').reduce((sum, c) => sum + c.amount, 0),
    byStatus: {} as Record<string, number>,
    byType: { SALES: 0, COLLECTION: 0 },
    byAgent: {} as Record<string, { name: string; count: number; total: number; pending: number; paid: number }>,
  };

  // Calculate summaries
  for (const c of commissions) {
    summary.byStatus[c.status] = (summary.byStatus[c.status] || 0) + 1;
    summary.byType[c.type] = (summary.byType[c.type] || 0) + c.amount;

    if (!summary.byAgent[c.agentId]) {
      summary.byAgent[c.agentId] = {
        name: c.agent.name,
        count: 0,
        total: 0,
        pending: 0,
        paid: 0,
      };
    }
    summary.byAgent[c.agentId].count++;
    summary.byAgent[c.agentId].total += c.amount;
    if (c.status === 'pending') summary.byAgent[c.agentId].pending += c.amount;
    if (c.status === 'paid') summary.byAgent[c.agentId].paid += c.amount;
  }

  return {
    commissions,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate financial report data
async function generateFinancialReport(companyId: string, branchId?: string, parameters?: any) {
  const { dateFrom, dateTo, branchIds } = parameters || {};

  // Build common where clause
  const baseWhere: any = { companyId };
  if (branchId) baseWhere.branchId = branchId;
  if (branchIds && branchIds.length > 0) baseWhere.branchId = { in: branchIds };

  // Date filter
  const dateFilter: any = {};
  if (dateFrom || dateTo) {
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
  }

  // Get sales data
  const salesWhere = { ...baseWhere };
  if (Object.keys(dateFilter).length > 0) salesWhere.invoiceDate = dateFilter;

  const salesData = await db.invoice.aggregate({
    where: salesWhere,
    _sum: {
      subtotal: true,
      taxAmount: true,
      total: true,
      paidAmount: true,
      remainingAmount: true,
    },
    _count: { id: true },
  });

  // Get payments data
  const paymentsWhere = { ...baseWhere };
  if (Object.keys(dateFilter).length > 0) paymentsWhere.paymentDate = dateFilter;

  const paymentsData = await db.payment.aggregate({
    where: paymentsWhere,
    _sum: { amount: true },
    _count: { id: true },
  });

  // Get returns data
  const returnsWhere = { ...baseWhere, status: 'approved' };
  if (Object.keys(dateFilter).length > 0) returnsWhere.returnDate = dateFilter;

  const returnsData = await db.return.aggregate({
    where: returnsWhere,
    _sum: { total: true },
    _count: { id: true },
  });

  // Get inventory value
  const inventoryData = await db.inventory.findMany({
    where: {
      warehouse: { companyId },
    },
    include: {
      product: { select: { costPrice: true } },
    },
  });

  const totalInventoryValue = inventoryData.reduce((sum, inv) => sum + (inv.quantity * inv.product.costPrice), 0);

  // Get customer balances
  const customerBalances = await db.customer.aggregate({
    where: { companyId },
    _sum: { balance: true, creditLimit: true },
  });

  // Get installment data
  const installmentContracts = await db.installmentContract.findMany({
    where: {
      invoice: baseWhere,
      status: 'active',
    },
    _sum: {
      financedAmount: true,
      interestAmount: true,
    },
    _count: { id: true },
  });

  const summary = {
    sales: {
      count: salesData._count.id,
      subtotal: salesData._sum.subtotal || 0,
      tax: salesData._sum.taxAmount || 0,
      total: salesData._sum.total || 0,
      paid: salesData._sum.paidAmount || 0,
      remaining: salesData._sum.remainingAmount || 0,
    },
    payments: {
      count: paymentsData._count.id,
      total: paymentsData._sum.amount || 0,
    },
    returns: {
      count: returnsData._count.id,
      total: returnsData._sum.total || 0,
    },
    inventory: {
      totalValue: totalInventoryValue,
    },
    customers: {
      totalBalance: customerBalances._sum.balance || 0,
      totalCreditLimit: customerBalances._sum.creditLimit || 0,
    },
    installments: {
      activeContracts: installmentContracts.length,
      financedAmount: installmentContracts.reduce((sum, c) => sum + (c._sum.financedAmount || 0), 0),
      interestAmount: installmentContracts.reduce((sum, c) => sum + (c._sum.interestAmount || 0), 0),
    },
    netRevenue: (salesData._sum.total || 0) - (returnsData._sum.total || 0),
    grossProfit: (salesData._sum.subtotal || 0) - totalInventoryValue * 0.7, // Estimate
  };

  return {
    summary,
    period: {
      from: dateFrom || null,
      to: dateTo || null,
    },
    generatedAt: new Date().toISOString(),
  };
}
