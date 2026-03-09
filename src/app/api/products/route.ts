import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع المنتجات
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId')
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
        ]
      }),
      ...(companyId && { companyId }),
      ...(active !== null && { active: active === 'true' })
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Company: {
            select: { id: true, name: true }
          },
          ProductCategory: {
            select: { id: true, name: true }
          }
        }
      }),
      db.product.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - إنشاء منتج جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      companyId, name, sku, description, unit, costPrice, sellPrice, minPrice, barcode,
      salesCommission, salesCommissionType, categoryId,
      openingBalance 
    } = body

    // التحقق من وجود الشركة
    const company = await db.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'الشركة غير موجودة' },
        { status: 400 }
      )
    }

    // التحقق من عدم تكرار SKU في نفس الشركة
    const existingProduct = await db.product.findFirst({
      where: { companyId, sku }
    })

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'كود المنتج موجود مسبقاً في هذه الشركة' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        companyId,
        name,
        nameAr: name,
        sku,
        description,
        unit: unit || 'piece',
        costPrice: costPrice || 0,
        sellPrice: sellPrice || 0,
        minPrice,
        barcode,
        categoryId: categoryId || null,
        salesCommission: salesCommission || 0,
        salesCommissionType: salesCommissionType || 'PERCENTAGE',
        active: true
      },
      include: {
        Company: {
          select: { id: true, name: true }
        }
      }
    })

    // معالجة الرصيد الافتتاحي للمخزون
    if (openingBalance && openingBalance.quantity > 0 && openingBalance.warehouseId) {
      // إنشاء سجل المخزون
      await db.inventory.create({
        data: {
          productId: product.id,
          warehouseId: openingBalance.warehouseId,
          quantity: openingBalance.quantity,
          minQuantity: 0,
        }
      })

      // إنشاء حركة مخزون للرصيد الافتتاحي
      await db.inventoryMovement.create({
        data: {
          productId: product.id,
          warehouseId: openingBalance.warehouseId,
          type: 'IN',
          quantity: openingBalance.quantity,
          referenceType: 'OPENING_BALANCE',
          referenceId: product.id,
          notes: `رصيد افتتاحي - القيمة الإجمالية: ${openingBalance.totalValue} - سعر الوحدة: ${openingBalance.unitPrice}`
        }
      })
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
