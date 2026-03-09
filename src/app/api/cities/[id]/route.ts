import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET - جلب مدينة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const city = await db.city.findUnique({
      where: { id },
      include: {
        Governorate: {
          select: { id: true, name: true, nameAr: true }
        },
        Area: true,
        _count: {
          select: { Customer: true }
        }
      }
    })

    if (!city) {
      return errorResponse('المدينة غير موجودة', 404)
    }

    return successResponse(city)
  } catch (error) {
    console.error('Error fetching city:', error)
    return errorResponse('فشل في جلب المدينة', 500)
  }
}

// PUT - تحديث مدينة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // التحقق من وجود المدينة
    const existing = await db.city.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('المدينة غير موجودة', 404)
    }

    // التحقق من عدم تكرار الكود
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await db.city.findFirst({
        where: {
          companyId: data.companyId || existing.companyId,
          code: data.code,
          id: { not: id }
        }
      })

      if (duplicateCode) {
        return errorResponse('كود المدينة موجود مسبقاً', 400)
      }
    }

    const city = await db.city.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        code: data.code,
        governorateId: data.governorateId,
        active: data.active,
      },
      include: {
        Governorate: {
          select: { id: true, name: true, nameAr: true }
        }
      }
    })

    return successResponse(city, 'تم تحديث المدينة بنجاح')
  } catch (error) {
    console.error('Error updating city:', error)
    return errorResponse('فشل في تحديث المدينة', 500)
  }
}

// DELETE - حذف مدينة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من وجود المدينة
    const existing = await db.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    })

    if (!existing) {
      return errorResponse('المدينة غير موجودة', 404)
    }

    // التحقق من عدم وجود عملاء مرتبطين
    if (existing._count.customers > 0) {
      return errorResponse('لا يمكن حذف المدينة لوجود عملاء مرتبطين بها', 400)
    }

    // حذف المدينة (سيتم حذف المناطق تلقائياً بسبب onDelete: Cascade)
    await db.city.delete({
      where: { id }
    })

    return successResponse(null, 'تم حذف المدينة بنجاح')
  } catch (error) {
    console.error('Error deleting city:', error)
    return errorResponse('فشل في حذف المدينة', 500)
  }
}
