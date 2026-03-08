import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET - جلب جميع التحويلات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''
    const status = searchParams.get('status') || ''
    const fromWarehouseId = searchParams.get('fromWarehouseId') || ''
    const toWarehouseId = searchParams.get('toWarehouseId') || ''

    const skip = (page - 1) * limit

    const where: Prisma.InventoryTransferWhereInput = {}
    
    if (companyId) where.companyId = companyId
    if (status) where.status = status
    if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId
    if (toWarehouseId) where.toWarehouseId = toWarehouseId
    
    if (search) {
      where.transferNumber = { contains: search }
    }

    const [transfers, total] = await Promise.all([
      db.inventoryTransfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          FromBranch: { select: { id: true, name: true } },
          ToBranch: { select: { id: true, name: true } },
          FromWarehouse: { select: { id: true, name: true, code: true } },
          ToWarehouse: { select: { id: true, name: true, code: true } },
          _count: { select: { InventoryTransferItem: true } }
        }
      }),
      db.inventoryTransfer.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching inventory transfers:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التحويلات' },
      { status: 500 }
    )
  }
}

// POST - إنشاء تحويل جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.companyId || !data.fromWarehouseId || !data.toWarehouseId || !data.items?.length) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    if (data.fromWarehouseId === data.toWarehouseId) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن التحويل من وإلى نفس المخزن' },
        { status: 400 }
      )
    }

    // توليد رقم التحويل
    const year = new Date().getFullYear()
    const prefix = `TR-${year}-`
    
    const lastTransfer = await db.inventoryTransfer.findFirst({
      where: {
        companyId: data.companyId,
        transferNumber: { startsWith: prefix }
      },
      orderBy: { transferNumber: 'desc' }
    })

    let sequence = 1
    if (lastTransfer) {
      const parts = lastTransfer.transferNumber.split('-')
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1
      }
    }

    const transferNumber = `${prefix}${String(sequence).padStart(6, '0')}`

    // حساب الإجماليات
    let subtotal = 0
    let totalItems = data.items.length
    
    const itemsData = data.items.map((item: any) => {
      const itemTotal = item.quantity * (item.unitCost || 0)
      subtotal += itemTotal
      
      return {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost || 0,
        total: itemTotal,
        notes: item.notes
      }
    })

    // تحديد نوع التحويل
    const fromWarehouse = await db.warehouse.findUnique({
      where: { id: data.fromWarehouseId }
    })
    const toWarehouse = await db.warehouse.findUnique({
      where: { id: data.toWarehouseId }
    })

    const transferType = fromWarehouse?.branchId === toWarehouse?.branchId ? 'INTERNAL' : 'CROSS_BRANCH'

    const transfer = await db.$transaction(async (tx) => {
      const newTransfer = await tx.inventoryTransfer.create({
        data: {
          transferNumber,
          companyId: data.companyId,
          fromBranchId: fromWarehouse?.branchId,
          toBranchId: toWarehouse?.branchId,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          transferType,
          transferDate: data.transferDate ? new Date(data.transferDate) : new Date(),
          status: data.status || 'draft',
          reason: data.reason,
          subtotal,
          totalItems,
          notes: data.notes,
          requestedBy: data.requestedBy,
          createdBy: data.createdBy
        }
      })

      for (const item of itemsData) {
        await tx.inventoryTransferItem.create({
          data: {
            transferId: newTransfer.id,
            ...item
          }
        })
      }

      return newTransfer
    })

    return NextResponse.json({ success: true, data: transfer })
  } catch (error) {
    console.error('Error creating inventory transfer:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء التحويل' },
      { status: 500 }
    )
  }
}
