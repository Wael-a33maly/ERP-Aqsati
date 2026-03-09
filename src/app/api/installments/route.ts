import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const companyIdParam = searchParams.get('companyId') || ''

    const skip = (page - 1) * limit

    // بناء الفلتر مع دعم فصل الشركات
    const where: Record<string, unknown> = {}
    
    // إضافة فلتر الشركة
    if (companyIdParam) {
      where.companyId = companyIdParam
    }
    
    if (search) {
      where.OR = [
        { contractNumber: { contains: search } },
        { customer: { name: { contains: search } } }
      ]
    }
    if (status) {
      where.status = status
    }

    const [contracts, total] = await Promise.all([
      db.installmentContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true, companyId: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          installments: {
            select: { id: true, status: true, amount: true, paidAmount: true, dueDate: true },
            orderBy: { installmentNumber: 'asc' }
          }
        }
      }),
      db.installmentContract.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: contracts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching installments:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب الأقساط' }, { status: 500 })
  }
}
