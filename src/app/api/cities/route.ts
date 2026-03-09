import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET - جلب جميع المدن
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const governorateId = searchParams.get('governorateId')
    const active = searchParams.get('active')

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (governorateId) where.governorateId = governorateId
    if (active !== null) where.active = active === 'true'

    const cities = await db.city.findMany({
      where,
      include: {
        Governorate: {
          select: { id: true, name: true, nameAr: true }
        },
        Area: {
          select: { id: true }
        },
        _count: {
          select: { Customer: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // تحويل البيانات لشكل متوافق مع frontend
    const data = cities.map(city => ({
      ...city,
      governorate: city.Governorate,
      _count: {
        areas: city.Area.length,
        customers: city._count.Customer
      },
      Area: undefined,
      Governorate: undefined
    }))

    return successResponse(data)
  } catch (error) {
    console.error('Error fetching cities:', error)
    return errorResponse('فشل في جلب المدن', 500)
  }
}

// POST - إنشاء مدينة جديدة
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // التحقق من عدم وجود كود مكرر
    const existing = await db.city.findFirst({
      where: { 
        companyId: data.companyId,
        code: data.code 
      }
    })

    if (existing) {
      return errorResponse('كود المدينة موجود مسبقاً', 400)
    }

    const city = await db.city.create({
      data: {
        name: data.name,
        nameAr: data.nameAr || data.name,
        code: data.code,
        companyId: data.companyId,
        governorateId: data.governorateId,
        active: data.active ?? true,
      },
      include: {
        Governorate: {
          select: { id: true, name: true, nameAr: true }
        }
      }
    })

    return successResponse(city, 'تم إنشاء المدينة بنجاح', 201)
  } catch (error) {
    console.error('Error creating city:', error)
    return errorResponse('فشل في إنشاء المدينة', 500)
  }
}
