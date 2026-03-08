import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const warehouseId = searchParams.get('warehouseId') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } }
        ]
      }
    }
    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    const [inventory, total] = await Promise.all([
      db.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          product: { 
            select: { id: true, name: true, sku: true, unit: true, sellPrice: true } 
          },
          warehouse: { 
            select: { id: true, name: true } 
          }
        }
      }),
      db.inventory.count({ where })
    ])

    // Get low stock items count
    const lowStockCount = await db.inventory.count({
      where: {
        quantity: { lte: db.inventory.fields.minQuantity }
      }
    })

    return NextResponse.json({
      success: true,
      data: inventory,
      lowStockCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب المخزون' }, { status: 500 })
  }
}
