import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - جلب جميع مرتجعات المشتريات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''
    const status = searchParams.get('status') || ''
    const supplierId = searchParams.get('supplierId') || ''

    const skip = (page - 1) * limit

    const where: Prisma.PurchaseReturnWhereInput = {}
    
    if (companyId) where.companyId = companyId
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    
    if (search) {
      where.OR = [
        { returnNumber: { contains: search } },
        { Supplier: { name: { contains: search } } }
      ]
    }

    const [returns, total] = await Promise.all([
      db.purchaseReturn.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Supplier: { select: { id: true, name: true, supplierCode: true } },
          Branch: { select: { id: true, name: true } },
          Warehouse: { select: { id: true, name: true } },
          PurchaseInvoice: { select: { id: true, invoiceNumber: true } },
          _count: { select: { PurchaseReturnItem: true } }
        }
      }),
      db.purchaseReturn.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching purchase returns:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب مرتجعات المشتريات' },
      { status: 500 }
    )
  }
}

// POST - إنشاء مرتجع مشتريات جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.companyId || !data.warehouseId || !data.supplierId || !data.items?.length) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    // توليد رقم المرتجع
    const year = new Date().getFullYear()
    const prefix = `PR-${year}-`
    
    const lastReturn = await db.purchaseReturn.findFirst({
      where: {
        companyId: data.companyId,
        returnNumber: { startsWith: prefix }
      },
      orderBy: { returnNumber: 'desc' }
    })

    let sequence = 1
    if (lastReturn) {
      const parts = lastReturn.returnNumber.split('-')
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1
      }
    }

    const returnNumber = `${prefix}${String(sequence).padStart(6, '0')}`

    // حساب الإجماليات
    let subtotal = 0
    let totalTax = 0
    
    const itemsData = data.items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice
      const itemTax = itemTotal * ((item.taxRate || 0) / 100)
      subtotal += itemTotal
      totalTax += itemTax
      
      return {
        purchaseInvoiceItemId: item.purchaseInvoiceItemId,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: itemTax,
        total: itemTotal + itemTax,
        restocked: false
      }
    })

    const total = subtotal + totalTax

    const purchaseReturn = await db.$transaction(async (tx) => {
      const newReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          companyId: data.companyId,
          branchId: data.branchId,
          warehouseId: data.warehouseId,
          supplierId: data.supplierId,
          purchaseInvoiceId: data.purchaseInvoiceId,
          returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
          status: data.status || 'draft',
          reason: data.reason,
          subtotal,
          taxAmount: totalTax,
          total,
          notes: data.notes,
          createdBy: data.createdBy
        }
      })

      for (const item of itemsData) {
        await tx.purchaseReturnItem.create({
          data: {
            purchaseReturnId: newReturn.id,
            ...item
          }
        })
      }

      // إذا كان المرتجع معتمد
      if (data.status === 'approved') {
        await processReturnApproval(tx, newReturn, itemsData, data)
      }

      return newReturn
    })

    return NextResponse.json({ success: true, data: purchaseReturn })
  } catch (error) {
    console.error('Error creating purchase return:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء مرتجع المشتريات' },
      { status: 500 }
    )
  }
}

// دالة معالجة اعتماد المرتجع
async function processReturnApproval(
  tx: Prisma.TransactionClient,
  returnData: any,
  items: any[],
  data: any
) {
  for (const item of items) {
    // تحديث المخزون (خصم الكمية المرتجعة)
    const inventory = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId: returnData.warehouseId
        }
      }
    })

    if (inventory) {
      const newQuantity = Math.max(0, inventory.quantity - item.quantity)
      const costOfReturned = item.quantity * inventory.avgCost
      const newTotalCost = Math.max(0, inventory.totalCost - costOfReturned)
      const newAvgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity,
          totalCost: newTotalCost,
          avgCost: newAvgCost
        }
      })

      // حركة مخزون
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: returnData.warehouseId,
          type: 'OUT',
          quantity: item.quantity,
          unitCost: inventory.avgCost,
          totalCost: item.quantity * inventory.avgCost,
          referenceType: 'PURCHASE_RETURN',
          referenceId: returnData.id,
          notes: `مرتجع مشتريات رقم ${returnData.returnNumber}`,
          createdBy: data.approvedBy
        }
      })

      // تحديث طبقة التكلفة
      const costLayer = await tx.costLayer.findFirst({
        where: {
          productId: item.productId,
          warehouseId: returnData.warehouseId,
          remainingQuantity: { gt: 0 }
        },
        orderBy: { layerDate: 'asc' }
      })

      if (costLayer) {
        const newRemaining = Math.max(0, costLayer.remainingQuantity - item.quantity)
        await tx.costLayer.update({
          where: { id: costLayer.id },
          data: {
            remainingQuantity: newRemaining,
            isExpired: newRemaining === 0
          }
        })
      }
    }
  }

  // تحديث رصيد المورد
  const supplier = await tx.supplier.findUnique({
    where: { id: returnData.supplierId }
  })

  if (supplier) {
    await tx.supplierTransaction.create({
      data: {
        companyId: returnData.companyId,
        supplierId: returnData.supplierId,
        transactionType: 'RETURN',
        referenceType: 'PURCHASE_RETURN',
        referenceId: returnData.id,
        transactionNumber: `STR-${new Date().getFullYear()}-${Date.now()}`,
        transactionDate: returnData.returnDate,
        debit: 0,
        credit: returnData.total,
        balance: supplier.currentBalance - returnData.total,
        notes: `مرتجع مشتريات رقم ${returnData.returnNumber}`
      }
    })

    await tx.supplier.update({
      where: { id: returnData.supplierId },
      data: {
        currentBalance: supplier.currentBalance - returnData.total,
        balanceType: supplier.currentBalance - returnData.total > 0 ? 'CREDIT' : 'DEBIT'
      }
    })
  }
}
