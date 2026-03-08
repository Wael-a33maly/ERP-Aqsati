import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - جلب مرتجع محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const purchaseReturn = await db.purchaseReturn.findUnique({
      where: { id },
      include: {
        Supplier: true,
        Branch: true,
        Warehouse: true,
        PurchaseInvoice: { select: { id: true, invoiceNumber: true } },
        PurchaseReturnItem: {
          include: {
            Product: { select: { id: true, sku: true, name: true, nameAr: true, unit: true } },
            PurchaseInvoiceItem: { select: { id: true, quantity: true, unitPrice: true } }
          }
        }
      }
    })

    if (!purchaseReturn) {
      return NextResponse.json(
        { success: false, error: 'المرتجع غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: purchaseReturn })
  } catch (error) {
    console.error('Error fetching purchase return:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المرتجع' },
      { status: 500 }
    )
  }
}

// PUT - تحديث/اعتماد مرتجع
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const existingReturn = await db.purchaseReturn.findUnique({
      where: { id }
    })

    if (!existingReturn) {
      return NextResponse.json(
        { success: false, error: 'المرتجع غير موجود' },
        { status: 404 }
      )
    }

    if (existingReturn.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل مرتجع معتمد' },
        { status: 400 }
      )
    }

    // اعتماد المرتجع
    if (data.status === 'approved') {
      const result = await approvePurchaseReturn(existingReturn, data)
      return result
    }

    // تحديث عادي
    const purchaseReturn = await db.purchaseReturn.update({
      where: { id },
      data: {
        reason: data.reason,
        notes: data.notes,
        status: data.status
      }
    })

    return NextResponse.json({ success: true, data: purchaseReturn })
  } catch (error) {
    console.error('Error updating purchase return:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المرتجع' },
      { status: 500 }
    )
  }
}

// دالة اعتماد المرتجع
async function approvePurchaseReturn(returnData: any, data: any) {
  const result = await db.$transaction(async (tx) => {
    // جلب أصناف المرتجع
    const items = await tx.purchaseReturnItem.findMany({
      where: { purchaseReturnId: returnData.id }
    })

    // تحديث المخزون لكل صنف
    for (const item of items) {
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

        // تحديث طبقة التكلفة (FIFO)
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

      // تحديث حالة الصنف
      await tx.purchaseReturnItem.update({
        where: { id: item.id },
        data: { restocked: true }
      })
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

    // تحديث حالة المرتجع
    const updatedReturn = await tx.purchaseReturn.update({
      where: { id: returnData.id },
      data: {
        status: 'approved',
        approvedBy: data.approvedBy,
        approvedAt: new Date()
      }
    })

    return updatedReturn
  })

  return NextResponse.json({ success: true, data: result })
}

// DELETE - حذف مرتجع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const purchaseReturn = await db.purchaseReturn.findUnique({
      where: { id }
    })

    if (!purchaseReturn) {
      return NextResponse.json(
        { success: false, error: 'المرتجع غير موجود' },
        { status: 404 }
      )
    }

    if (purchaseReturn.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف مرتجع معتمد' },
        { status: 400 }
      )
    }

    await db.$transaction(async (tx) => {
      await tx.purchaseReturnItem.deleteMany({
        where: { purchaseReturnId: id }
      })
      
      await tx.purchaseReturn.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true, message: 'تم حذف المرتجع بنجاح' })
  } catch (error) {
    console.error('Error deleting purchase return:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المرتجع' },
      { status: 500 }
    )
  }
}
