import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب فرع واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { users: true, customers: true }
        }
      }
    })

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'الفرع غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: branch })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث فرع
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, address, phone, isMain, active } = body

    const branch = await db.branch.findUnique({
      where: { id }
    })

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'الفرع غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من عدم تكرار الكود
    if (code) {
      const existingBranch = await db.branch.findFirst({
        where: { code, companyId: branch.companyId, NOT: { id } }
      })

      if (existingBranch) {
        return NextResponse.json(
          { success: false, error: 'كود الفرع موجود مسبقاً في هذه الشركة' },
          { status: 400 }
        )
      }
    }

    // إذا كان الفرع الرئيسي، إلغاء تعيين الفرع الرئيسي السابق
    if (isMain) {
      await db.branch.updateMany({
        where: { companyId: branch.companyId, isMain: true, NOT: { id } },
        data: { isMain: false }
      })
    }

    const updatedBranch = await db.branch.update({
      where: { id },
      data: {
        ...(name && { name, nameAr: name }),
        ...(code && { code }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(isMain !== undefined && { isMain }),
        ...(active !== undefined && { active })
      },
      include: {
        company: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedBranch })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - حذف فرع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من وجود بيانات مرتبطة
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, customers: true }
        }
      }
    })

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'الفرع غير موجود' },
        { status: 404 }
      )
    }

    if (branch._count.users > 0 || branch._count.customers > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الفرع لوجود بيانات مرتبطة به' },
        { status: 400 }
      )
    }

    await db.branch.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف الفرع بنجاح' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
