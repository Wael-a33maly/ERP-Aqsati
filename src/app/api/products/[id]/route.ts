import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب منتج واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث منتج
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, sku, description, unit, costPrice, sellPrice, minPrice, barcode, active } = body

    const product = await db.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من عدم تكرار SKU
    if (sku) {
      const existingProduct = await db.product.findFirst({
        where: { sku, companyId: product.companyId, NOT: { id } }
      })

      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'كود المنتج موجود مسبقاً في هذه الشركة' },
          { status: 400 }
        )
      }
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        ...(name && { name, nameAr: name }),
        ...(sku && { sku }),
        ...(description !== undefined && { description }),
        ...(unit && { unit }),
        ...(costPrice !== undefined && { costPrice }),
        ...(sellPrice !== undefined && { sellPrice }),
        ...(minPrice !== undefined && { minPrice }),
        ...(barcode !== undefined && { barcode }),
        ...(active !== undefined && { active })
      },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedProduct })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - حذف منتج
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoiceItems: true, inventory: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      )
    }

    if (product._count.invoiceItems > 0 || product._count.inventory > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف المنتج لوجود بيانات مرتبطة به' },
        { status: 400 }
      )
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف المنتج بنجاح' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
