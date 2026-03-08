import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// GET /api/reports/inventory - Inventory report with multiple views
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
    const warehouseId = searchParams.get('warehouseId');
    const categoryId = searchParams.get('categoryId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Report view type
    const view = searchParams.get('view') || 'summary'; // summary, stockLevels, lowStock, movements

    // Determine company filter
    const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId;
    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    let reportData: any = {};

    switch (view) {
      case 'stockLevels':
        reportData = await getStockLevels(targetCompanyId, warehouseId, categoryId);
        break;
      case 'lowStock':
        reportData = await getLowStockAlerts(targetCompanyId, warehouseId);
        break;
      case 'movements':
        reportData = await getMovementHistory(targetCompanyId, warehouseId, dateFrom, dateTo);
        break;
      case 'summary':
      default:
        reportData = await getInventorySummary(targetCompanyId, warehouseId, categoryId);
        break;
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        view,
        companyId: targetCompanyId,
        warehouseId,
        categoryId,
        dateFrom,
        dateTo,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating inventory report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate inventory report' },
      { status: 500 }
    );
  }
}

// Inventory summary view
async function getInventorySummary(companyId: string, warehouseId?: string | null, categoryId?: string | null) {
  // Get warehouses
  const warehouses = await db.warehouse.findMany({
    where: {
      companyId,
      active: true,
      ...(warehouseId ? { id: warehouseId } : {}),
    },
    select: {
      id: true,
      name: true,
      code: true,
      branch: { select: { id: true, name: true } },
    },
  });

  // Get products with inventory
  const productWhere: any = { companyId, active: true };
  if (categoryId) productWhere.categoryId = categoryId;

  const products = await db.product.findMany({
    where: productWhere,
    include: {
      category: { select: { id: true, name: true, code: true } },
      inventory: {
        include: {
          warehouse: { select: { id: true, name: true } },
        },
        ...(warehouseId ? { where: { warehouseId } } : {}),
      },
    },
  });

  // Calculate summary
  const summary = {
    totalProducts: products.length,
    totalSKUs: products.length,
    totalQuantity: 0,
    totalValue: 0,
    totalCostValue: 0,
    totalRetailValue: 0,
    warehouses: {} as Record<string, { name: string; quantity: number; value: number }>,
    categories: {} as Record<string, { name: string; count: number; quantity: number; value: number }>,
    byStatus: {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      overStocked: 0,
    },
  };

  for (const product of products) {
    const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalMinQuantity = product.inventory.reduce((sum, inv) => sum + inv.minQuantity, 0);
    const totalMaxQuantity = product.inventory.reduce((sum, inv) => sum + (inv.maxQuantity || 0), 0);

    summary.totalQuantity += totalQuantity;
    summary.totalCostValue += totalQuantity * product.costPrice;
    summary.totalRetailValue += totalQuantity * product.sellPrice;

    // By status
    if (totalQuantity === 0) {
      summary.byStatus.outOfStock++;
    } else if (totalQuantity <= totalMinQuantity) {
      summary.byStatus.lowStock++;
    } else if (totalMaxQuantity > 0 && totalQuantity >= totalMaxQuantity) {
      summary.byStatus.overStocked++;
    } else {
      summary.byStatus.inStock++;
    }

    // By warehouse
    for (const inv of product.inventory) {
      if (!summary.warehouses[inv.warehouseId]) {
        summary.warehouses[inv.warehouseId] = {
          name: inv.warehouse.name,
          quantity: 0,
          value: 0,
        };
      }
      summary.warehouses[inv.warehouseId].quantity += inv.quantity;
      summary.warehouses[inv.warehouseId].value += inv.quantity * product.costPrice;
    }

    // By category
    const catId = product.categoryId || 'uncategorized';
    const catName = product.category?.name || 'Uncategorized';
    if (!summary.categories[catId]) {
      summary.categories[catId] = { name: catName, count: 0, quantity: 0, value: 0 };
    }
    summary.categories[catId].count++;
    summary.categories[catId].quantity += totalQuantity;
    summary.categories[catId].value += totalQuantity * product.costPrice;
  }

  summary.totalValue = summary.totalCostValue;

  return {
    summary,
    warehouses,
    topProducts: products
      .map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        totalQuantity: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        totalValue: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0) * p.costPrice,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10),
  };
}

