import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - تقرير أرصدة المخازن
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId') || ''
    const warehouseId = searchParams.get('warehouseId') || ''
    const productId = searchParams.get('productId') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const minQuantity = searchParams.get('minQuantity')
    const maxQuantity = searchParams.get('maxQuantity')
    const showZeroStock = searchParams.get('showZeroStock') === 'true'

    // بناء شروط البحث
    const inventoryWhere: any = {}
    
    if (warehouseId) {
      inventoryWhere.warehouseId = warehouseId
    }
    
    if (!showZeroStock) {
      inventoryWhere.quantity = { gt: 0 }
    }

    if (minQuantity !== null && minQuantity !== undefined) {
      inventoryWhere.quantity = { ...inventoryWhere.quantity, gte: parseFloat(minQuantity) }
    }

    if (maxQuantity !== null && maxQuantity !== undefined) {
      inventoryWhere.quantity = { ...inventoryWhere.quantity, lte: parseFloat(maxQuantity) }
    }

    const productWhere: any = {}
    if (companyId) productWhere.companyId = companyId
    if (categoryId) productWhere.categoryId = categoryId
    if (productId) productWhere.id = productId

    // جلب المنتجات مع أرصدتها
    const products = await db.product.findMany({
      where: productWhere,
      include: {
        ProductCategory: { select: { id: true, name: true, nameAr: true } },
        Supplier: { select: { id: true, name: true, supplierCode: true } },
        Inventory: {
          where: inventoryWhere,
          include: {
            Warehouse: { select: { id: true, name: true, nameAr: true, branchId: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // تجهيز التقرير
    const report = products.map(product => {
      const inventories = product.Inventory.map(inv => ({
        warehouseId: inv.warehouseId,
        warehouseName: inv.Warehouse.name,
        warehouseNameAr: inv.Warehouse.nameAr,
        quantity: inv.quantity,
        reservedQuantity: inv.reservedQuantity,
        availableQuantity: inv.quantity - inv.reservedQuantity,
        avgCost: inv.avgCost,
        totalCost: inv.totalCost,
        minQuantity: inv.minQuantity,
        maxQuantity: inv.maxQuantity,
        lastPurchaseDate: inv.lastPurchaseDate,
        lastPurchaseCost: inv.lastPurchaseCost,
        isLowStock: inv.quantity <= inv.minQuantity
      }))

      const totalQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0)
      const totalValue = inventories.reduce((sum, inv) => sum + inv.totalCost, 0)
      const avgUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0

      return {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        productNameAr: product.nameAr,
        unit: product.unit,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        category: product.ProductCategory,
        supplier: product.Supplier,
        inventories,
        totalQuantity,
        totalValue,
        avgUnitCost
      }
    })

    // حساب الإجماليات
    const summary = {
      totalProducts: report.length,
      totalQuantity: report.reduce((sum, p) => sum + p.totalQuantity, 0),
      totalValue: report.reduce((sum, p) => sum + p.totalValue, 0),
      lowStockCount: report.filter(p => p.inventories.some(inv => inv.isLowStock)).length,
      zeroStockCount: report.filter(p => p.totalQuantity === 0).length
    }

    return NextResponse.json({
      success: true,
      data: report,
      summary
    })
  } catch (error) {
    console.error('Error generating inventory report:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء تقرير المخزون' },
      { status: 500 }
    )
  }
}
