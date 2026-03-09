import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع الفروع
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
          { code: { contains: search } },
        ]
      }),
      ...(companyId && { companyId }),
      ...(active !== null && { active: active === 'true' })
    }

    const [branches, total] = await Promise.all([
      db.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Company: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { User: true, Customer: true }
          }
        }
      }),
      db.branch.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: branches,
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

// POST - إنشاء فرع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, name, code, address, phone, isMain } = body

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

    // التحقق من عدم تكرار الكود في نفس الشركة
    const existingBranch = await db.branch.findFirst({
      where: { companyId, code }
    })

    if (existingBranch) {
      return NextResponse.json(
        { success: false, error: 'كود الفرع موجود مسبقاً في هذه الشركة' },
        { status: 400 }
      )
    }

    // إذا كان الفرع الرئيسي، إلغاء تعيين الفرع الرئيسي السابق
    if (isMain) {
      await db.branch.updateMany({
        where: { companyId, isMain: true },
        data: { isMain: false }
      })
    }

    const branch = await db.branch.create({
      data: {
        companyId,
        name,
        nameAr: name,
        code,
        address,
        phone,
        isMain: isMain || false,
        active: true
      },
      include: {
        Company: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: branch })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