// Stock levels view
async function getStockLevels(companyId: string, warehouseId?: string | null, categoryId?: string | null) {
  // Build product where clause
  const productWhere: any = { companyId, active: true };
  if (categoryId) productWhere.categoryId = categoryId;

  // Get products with inventory
  const products = await db.product.findMany({
    where: productWhere,
    include: {
      category: { select: { id: true, name: true, code: true } },
      inventory: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              branch: { select: { id: true, name: true } },
            },
          },
        },
        ...(warehouseId ? { where: { warehouseId } } : {}),
      },
    },
    orderBy: { name: 'asc' },
  });

  // Process stock levels
  const stockLevels = products.map(product => {
    const inventoryRecords = product.inventory;
    const totalQuantity = inventoryRecords.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalMinQuantity = inventoryRecords.reduce((sum, inv) => sum + inv.minQuantity, 0);
    const totalMaxQuantity = inventoryRecords.reduce((sum, inv) => sum + (inv.maxQuantity || 0), 0);

    // Determine stock status
    let status = 'in_stock';
    if (totalQuantity === 0) {
      status = 'out_of_stock';
    } else if (totalQuantity <= totalMinQuantity) {
      status = 'low_stock';
    } else if (totalMaxQuantity > 0 && totalQuantity >= totalMaxQuantity) {
      status = 'over_stocked';
    }

    // Calculate turnover (mock - would need historical data)
    const turnoverRate = 0; // Placeholder

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      nameAr: product.nameAr,
      unit: product.unit,
      category: product.category,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      barcode: product.barcode,
      totalQuantity,
      totalMinQuantity,
      totalMaxQuantity,
      totalValue: totalQuantity * product.costPrice,
      totalRetailValue: totalQuantity * product.sellPrice,
      status,
      turnoverRate,
      inventory: inventoryRecords.map(inv => ({
        warehouseId: inv.warehouseId,
        warehouse: inv.warehouse,
        quantity: inv.quantity,
        minQuantity: inv.minQuantity,
        maxQuantity: inv.maxQuantity,
        value: inv.quantity * product.costPrice,
      })),
    };
  });

  // Calculate aggregates
  const aggregates = {
    totalProducts: stockLevels.length,
    totalQuantity: stockLevels.reduce((sum, p) => sum + p.totalQuantity, 0),
    totalValue: stockLevels.reduce((sum, p) => sum + p.totalValue, 0),
    totalRetailValue: stockLevels.reduce((sum, p) => sum + p.totalRetailValue, 0),
    potentialProfit: stockLevels.reduce((sum, p) => sum + (p.totalRetailValue - p.totalValue), 0),
    byStatus: {
      inStock: stockLevels.filter(p => p.status === 'in_stock').length,
      lowStock: stockLevels.filter(p => p.status === 'low_stock').length,
      outOfStock: stockLevels.filter(p => p.status === 'out_of_stock').length,
      overStocked: stockLevels.filter(p => p.status === 'over_stocked').length,
    },
  };

  return {
    stockLevels,
    aggregates,
  };
}

