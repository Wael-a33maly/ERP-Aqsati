import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - جلب تحويل محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transfer = await db.inventoryTransfer.findUnique({
      where: { id },
      include: {
        FromBranch: true,
        ToBranch: true,
        FromWarehouse: true,
        ToWarehouse: true,
        InventoryTransferItem: {
          include: {
            Product: { select: { id: true, sku: true, name: true, nameAr: true, unit: true } }
          }
        }
      }
    })

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: 'التحويل غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: transfer })
  } catch (error) {
    console.error('Error fetching transfer:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التحويل' },
      { status: 500 }
    )
  }
}

// PUT - تحديث/اعتماد تحويل
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const existingTransfer = await db.inventoryTransfer.findUnique({
      where: { id },
      include: { InventoryTransferItem: true }
    })

    if (!existingTransfer) {
      return NextResponse.json(
        { success: false, error: 'التحويل غير موجود' },
        { status: 404 }
      )
    }

    if (existingTransfer.status === 'approved' || existingTransfer.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل تحويل معتمد أو مكتمل' },
        { status: 400 }
      )
    }

    // اعتماد التحويل
    if (data.status === 'approved') {
      return await approveTransfer(existingTransfer, data)
    }

    // استلام التحويل
    if (data.status === 'completed') {
      return await completeTransfer(existingTransfer, data)
    }

    // تحديث عادي
    const transfer = await db.inventoryTransfer.update({
      where: { id },
      data: {
        reason: data.reason,
        notes: data.notes,
        status: data.status
      }
    })

    return NextResponse.json({ success: true, data: transfer })
  } catch (error) {
    console.error('Error updating transfer:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التحويل' },
      { status: 500 }
    )
  }
}

// دالة اعتماد التحويل (خصم من المخزن المصدر)
async function approveTransfer(transfer: any, data: any) {
  const result = await db.$transaction(async (tx) => {
    // التحقق من توفر الكمية في المخزن المصدر
    for (const item of transfer.InventoryTransferItem) {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: transfer.fromWarehouseId
          }
        }
      })

      if (!inventory || inventory.quantity < item.quantity) {
        throw new Error(`الكمية غير متوفرة للصنف ${item.productId}`)
      }
    }

    // خصم من المخزن المصدر
    for (const item of transfer.InventoryTransferItem) {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: transfer.fromWarehouseId
          }
        }
      })

      if (inventory) {
        const newQuantity = inventory.quantity - item.quantity
        const newTotalCost = inventory.totalCost - (item.quantity * inventory.avgCost)

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQuantity,
            totalCost: Math.max(0, newTotalCost)
          }
        })

        // حركة مخزون (صادر)
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.fromWarehouseId,
            type: 'TRANSFER_OUT',
            quantity: item.quantity,
            unitCost: inventory.avgCost,
            totalCost: item.quantity * inventory.avgCost,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            notes: `تحويل إلى ${transfer.transferNumber}`,
            createdBy: data.approvedBy
          }
        })

        // تحديث طبقة التكلفة
        const costLayer = await tx.costLayer.findFirst({
          where: {
            productId: item.productId,
            warehouseId: transfer.fromWarehouseId,
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

    // تحديث حالة التحويل
    const updatedTransfer = await tx.inventoryTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'approved',
        approvedBy: data.approvedBy,
        approvedAt: new Date()
      }
    })

    return updatedTransfer
  })

  return NextResponse.json({ success: true, data: result })
}

// دالة استلام التحويل (إضافة للمخزن المستقبل)
async function completeTransfer(transfer: any, data: any) {
  if (transfer.status !== 'approved') {
    return NextResponse.json(
      { success: false, error: 'يجب اعتماد التحويل أولاً' },
      { status: 400 }
    )
  }

  const result = await db.$transaction(async (tx) => {
    // إضافة للمخزن المستقبل
    for (const item of transfer.InventoryTransferItem) {
      let inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: transfer.toWarehouseId
          }
        }
      })

      const unitCost = item.unitCost || 0

      if (inventory) {
        const newQuantity = inventory.quantity + item.quantity
        const newTotalCost = inventory.totalCost + (item.quantity * unitCost)
        const newAvgCost = newTotalCost / newQuantity

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQuantity,
            totalCost: newTotalCost,
            avgCost: newAvgCost
          }
        })
      } else {
        inventory = await tx.inventory.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.toWarehouseId,
            quantity: item.quantity,
            avgCost: unitCost,
            totalCost: item.quantity * unitCost
          }
        })
      }

      // حركة مخزون (وارد)
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          type: 'TRANSFER_IN',
          quantity: item.quantity,
          unitCost,
          totalCost: item.quantity * unitCost,
          referenceType: 'TRANSFER',
          referenceId: transfer.id,
          notes: `تحويل من ${transfer.transferNumber}`,
          createdBy: data.receivedBy
        }
      })

      // إنشاء طبقة تكلفة جديدة في المخزن المستقبل
      await tx.costLayer.create({
        data: {
          companyId: transfer.companyId,
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          layerDate: new Date(),
          quantity: item.quantity,
          remainingQuantity: item.quantity,
          unitCost,
          totalCost: item.quantity * unitCost
        }
      })
    }

    // تحديث حالة التحويل
    const updatedTransfer = await tx.inventoryTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'completed',
        receivedBy: data.receivedBy,
        receivedAt: new Date()
      }
    })

    return updatedTransfer
  })

  return NextResponse.json({ success: true, data: result })
}

// DELETE - حذف تحويل
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transfer = await db.inventoryTransfer.findUnique({
      where: { id }
    })

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: 'التحويل غير موجود' },
        { status: 404 }
      )
    }

    if (transfer.status === 'approved' || transfer.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف تحويل معتمد أو مكتمل' },
        { status: 400 }
      )
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryTransferItem.deleteMany({
        where: { transferId: id }
      })
      
      await tx.inventoryTransfer.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true, message: 'تم حذف التحويل بنجاح' })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التحويل' },
      { status: 500 }
    )
  }
}
