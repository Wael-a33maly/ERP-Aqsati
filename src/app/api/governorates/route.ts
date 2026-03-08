import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET - جلب جميع المحافظات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const active = searchParams.get('active')

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (active !== null) where.active = active === 'true'

    const governorates = await db.governorate.findMany({
      where,
      include: {
        City: {
          select: { id: true }
        },
        _count: {
          select: { Customer: true }
        }
      },
      orderBy: { nameAr: 'asc' }
    })

    // تحويل البيانات لشكل متوافق مع frontend
    const data = governorates.map(gov => ({
      ...gov,
      _count: {
        cities: gov.City.length,
        customers: gov._count.Customer
      },
      City: undefined
    }))

    return successResponse(data)
  } catch (error) {
    console.error('Error fetching governorates:', error)
    return errorResponse('فشل في جلب المحافظات', 500)
  }
}

// POST - إنشاء محافظة جديدة
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // التحقق من عدم وجود كود مكرر
    const existing = await db.governorate.findFirst({
      where: { 
        companyId: data.companyId,
        code: data.code 
      }
    })

    if (existing) {
      return errorResponse('كود المحافظة موجود مسبقاً', 400)
    }

    const governorate = await db.governorate.create({
      data: {
        name: data.name,
        nameAr: data.nameAr || data.name,
        code: data.code,
        companyId: data.companyId,
        active: data.active ?? true,
      }
    })

    return successResponse(governorate, 'تم إنشاء المحافظة بنجاح', 201)
  } catch (error) {
    console.error('Error creating governorate:', error)
    return errorResponse('فشل في إنشاء المحافظة', 500)
  }
}
