import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب عميل واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: customer })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث عميل
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, phone, phone2, email, address, nationalId, creditLimit, notes, active, branchId } = body

    const customer = await db.customer.findUnique({
      where: { id }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من عدم تكرار الكود
    if (code) {
      const existingCustomer = await db.customer.findFirst({
        where: { code, companyId: customer.companyId, NOT: { id } }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'كود العميل موجود مسبقاً في هذه الشركة' },
          { status: 400 }
        )
      }
    }

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: {
        ...(name && { name, nameAr: name }),
        ...(code && { code }),
        ...(phone !== undefined && { phone }),
        ...(phone2 !== undefined && { phone2 }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(nationalId !== undefined && { nationalId }),
        ...(creditLimit !== undefined && { creditLimit }),
        ...(notes !== undefined && { notes }),
        ...(active !== undefined && { active }),
        ...(branchId !== undefined && { branchId: branchId || null })
      },
      include: {
        company: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedCustomer })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - حذف عميل
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true, payments: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    if (customer._count.invoices > 0 || customer._count.payments > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف العميل لوجود بيانات مرتبطة به' },
        { status: 400 }
      )
    }

    await db.customer.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف العميل بنجاح' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