// Low stock alerts view
async function getLowStockAlerts(companyId: string, warehouseId?: string | null) {
  // Get inventory with low stock
  const inventoryWhere: any = {
    warehouse: { companyId },
    quantity: { lte: db.raw('minQuantity') }, // SQLite raw comparison
  };
  if (warehouseId) inventoryWhere.warehouseId = warehouseId;

  // Get all inventory records
  const allInventory = await db.inventory.findMany({
    where: {
      warehouse: { companyId },
      ...(warehouseId ? { warehouseId } : {}),
    },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true } },
        },
      },
      warehouse: {
        select: {
          id: true,
          name: true,
          code: true,
          branch: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Filter for low stock
  const lowStockItems = allInventory.filter(inv => inv.quantity <= inv.minQuantity);

  // Process alerts
  const alerts = lowStockItems.map(inv => {
    const shortage = inv.minQuantity - inv.quantity;
    const shortagePercentage = inv.minQuantity > 0 ? (shortage / inv.minQuantity) * 100 : 100;
    
    let severity = 'warning';
    if (inv.quantity === 0) {
      severity = 'critical';
    } else if (shortagePercentage > 50) {
      severity = 'high';
    }

    // Calculate days until out of stock (mock - would need sales velocity)
    const daysUntilOutOfStock = inv.quantity > 0 ? Math.ceil(inv.quantity / 2) : 0; // Placeholder

    return {
      id: inv.id,
      productId: inv.productId,
      product: {
        sku: inv.product.sku,
        name: inv.product.name,
        nameAr: inv.product.nameAr,
        unit: inv.product.unit,
        category: inv.product.category,
        costPrice: inv.product.costPrice,
        sellPrice: inv.product.sellPrice,
      },
      warehouse: inv.warehouse,
      currentQuantity: inv.quantity,
      minQuantity: inv.minQuantity,
      maxQuantity: inv.maxQuantity,
      shortage,
      shortagePercentage,
      severity,
      daysUntilOutOfStock,
      recommendedOrder: Math.max(shortage, inv.maxQuantity ? inv.maxQuantity - inv.quantity : shortage * 2),
      estimatedOrderValue: Math.max(shortage, inv.maxQuantity ? inv.maxQuantity - inv.quantity : shortage * 2) * inv.product.costPrice,
    };
  });

  // Sort by severity and shortage
  const severityOrder = { critical: 0, high: 1, warning: 2 };
  alerts.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.shortagePercentage - a.shortagePercentage;
  });

  // Calculate summary
  const summary = {
    totalAlerts: alerts.length,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    highCount: alerts.filter(a => a.severity === 'high').length,
    warningCount: alerts.filter(a => a.severity === 'warning').length,
    totalShortage: alerts.reduce((sum, a) => sum + a.shortage, 0),
    totalOrderValue: alerts.reduce((sum, a) => sum + a.estimatedOrderValue, 0),
    byWarehouse: {} as Record<string, { name: string; count: number; shortage: number }>,
    byCategory: {} as Record<string, { name: string; count: number; shortage: number }>,
  };

  // By warehouse
  for (const alert of alerts) {
    const whId = alert.warehouse.id;
    if (!summary.byWarehouse[whId]) {
      summary.byWarehouse[whId] = { name: alert.warehouse.name, count: 0, shortage: 0 };
    }
    summary.byWarehouse[whId].count++;
    summary.byWarehouse[whId].shortage += alert.shortage;
  }

  // By category
  for (const alert of alerts) {
    const catId = alert.product.category?.id || 'uncategorized';
    const catName = alert.product.category?.name || 'Uncategorized';
    if (!summary.byCategory[catId]) {
      summary.byCategory[catId] = { name: catName, count: 0, shortage: 0 };
    }
    summary.byCategory[catId].count++;
    summary.byCategory[catId].shortage += alert.shortage;
  }

  return {
    alerts,
    summary,
  };
}

