import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب شركة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { branches: true, users: true, customers: true, products: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'الشركة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: company })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث شركة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, email, phone, address, taxNumber, active } = body

    // التحقق من عدم تكرار الكود
    if (code) {
      const existingCompany = await db.company.findFirst({
        where: { code, NOT: { id } }
      })

      if (existingCompany) {
        return NextResponse.json(
          { success: false, error: 'كود الشركة موجود مسبقاً' },
          { status: 400 }
        )
      }
    }

    const company = await db.company.update({
      where: { id },
      data: {
        ...(name && { name, nameAr: name }),
        ...(code && { code }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(taxNumber !== undefined && { taxNumber }),
        ...(active !== undefined && { active })
      }
    })

    return NextResponse.json({ success: true, data: company })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - حذف شركة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من وجود بيانات مرتبطة
    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { branches: true, users: true, customers: true, products: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'الشركة غير موجودة' },
        { status: 404 }
      )
    }

    if (company._count.branches > 0 || company._count.users > 0 || 
        company._count.customers > 0 || company._count.products > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الشركة لوجود بيانات مرتبطة بها' },
        { status: 400 }
      )
    }

    await db.company.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف الشركة بنجاح' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
