import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog, ERROR_MESSAGES, getErrorMessage } from '@/lib/audit'

// GET /api/warehouses - List all warehouses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const branchId = searchParams.get('branchId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const includeInventory = searchParams.get('includeInventory') === 'true'
    const mainOnly = searchParams.get('mainOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    // companyId is optional - if not provided, return all warehouses (for super admin)
    const where: any = {
      ...(companyId && { companyId }),
      ...(activeOnly && { active: true }),
      ...(branchId && { branchId }),
      ...(mainOnly && { isMain: true })
    }

    const warehouses = await db.warehouse.findMany({
      where,
      take: limit,
      include: {
        company: {
          select: { id: true, name: true, code: true }
        },
        branch: {
          select: { id: true, name: true, nameAr: true, code: true }
        },
        ...(includeInventory && {
          inventory: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, unit: true }
              }
            }
          }
        }),
        _count: {
          select: {
            inventory: true,
            movements: true
          }
        }
      },
      orderBy: [
        { isMain: 'desc' },
        { name: 'asc' }
      ]
    })

    // Calculate total stock value for each warehouse if inventory is included
    const warehousesWithStats = warehouses.map(warehouse => {
      if (includeInventory && warehouse.inventory) {
        const totalItems = warehouse.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
        const totalValue = warehouse.inventory.reduce(
          (sum, inv) => sum + (inv.quantity * (inv.product?.costPrice || 0)),
          0
        )
        return { ...warehouse, totalItems, totalValue }
      }
      return warehouse
    })

    return NextResponse.json({
      success: true,
      data: warehousesWithStats
    })
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// POST /api/warehouses - Create a new warehouse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyId,
      branchId,
      name,
      nameAr,
      code,
      address,
      isMain,
      userId
    } = body

    if (!companyId || !name || !code) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DATA },
        { status: 400 }
      )
    }

    // Check if code already exists for this company
    const existingWarehouse = await db.warehouse.findFirst({
      where: { companyId, code }
    })

    if (existingWarehouse) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DUPLICATE_CODE },
        { status: 400 }
      )
    }

    // Verify branch exists if specified
    if (branchId) {
      const branch = await db.branch.findFirst({
        where: { id: branchId, companyId }
      })
      if (!branch) {
        return NextResponse.json(
          { error: 'الفرع غير موجود' },
          { status: 400 }
        )
      }
    }

    // If setting as main warehouse, unset other main warehouses
    if (isMain) {
      await db.warehouse.updateMany({
        where: { companyId, isMain: true },
        data: { isMain: false }
      })
    }

    const warehouse = await db.warehouse.create({
      data: {
        companyId,
        branchId: branchId || null,
        name,
        nameAr,
        code,
        address,
        isMain: isMain || false
      },
      include: {
        branch: true
      }
    })

    // Create audit log
    await createAuditLog({
      companyId,
      branchId: branchId || undefined,
      userId,
      action: 'CREATE',
      entityType: 'Warehouse',
      entityId: warehouse.id,
      newData: warehouse
    })

    return NextResponse.json({
      success: true,
      data: warehouse
    })
  } catch (error) {
    console.error('Error creating warehouse:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// PUT /api/warehouses - Update a warehouse
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      companyId,
      branchId,
      name,
      nameAr,
      code,
      address,
      isMain,
      active,
      userId
    } = body

    if (!id || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DATA },
        { status: 400 }
      )
    }

    // Check if warehouse exists
    const existingWarehouse = await db.warehouse.findFirst({
      where: { id, companyId }
    })

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      )
    }

    // Check if code is being changed and if it conflicts
    if (code && code !== existingWarehouse.code) {
      const warehouseWithCode = await db.warehouse.findFirst({
        where: { companyId, code, id: { not: id } }
      })
      if (warehouseWithCode) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.DUPLICATE_CODE },
          { status: 400 }
        )
      }
    }

    // Verify branch exists if specified
    if (branchId) {
      const branch = await db.branch.findFirst({
        where: { id: branchId, companyId }
      })
      if (!branch) {
        return NextResponse.json(
          { error: 'الفرع غير موجود' },
          { status: 400 }
        )
      }
    }

    // If setting as main warehouse, unset other main warehouses
    if (isMain && !existingWarehouse.isMain) {
      await db.warehouse.updateMany({
        where: { companyId, isMain: true },
        data: { isMain: false }
      })
    }

    const updateData: any = {}
    if (branchId !== undefined) updateData.branchId = branchId || null
    if (name !== undefined) updateData.name = name
    if (nameAr !== undefined) updateData.nameAr = nameAr
    if (code !== undefined) updateData.code = code
    if (address !== undefined) updateData.address = address
    if (isMain !== undefined) updateData.isMain = isMain
    if (active !== undefined) updateData.active = active

    const warehouse = await db.warehouse.update({
      where: { id },
      data: updateData,
      include: {
        branch: true
      }
    })

    // Create audit log
    await createAuditLog({
      companyId,
      branchId: branchId || undefined,
      userId,
      action: 'UPDATE',
      entityType: 'Warehouse',
      entityId: warehouse.id,
      oldData: existingWarehouse,
      newData: warehouse
    })

    return NextResponse.json({
      success: true,
      data: warehouse
    })
  } catch (error) {
    console.error('Error updating warehouse:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/warehouses - Soft delete a warehouse
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const companyId = searchParams.get('companyId')
    const userId = searchParams.get('userId')

    if (!id || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DATA },
        { status: 400 }
      )
    }

    // Check if warehouse exists
    const existingWarehouse = await db.warehouse.findFirst({
      where: { id, companyId },
      include: {
        inventory: {
          where: { quantity: { gt: 0 } }
        }
      }
    })

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      )
    }

    // Check if warehouse has stock
    if (existingWarehouse.inventory.length > 0) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.WAREHOUSE_IN_USE },
        { status: 400 }
      )
    }

    // Soft delete by setting active = false
    const warehouse = await db.warehouse.update({
      where: { id },
      data: { active: false }
    })

    // Create audit log
    await createAuditLog({
      companyId,
      branchId: existingWarehouse.branchId || undefined,
      userId: userId || undefined,
      action: 'DELETE',
      entityType: 'Warehouse',
      entityId: warehouse.id,
      oldData: existingWarehouse
    })

    return NextResponse.json({
      success: true,
      data: warehouse
    })
  } catch (error) {
    console.error('Error deleting warehouse:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
