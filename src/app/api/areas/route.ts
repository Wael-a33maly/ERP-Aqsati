import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET - جلب جميع المناطق
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const cityId = searchParams.get('cityId')
    const active = searchParams.get('active')

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (cityId) where.cityId = cityId
    if (active !== null) where.active = active === 'true'

    const areas = await db.area.findMany({
      where,
      include: {
        City: {
          select: { 
            id: true, 
            name: true, 
            nameAr: true,
            Governorate: {
              select: { id: true, name: true, nameAr: true }
            }
          }
        },
        _count: {
          select: { Customer: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // تحويل البيانات لشكل متوافق مع frontend
    const data = areas.map(area => ({
      ...area,
      city: area.City ? {
        ...area.City,
        governorate: area.City.Governorate
      } : null,
      _count: {
        customers: area._count.Customer
      },
      City: undefined
    }))

    return successResponse(data)
  } catch (error) {
    console.error('Error fetching areas:', error)
    return errorResponse('فشل في جلب المناطق', 500)
  }
}

// POST - إنشاء منطقة جديدة
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // التحقق من عدم وجود كود مكرر
    const existing = await db.area.findFirst({
      where: { 
        companyId: data.companyId,
        code: data.code 
      }
    })

    if (existing) {
      return errorResponse('كود المنطقة موجود مسبقاً', 400)
    }

    const area = await db.area.create({
      data: {
        name: data.name,
        nameAr: data.nameAr || data.name,
        code: data.code,
        companyId: data.companyId,
        cityId: data.cityId,
        active: data.active ?? true,
      },
      include: {
        City: {
          select: { 
            id: true, 
            name: true,
            nameAr: true,
            Governorate: {
              select: { id: true, name: true, nameAr: true }
            }
          }
        }
      }
    })

    return successResponse(area, 'تم إنشاء المنطقة بنجاح', 201)
  } catch (error) {
    console.error('Error creating area:', error)
    return errorResponse('فشل في إنشاء المنطقة', 500)
  }
}
