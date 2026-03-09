// API للمزامنة التلقائية
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// معالجة طلبات المزامنة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operationType, data, operationId } = body
    
    // التحقق من نوع العملية
    if (!operationType || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    let result
    
    switch (operationType) {
      case 'create_customer':
        result = await handleCreateCustomer(data)
        break
        
      case 'update_customer':
        result = await handleUpdateCustomer(data)
        break
        
      case 'create_invoice':
        result = await handleCreateInvoice(data)
        break
        
      case 'create_payment':
        result = await handleCreatePayment(data)
        break
        
      case 'collect_installment':
        result = await handleCollectInstallment(data)
        break
        
      case 'update_inventory':
        result = await handleUpdateInventory(data)
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown operation type' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      operationId,
      result,
      syncedAt: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Sync error:', error)
    
    // التحقق من conflict
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Data conflict detected',
          conflict: true,
          details: error.message
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// الحصول على حالة المزامنة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    
    // الحصول على العمليات المعلقة
    const pendingOperations = await db.offlineSync.findMany({
      where: {
        agentId: agentId || undefined,
        status: 'pending'
      },
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json({
      success: true,
      pendingCount: pendingOperations.length,
      pendingOperations: pendingOperations.map(op => ({
        id: op.id,
        action: op.action,
        entityType: op.entityType,
        createdAt: op.createdAt
      }))
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ===================== HANDLERS =====================

async function handleCreateCustomer(data: any) {
  const customer = await db.customer.create({
    data: {
      id: data.id || crypto.randomUUID(),
      companyId: data.companyId,
      branchId: data.branchId,
      code: data.code,
      name: data.name,
      nameAr: data.nameAr,
      phone: data.phone,
      phone2: data.phone2,
      address: data.address,
      nationalId: data.nationalId,
      creditLimit: data.creditLimit || 0,
      balance: data.balance || 0,
      notes: data.notes,
      active: true,
      updatedAt: new Date()
    }
  })
  
  return { customerId: customer.id }
}

async function handleUpdateCustomer(data: any) {
  const customer = await db.customer.update({
    where: { id: data.id },
    data: {
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      updatedAt: new Date()
    }
  })
  
  return { customerId: customer.id }
}

async function handleCreateInvoice(data: any) {
  // التحقق من عدم وجود الفاتورة مسبقاً
  const existing = await db.invoice.findFirst({
    where: { invoiceNumber: data.invoiceNumber }
  })
  
  if (existing) {
    return { invoiceId: existing.id, duplicate: true }
  }
  
  const invoice = await db.invoice.create({
    data: {
      id: data.id || crypto.randomUUID(),
      companyId: data.companyId,
      branchId: data.branchId,
      customerId: data.customerId,
      agentId: data.agentId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: new Date(data.invoiceDate),
      type: data.type || 'cash',
      status: data.status || 'pending',
      subtotal: data.subtotal,
      discount: data.discount || 0,
      taxRate: data.taxRate || 0,
      taxAmount: data.taxAmount || 0,
      total: data.total,
      paidAmount: data.paidAmount || 0,
      remainingAmount: data.remainingAmount || data.total,
      notes: data.notes,
      updatedAt: new Date()
    }
  })
  
  // إنشاء عناصر الفاتورة
  if (data.items && data.items.length > 0) {
    await db.invoiceItem.createMany({
      data: data.items.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        invoiceId: invoice.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        total: item.total,
        notes: item.notes
      }))
    })
  }
  
  return { invoiceId: invoice.id }
}

async function handleCreatePayment(data: any) {
  // التحقق من عدم وجود الدفعة مسبقاً
  const existing = await db.payment.findFirst({
    where: { paymentNumber: data.paymentNumber }
  })
  
  if (existing) {
    return { paymentId: existing.id, duplicate: true }
  }
  
  const payment = await db.payment.create({
    data: {
      id: data.id || crypto.randomUUID(),
      companyId: data.companyId,
      branchId: data.branchId,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      agentId: data.agentId,
      paymentNumber: data.paymentNumber,
      paymentDate: new Date(data.paymentDate),
      method: data.method || 'cash',
      amount: data.amount,
      reference: data.reference,
      notes: data.notes,
      status: 'completed',
      updatedAt: new Date()
    }
  })
  
  // تحديث حالة الفاتورة
  if (data.invoiceId) {
    const invoice = await db.invoice.findUnique({
      where: { id: data.invoiceId }
    })
    
    if (invoice) {
      const newPaidAmount = invoice.paidAmount + data.amount
      const newRemaining = invoice.total - newPaidAmount
      
      await db.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemaining),
          status: newRemaining <= 0 ? 'paid' : 'partial',
          updatedAt: new Date()
        }
      })
    }
  }
  
  return { paymentId: payment.id }
}

async function handleCollectInstallment(data: any) {
  const installment = await db.installment.update({
    where: { id: data.installmentId },
    data: {
      paidAmount: { increment: data.amount },
      remainingAmount: { decrement: data.amount },
      status: data.remainingAmount <= 0 ? 'paid' : 'partial',
      paidDate: new Date(),
      updatedAt: new Date()
    }
  })
  
  // إنشاء سجل الدفع
  await db.installmentPayment.create({
    data: {
      id: crypto.randomUUID(),
      installmentId: data.installmentId,
      agentId: data.agentId,
      paymentDate: new Date(),
      amount: data.amount,
      method: data.method || 'cash',
      reference: data.reference,
      notes: data.notes
    }
  })
  
  return { installmentId: installment.id }
}

async function handleUpdateInventory(data: any) {
  // تحديث أو إنشاء سجل المخزون
  const existing = await db.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: data.productId,
        warehouseId: data.warehouseId
      }
    }
  })
  
  if (existing) {
    await db.inventory.update({
      where: { id: existing.id },
      data: {
        quantity: data.quantity,
        updatedAt: new Date()
      }
    })
  } else {
    await db.inventory.create({
      data: {
        id: crypto.randomUUID(),
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        minQuantity: data.minQuantity || 0,
        maxQuantity: data.maxQuantity,
        updatedAt: new Date()
      }
    })
  }
  
  // تسجيل حركة المخزون
  await db.inventoryMovement.create({
    data: {
      id: crypto.randomUUID(),
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: data.movementType || 'adjustment',
      quantity: data.quantityChange || data.quantity,
      referenceType: 'offline_sync',
      referenceId: data.syncId,
      notes: data.notes,
      createdBy: data.agentId,
      createdAt: new Date()
    }
  })
  
  return { success: true }
}
