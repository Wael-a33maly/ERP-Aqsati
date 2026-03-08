import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب مورد محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        PurchaseInvoice: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        PurchaseReturn: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        SupplierPayment: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        SupplierTransaction: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'المورد غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المورد' },
      { status: 500 }
    )
  }
}

// PUT - تحديث مورد
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        phone: data.phone,
        phone2: data.phone2,
        email: data.email,
        address: data.address,
        city: data.city,
        taxNumber: data.taxNumber,
        commercialReg: data.commercialReg,
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
        currency: data.currency,
        notes: data.notes,
        active: data.active
      }
    })

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المورد' },
      { status: 500 }
    )
  }
}

// DELETE - حذف مورد
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من عدم وجود فواتير مرتبطة
    const invoicesCount = await db.purchaseInvoice.count({
      where: { supplierId: id }
    })

    if (invoicesCount > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف المورد لوجود فواتير مشتريات مرتبطة' },
        { status: 400 }
      )
    }

    await db.supplier.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف المورد بنجاح' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المورد' },
      { status: 500 }
    )
  }
}
