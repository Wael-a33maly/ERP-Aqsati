import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET - جلب محافظة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const governorate = await db.governorate.findUnique({
      where: { id },
      include: {
        cities: {
          include: {
            _count: { select: { areas: true } }
          }
        },
        _count: {
          select: { cities: true, customers: true }
        }
      }
    })

    if (!governorate) {
      return errorResponse('المحافظة غير موجودة', 404)
    }

    return successResponse(governorate)
  } catch (error) {
    console.error('Error fetching governorate:', error)
    return errorResponse('فشل في جلب المحافظة', 500)
  }
}

// PUT - تحديث محافظة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // التحقق من وجود المحافظة
    const existing = await db.governorate.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('المحافظة غير موجودة', 404)
    }

    // التحقق من عدم تكرار الكود
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await db.governorate.findFirst({
        where: {
          companyId: data.companyId || existing.companyId,
          code: data.code,
          id: { not: id }
        }
      })

      if (duplicateCode) {
        return errorResponse('كود المحافظة موجود مسبقاً', 400)
      }
    }

    const governorate = await db.governorate.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        code: data.code,
        active: data.active,
      }
    })

    return successResponse(governorate, 'تم تحديث المحافظة بنجاح')
  } catch (error) {
    console.error('Error updating governorate:', error)
    return errorResponse('فشل في تحديث المحافظة', 500)
  }
}

// DELETE - حذف محافظة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من وجود المحافظة
    const existing = await db.governorate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    })

    if (!existing) {
      return errorResponse('المحافظة غير موجودة', 404)
    }

    // التحقق من عدم وجود عملاء مرتبطين
    if (existing._count.customers > 0) {
      return errorResponse('لا يمكن حذف المحافظة لوجود عملاء مرتبطين بها', 400)
    }

    // حذف المحافظة (سيتم حذف المدن والمناطق تلقائياً بسبب onDelete: Cascade)
    await db.governorate.delete({
      where: { id }
    })

    return successResponse(null, 'تم حذف المحافظة بنجاح')
  } catch (error) {
    console.error('Error deleting governorate:', error)
    return errorResponse('فشل في حذف المحافظة', 500)
  }
}
