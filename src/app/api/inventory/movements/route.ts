import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog, ERROR_MESSAGES, getErrorMessage } from '@/lib/audit'

// Movement types
const MOVEMENT_TYPES = ['IN', 'OUT', 'TRANSFER', 'RETURN', 'ADJUSTMENT']

// GET /api/inventory/movements - List all inventory movements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const warehouseId = searchParams.get('warehouseId')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const referenceType = searchParams.get('referenceType')
    const referenceId = searchParams.get('referenceId')
    const createdBy = searchParams.get('createdBy')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.COMPANY_REQUIRED },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Filter by warehouse
    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    // Filter by product
    if (productId) {
      where.productId = productId
    }

    // Filter by movement type
    if (type && MOVEMENT_TYPES.includes(type)) {
      where.type = type
    }

    // Filter by reference
    if (referenceType) {
      where.referenceType = referenceType
    }
    if (referenceId) {
      where.referenceId = referenceId
    }

    // Filter by creator
    if (createdBy) {
      where.createdBy = createdBy
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Filter by company through product or warehouse
    where.OR = [
      {
        product: {
          companyId
        }
      },
      {
        warehouse: {
          companyId
        }
      }
    ]

    const [movements, total] = await Promise.all([
      db.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              sku: true,
              unit: true,
              category: {
                select: { id: true, name: true, nameAr: true }
              }
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              code: true,
              branch: {
                select: { id: true, name: true, nameAr: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' }
        ]
      }),
      db.inventoryMovement.count({ where })
    ])

    // Get user details for created movements
    const userIds = [...new Set(movements.map(m => m.createdBy).filter(Boolean))]
    const users = userIds.length > 0 ? await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, nameAr: true, email: true }
    }) : []

    const userMap = new Map(users.map(u => [u.id, u]))

    // Add user info to movements
    const movementsWithUser = movements.map(movement => ({
      ...movement,
      createdByUser: movement.createdBy ? userMap.get(movement.createdBy) : null
    }))

    return NextResponse.json({
      success: true,
      data: movementsWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching movements:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// POST /api/inventory/movements - Create a new inventory movement (for TRANSFER and RETURN)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      warehouseId,
      type,
      quantity,
      referenceType,
      referenceId,
      notes,
      userId,
      companyId,
      // For transfer
      toWarehouseId
    } = body

    // Validation
    if (!productId || !warehouseId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DATA },
        { status: 400 }
      )
    }

    if (!MOVEMENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_MOVEMENT_TYPE },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_QUANTITY },
        { status: 400 }
      )
    }

    // Verify product and warehouse belong to the company
    const [product, warehouse] = await Promise.all([
      db.product.findFirst({
        where: { id: productId, companyId }
      }),
      db.warehouse.findFirst({
        where: { id: warehouseId, companyId }
      })
    ])

    if (!product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      )
    }

    if (!warehouse) {
      return NextResponse.json(
        { error: 'المخزن غير موجود' },
        { status: 404 }
      )
    }

    // Handle different movement types
    if (type === 'TRANSFER') {
      // Transfer between warehouses
      if (!toWarehouseId) {
        return NextResponse.json(
          { error: 'المخزن المستهدف مطلوب للنقل' },
          { status: 400 }
        )
      }

      // Verify target warehouse
      const toWarehouse = await db.warehouse.findFirst({
        where: { id: toWarehouseId, companyId }
      })

      if (!toWarehouse) {
        return NextResponse.json(
          { error: 'المخزن المستهدف غير موجود' },
          { status: 404 }
        )
      }

      // Execute transfer in transaction
      const result = await db.$transaction(async (tx) => {
        // Check source inventory
        const sourceInventory = await tx.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId
            }
          }
        })

        if (!sourceInventory || sourceInventory.quantity < quantity) {
          throw new Error(ERROR_MESSAGES.INSUFFICIENT_STOCK)
        }

        // Decrease source warehouse
        await tx.inventory.update({
          where: { id: sourceInventory.id },
          data: { quantity: { decrement: quantity } }
        })

        // Increase target warehouse
        const targetInventory = await tx.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId: toWarehouseId
            }
          }
        })

        if (targetInventory) {
          await tx.inventory.update({
            where: { id: targetInventory.id },
            data: { quantity: { increment: quantity } }
          })
        } else {
          await tx.inventory.create({
            data: {
              productId,
              warehouseId: toWarehouseId,
              quantity
            }
          })
        }

        // Create OUT movement for source warehouse
        const outMovement = await tx.inventoryMovement.create({
          data: {
            productId,
            warehouseId,
            type: 'OUT',
            quantity,
            referenceType: 'TRANSFER',
            notes: `نقل إلى ${toWarehouse.name}. ${notes || ''}`,
            createdBy: userId
          }
        })

        // Create IN movement for target warehouse
        const inMovement = await tx.inventoryMovement.create({
          data: {
            productId,
            warehouseId: toWarehouseId,
            type: 'IN',
            quantity,
            referenceType: 'TRANSFER',
            notes: `نقل من ${warehouse.name}. ${notes || ''}`,
            createdBy: userId
          }
        })

        return { outMovement, inMovement }
      })

      // Create audit log
      await createAuditLog({
        companyId,
        branchId: warehouse.branchId || undefined,
        userId,
        action: 'CREATE',
        entityType: 'InventoryMovement',
        entityId: result.outMovement.id,
        newData: {
          type: 'TRANSFER',
          productId,
          fromWarehouseId: warehouseId,
          toWarehouseId,
          quantity
        }
      })

      return NextResponse.json({
        success: true,
        data: result,
        message: 'تم النقل بنجاح'
      })
    } else {
      // Handle other movement types (IN, OUT, RETURN, ADJUSTMENT)
      // These are typically handled by the /api/inventory endpoints
      // but this provides a direct way to create movements

      if (type === 'OUT') {
        // Check stock for OUT movements
        const inventory = await db.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId
            }
          }
        })

        if (!inventory || inventory.quantity < quantity) {
          return NextResponse.json(
            { error: ERROR_MESSAGES.INSUFFICIENT_STOCK },
            { status: 400 }
          )
        }

        await db.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: quantity } }
        })
      } else if (type === 'IN' || type === 'RETURN') {
        // Add to inventory
        const inventory = await db.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId
            }
          }
        })

        if (inventory) {
          await db.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { increment: quantity } }
          })
        } else {
          await db.inventory.create({
            data: {
              productId,
              warehouseId,
              quantity
            }
          })
        }
      } else if (type === 'ADJUSTMENT') {
        // For adjustments, we need the new quantity
        return NextResponse.json(
          { error: 'استخدم endpoint /api/inventory للتعديل' },
          { status: 400 }
        )
      }

      // Create the movement
      const movement = await db.inventoryMovement.create({
        data: {
          productId,
          warehouseId,
          type,
          quantity,
          referenceType,
          referenceId,
          notes,
          createdBy: userId
        },
        include: {
          product: true,
          warehouse: true
        }
      })

      // Create audit log
      await createAuditLog({
        companyId,
        branchId: warehouse.branchId || undefined,
        userId,
        action: 'CREATE',
        entityType: 'InventoryMovement',
        entityId: movement.id,
        newData: movement
      })

      return NextResponse.json({
        success: true,
        data: movement
      })
    }
  } catch (error) {
    console.error('Error creating movement:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// GET /api/inventory/movements/stats - Get movement statistics
export async function getMovementStats(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const warehouseId = searchParams.get('warehouseId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.COMPANY_REQUIRED },
        { status: 400 }
      )
    }

    const where: any = {
      OR: [
        { product: { companyId } },
        { warehouse: { companyId } }
      ],
      ...(warehouseId && { warehouseId }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    }

    // Get counts by type
    const statsByType = await db.inventoryMovement.groupBy({
      by: ['type'],
      where,
      _count: true,
      _sum: {
        quantity: true
      }
    })

    // Get total movements
    const totalMovements = await db.inventoryMovement.count({ where })

    // Get recent movements
    const recentMovements = await db.inventoryMovement.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        warehouse: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        byType: statsByType,
        total: totalMovements,
        recent: recentMovements
      }
    })
  } catch (error) {
    console.error('Error fetching movement stats:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
