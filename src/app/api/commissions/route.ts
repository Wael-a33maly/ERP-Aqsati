import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [commissions, total] = await Promise.all([
      db.agentCommission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { 
            select: { id: true, name: true, email: true } 
          },
          policy: { 
            select: { id: true, name: true, type: true } 
          }
        }
      }),
      db.agentCommission.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: commissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب العمولات' }, { status: 500 })
  }
}
