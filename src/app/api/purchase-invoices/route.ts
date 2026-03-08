import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - جلب جميع فواتير المشتريات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''
    const status = searchParams.get('status') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const branchId = searchParams.get('branchId') || ''
    const warehouseId = searchParams.get('warehouseId') || ''
    const fromDate = searchParams.get('fromDate') || ''
    const toDate = searchParams.get('toDate') || ''

    const skip = (page - 1) * limit

    const where: Prisma.PurchaseInvoiceWhereInput = {}
    
    if (companyId) where.companyId = companyId
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    if (branchId) where.branchId = branchId
    if (warehouseId) where.warehouseId = warehouseId
    
    if (fromDate || toDate) {
      where.invoiceDate = {}
      if (fromDate) where.invoiceDate.gte = new Date(fromDate)
      if (toDate) where.invoiceDate.lte = new Date(toDate)
    }
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { supplierInvoiceNumber: { contains: search } },
        { Supplier: { name: { contains: search } } }
      ]
    }

    const [invoices, total] = await Promise.all([
      db.purchaseInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Supplier: { select: { id: true, name: true, supplierCode: true } },
          Branch: { select: { id: true, name: true } },
          Warehouse: { select: { id: true, name: true } },
          _count: { select: { PurchaseInvoiceItem: true } }
        }
      }),
      db.purchaseInvoice.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching purchase invoices:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب فواتير المشتريات' },
      { status: 500 }
    )
  }
}

// POST - إنشاء فاتورة مشتريات جديدة
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // التحقق من البيانات المطلوبة
    if (!data.companyId || !data.warehouseId || !data.supplierId || !data.items?.length) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    // توليد رقم الفاتورة
    const year = new Date().getFullYear()
    const prefix = `PI-${year}-`
    
    const lastInvoice = await db.purchaseInvoice.findFirst({
      where: {
        companyId: data.companyId,
        invoiceNumber: { startsWith: prefix }
      },
      orderBy: { invoiceNumber: 'desc' }
    })

    let sequence = 1
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-')
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1
      }
    }

    const invoiceNumber = `${prefix}${String(sequence).padStart(6, '0')}`

    // حساب الإجماليات
    let subtotal = 0
    let totalTax = 0
    
    const itemsData = data.items.map((item: any) => {
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
    })

    // حساب الخصم
    let discount = 0
    if (data.discountType === 'PERCENTAGE') {
      discount = subtotal * ((data.discountValue || 0) / 100)
    } else {
      discount = data.discountValue || 0
    }

    const total = subtotal - discount + totalTax + (data.additions || 0) - (data.deductions || 0)

    // إنشاء الفاتورة مع الأصناف في transaction واحد
    const invoice = await db.$transaction(async (tx) => {
      // إنشاء الفاتورة
      const newInvoice = await tx.purchaseInvoice.create({
        data: {
          invoiceNumber,
          companyId: data.companyId,
          branchId: data.branchId,
          warehouseId: data.warehouseId,
          supplierId: data.supplierId,
          supplierInvoiceNumber: data.supplierInvoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status || 'draft',
          subtotal,
          discountType: data.discountType || 'PERCENTAGE',
          discountValue: data.discountValue || 0,
          discount,
          taxRate: data.taxRate || 0,
          taxAmount: totalTax,
          additions: data.additions || 0,
          deductions: data.deductions || 0,
          total,
          paidAmount: data.paidAmount || 0,
          remainingAmount: total - (data.paidAmount || 0),
          notes: data.notes,
          createdBy: data.createdBy
        },
        include: {
          PurchaseInvoiceItem: true
        }
      })

      // إضافة الأصناف
      for (const item of itemsData) {
        await tx.purchaseInvoiceItem.create({
          data: {
            purchaseInvoiceId: newInvoice.id,
            ...item
          }
        })
      }

      // إذا كانت الفاتورة معتمدة، تحديث المخزون ورصيد المورد
      if (data.status === 'approved') {
        await updateInventoryAndSupplier(tx, newInvoice, itemsData, data)
      }

      return newInvoice
    })

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Error creating purchase invoice:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء فاتورة المشتريات' },
      { status: 500 }
    )
  }
}

// دالة تحديث المخزون ورصيد المورد
async function updateInventoryAndSupplier(
  tx: Prisma.TransactionClient,
  invoice: any,
  items: any[],
  data: any
) {
  // تحديث المخزون وإنشاء طبقات التكلفة
  for (const item of items) {
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
      // تحديث المخزون الموجود
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
      // إنشاء سجل مخزون جديد
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

    // إنشاء حركة مخزون
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
        createdBy: data.createdBy
      }
    })

    // إنشاء طبقة تكلفة (لـ FIFO)
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

  // إنشاء حركة رصيد المورد
  const supplier = await tx.supplier.findUnique({
    where: { id: invoice.supplierId }
  })

  if (supplier) {
    const transNumber = `STR-${new Date().getFullYear()}-${Date.now()}`
    
    await tx.supplierTransaction.create({
      data: {
        companyId: invoice.companyId,
        supplierId: invoice.supplierId,
        transactionType: 'INVOICE',
        referenceType: 'PURCHASE_INVOICE',
        referenceId: invoice.id,
        transactionNumber: transNumber,
        transactionDate: invoice.invoiceDate,
        debit: invoice.total,
        credit: 0,
        balance: supplier.currentBalance + invoice.total,
        notes: `فاتورة مشتريات رقم ${invoice.invoiceNumber}`
      }
    })

    // تحديث رصيد المورد
    await tx.supplier.update({
      where: { id: invoice.supplierId },
      data: {
        currentBalance: supplier.currentBalance + invoice.total,
        balanceType: supplier.currentBalance + invoice.total > 0 ? 'CREDIT' : 'DEBIT'
      }
    })
  }
}
