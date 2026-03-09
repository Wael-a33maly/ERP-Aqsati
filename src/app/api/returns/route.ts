import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { returnNumber: { contains: search } },
        { customer: { name: { contains: search } } }
      ]
    }
    if (status) {
      where.status = status
    }

    const [returns, total] = await Promise.all([
      db.return.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          branch: { select: { id: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          items: { select: { id: true, total: true } }
        }
      }),
      db.return.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: returns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب المرتجعات' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // توليد رقم مرتجع جديد بالتنسيق الصحيح: RTN-YYYY-NNNNNN
    const year = new Date().getFullYear()
    const prefixPattern = `RTN-${year}-`

    const lastReturn = await db.return.findFirst({
      where: {
        returnNumber: { startsWith: prefixPattern }
      },
      orderBy: { returnNumber: 'desc' },
      select: { returnNumber: true }
    })

    let sequence = 1
    if (lastReturn) {
      const parts = lastReturn.returnNumber.split('-')
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10)
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1
        }
      }
    }

    const returnNumber = `RTN-${year}-${String(sequence).padStart(6, '0')}`

    const returnRecord = await db.return.create({
      data: {
        returnNumber,
        customerId: data.customerId,
        branchId: data.branchId,
        invoiceId: data.invoiceId,
        agentId: data.agentId,
        type: data.type || 'PARTIAL',
        reason: data.reason,
        total: data.total || 0,
        status: 'pending'
      }
    })

    return NextResponse.json({ success: true, data: returnRecord })
  } catch (error) {
    console.error('Error creating return:', error)
    return NextResponse.json({ success: false, error: 'فشل في إنشاء المرتجع' }, { status: 500 })
  }
}
