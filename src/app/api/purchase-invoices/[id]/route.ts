import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - جلب فاتورة مشتريات محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        Supplier: true,
        Branch: true,
        Warehouse: true,
        PurchaseInvoiceItem: {
          include: {
            Product: {
              select: { id: true, sku: true, name: true, nameAr: true, unit: true }
            }
          }
        },
        PurchaseReturn: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'الفاتورة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Error fetching purchase invoice:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الفاتورة' },
      { status: 500 }
    )
  }
}

// PUT - تحديث فاتورة مشتريات
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // التحقق من حالة الفاتورة
    const existingInvoice = await db.purchaseInvoice.findUnique({
      where: { id },
      include: { PurchaseInvoiceItem: true }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'الفاتورة غير موجودة' },
        { status: 404 }
      )
    }

    if (existingInvoice.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل فاتورة معتمدة' },
        { status: 400 }
      )
    }

    // إذا كان الطلب اعتماد الفاتورة
    if (data.status === 'approved' && existingInvoice.status !== 'approved') {
      return await approveInvoice(existingInvoice, data)
    }

    // تحديث الفاتورة
    const invoice = await db.$transaction(async (tx) => {
      // حذف الأصناف القديمة
      await tx.purchaseInvoiceItem.deleteMany({
        where: { purchaseInvoiceId: id }
      })

      // حساب الإجماليات الجديدة
      let subtotal = 0
      let totalTax = 0
      
      const itemsData = data.items?.map((item: any) => {
        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0)
        const itemTax = itemTotal * ((item.taxRate || data.taxRate || 0) / 100)
        subtotal += itemTotal
        totalTax += itemTax
        
        return {
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate || data.taxRate || 0,
          taxAmount: itemTax,
          total: itemTotal + itemTax
        }
      }) || []

      let discount = 0
      if (data.discountType === 'PERCENTAGE') {
        discount = subtotal * ((data.discountValue || 0) / 100)
      } else {
        discount = data.discountValue || 0
      }

      const total = subtotal - discount + totalTax + (data.additions || 0) - (data.deductions || 0)

      // تحديث الفاتورة
      const updatedInvoice = await tx.purchaseInvoice.update({
        where: { id },
        data: {
          supplierInvoiceNumber: data.supplierInvoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status,
          subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue || 0,
          discount,
          taxRate: data.taxRate || 0,
          taxAmount: totalTax,
          additions: data.additions || 0,
          deductions: data.deductions || 0,
          total,
          remainingAmount: total - existingInvoice.paidAmount,
          notes: data.notes
        }
      })

      // إضافة الأصناف الجديدة
      for (const item of itemsData) {
        await tx.purchaseInvoiceItem.create({
          data: {
            purchaseInvoiceId: id,
            ...item
          }
        })
      }

      return updatedInvoice
    })

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Error updating purchase invoice:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الفاتورة' },
      { status: 500 }
    )
  }
}

// دالة اعتماد الفاتورة
async function approveInvoice(invoice: any, data: any) {
  const result = await db.$transaction(async (tx) => {
    // تحديث حالة الفاتورة
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { id: invoice.id },
      data: {
        status: 'approved',
        approvedBy: data.approvedBy,
        approvedAt: new Date()
      },
      include: {
        PurchaseInvoiceItem: true
      }
    })

    // تحديث المخزون ورصيد المورد
    for (const item of updatedInvoice.PurchaseInvoiceItem) {
      // البحث عن سجل المخزون
      let inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: invoice.warehouseId
          }
        }
      })

      const unitCost = (item.quantity * item.unitPrice - item.discount + item.taxAmount) / item.quantity

      if (inventory) {
        const newQuantity = inventory.quantity + item.quantity
        const newTotalCost = inventory.totalCost + (item.quantity * unitCost)
        const newAvgCost = newTotalCost / newQuantity

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQuantity,
            avgCost: newAvgCost,
            totalCost: newTotalCost,
            lastPurchaseDate: new Date(),
            lastPurchaseCost: unitCost
          }
        })
      } else {
        await tx.inventory.create({
          data: {
            productId: item.productId,
            warehouseId: invoice.warehouseId,
            quantity: item.quantity,
            avgCost: unitCost,
            totalCost: item.quantity * unitCost,
            lastPurchaseDate: new Date(),
            lastPurchaseCost: unitCost
          }
        })
      }

      // حركة مخزون
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          type: 'IN',
          quantity: item.quantity,
          unitCost,
          totalCost: item.quantity * unitCost,
          referenceType: 'PURCHASE_INVOICE',
          referenceId: invoice.id,
          notes: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`,
          createdBy: data.approvedBy
        }
      })

      // طبقة تكلفة
      await tx.costLayer.create({
        data: {
          companyId: invoice.companyId,
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          purchaseInvoiceId: invoice.id,
          layerDate: invoice.invoiceDate,
          quantity: item.quantity,
          remainingQuantity: item.quantity,
          unitCost,
          totalCost: item.quantity * unitCost
        }
      })

      // تحديث تكلفة المنتج
      await tx.product.update({
        where: { id: item.productId },
        data: { costPrice: unitCost }
      })
    }

    // تحديث رصيد المورد
    const supplier = await tx.supplier.findUnique({
      where: { id: invoice.supplierId }
    })

    if (supplier) {
      await tx.supplierTransaction.create({
        data: {
          companyId: invoice.companyId,
          supplierId: invoice.supplierId,
          transactionType: 'INVOICE',
          referenceType: 'PURCHASE_INVOICE',
          referenceId: invoice.id,
          transactionNumber: `STR-${new Date().getFullYear()}-${Date.now()}`,
          transactionDate: invoice.invoiceDate,
          debit: invoice.total,
          credit: 0,
          balance: supplier.currentBalance + invoice.total,
          notes: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`
        }
      })

      await tx.supplier.update({
        where: { id: invoice.supplierId },
        data: {
          currentBalance: supplier.currentBalance + invoice.total,
          balanceType: supplier.currentBalance + invoice.total > 0 ? 'CREDIT' : 'DEBIT'
        }
      })
    }

    return updatedInvoice
  })

  return NextResponse.json({ success: true, data: result })
}

// DELETE - حذف فاتورة مشتريات
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.purchaseInvoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'الفاتورة غير موجودة' },
        { status: 404 }
      )
    }

    if (invoice.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف فاتورة معتمدة' },
        { status: 400 }
      )
    }

    await db.$transaction(async (tx) => {
      await tx.purchaseInvoiceItem.deleteMany({
        where: { purchaseInvoiceId: id }
      })
      
      await tx.purchaseInvoice.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true, message: 'تم حذف الفاتورة بنجاح' })
  } catch (error) {
    console.error('Error deleting purchase invoice:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الفاتورة' },
      { status: 500 }
    )
  }
}