// Movement history view
async function getMovementHistory(companyId: string, warehouseId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  // Build where clause
  const movementWhere: any = {
    warehouse: { companyId },
  };

  if (warehouseId) movementWhere.warehouseId = warehouseId;

  if (dateFrom || dateTo) {
    movementWhere.createdAt = {};
    if (dateFrom) movementWhere.createdAt.gte = new Date(dateFrom);
    if (dateTo) movementWhere.createdAt.lte = new Date(dateTo);
  }

  // Get movements
  const movements = await db.inventoryMovement.findMany({
    where: movementWhere,
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true } },
        },
      },
      warehouse: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500, // Limit to 500 records
  });

  // Calculate summary
  const summary = {
    totalMovements: movements.length,
    byType: {
      IN: { count: 0, quantity: 0 },
      OUT: { count: 0, quantity: 0 },
      TRANSFER: { count: 0, quantity: 0 },
      RETURN: { count: 0, quantity: 0 },
      ADJUSTMENT: { count: 0, quantity: 0 },
    },
    byReferenceType: {} as Record<string, { count: number; quantity: number }>,
    byWarehouse: {} as Record<string, { name: string; count: number; inQty: number; outQty: number }>,
    netMovement: 0,
    dailyTrend: [] as { date: string; inQty: number; outQty: number; netQty: number }[],
  };

  // Daily trend
  const dailyMovements: Record<string, { date: string; inQty: number; outQty: number; netQty: number }> = {};

  for (const movement of movements) {
    // By type
    if (summary.byType[movement.type as keyof typeof summary.byType]) {
      summary.byType[movement.type as keyof typeof summary.byType].count++;
      summary.byType[movement.type as keyof typeof summary.byType].quantity += Math.abs(movement.quantity);
    }

    // By reference type
    if (movement.referenceType) {
      if (!summary.byReferenceType[movement.referenceType]) {
        summary.byReferenceType[movement.referenceType] = { count: 0, quantity: 0 };
      }
      summary.byReferenceType[movement.referenceType].count++;
      summary.byReferenceType[movement.referenceType].quantity += Math.abs(movement.quantity);
    }

    // By warehouse
    if (!summary.byWarehouse[movement.warehouseId]) {
      summary.byWarehouse[movement.warehouseId] = {
        name: movement.warehouse.name,
        count: 0,
        inQty: 0,
        outQty: 0,
      };
    }
    summary.byWarehouse[movement.warehouseId].count++;
    if (['IN', 'RETURN'].includes(movement.type)) {
      summary.byWarehouse[movement.warehouseId].inQty += movement.quantity;
    } else {
      summary.byWarehouse[movement.warehouseId].outQty += Math.abs(movement.quantity);
    }

    // Net movement
    if (['IN', 'RETURN'].includes(movement.type)) {
      summary.netMovement += movement.quantity;
    } else {
      summary.netMovement -= movement.quantity;
    }

    // Daily trend
    const dateKey = new Date(movement.createdAt).toISOString().split('T')[0];
    if (!dailyMovements[dateKey]) {
      dailyMovements[dateKey] = { date: dateKey, inQty: 0, outQty: 0, netQty: 0 };
    }
    if (['IN', 'RETURN'].includes(movement.type)) {
      dailyMovements[dateKey].inQty += movement.quantity;
      dailyMovements[dateKey].netQty += movement.quantity;
    } else {
      dailyMovements[dateKey].outQty += Math.abs(movement.quantity);
      dailyMovements[dateKey].netQty -= movement.quantity;
    }
  }

  summary.dailyTrend = Object.values(dailyMovements).sort((a, b) => a.date.localeCompare(b.date));

  // Format movements for response
  const formattedMovements = movements.map(movement => ({
    id: movement.id,
    product: {
      id: movement.productId,
      sku: movement.product.sku,
      name: movement.product.name,
      nameAr: movement.product.nameAr,
      unit: movement.product.unit,
      category: movement.product.category,
    },
    warehouse: movement.warehouse,
    type: movement.type,
    quantity: movement.quantity,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    notes: movement.notes,
    createdBy: movement.createdBy,
    createdAt: movement.createdAt,
  }));

  // Top moved products
  const productMovements: Record<string, { id: string; sku: string; name: string; count: number; totalQty: number }> = {};
  for (const movement of movements) {
    if (!productMovements[movement.productId]) {
      productMovements[movement.productId] = {
        id: movement.productId,
        sku: movement.product.sku,
        name: movement.product.name,
        count: 0,
        totalQty: 0,
      };
    }
    productMovements[movement.productId].count++;
    productMovements[movement.productId].totalQty += Math.abs(movement.quantity);
  }

  const topProducts = Object.values(productMovements)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    movements: formattedMovements,
    summary,
    topProducts,
  };
}
