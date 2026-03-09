import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ]
    }
    if (companyId) {
      where.companyId = companyId
    }

    const [zones, total] = await Promise.all([
      db.zone.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Company: { select: { id: true, name: true } },
          Branch: { select: { id: true, name: true } },
          _count: { select: { Customer: true } }
        }
      }),
      db.zone.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: zones,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب المناطق' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const zone = await db.zone.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        companyId: data.companyId,
        branchId: data.branchId || null,
        active: true
      }
    })

    return NextResponse.json({ success: true, data: zone })
  } catch (error) {
    console.error('Error creating zone:', error)
    return NextResponse.json({ success: false, error: 'فشل في إنشاء المنطقة' }, { status: 500 })
  }
}
