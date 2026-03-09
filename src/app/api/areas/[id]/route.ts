import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET - جلب منطقة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const area = await db.area.findUnique({
      where: { id },
      include: {
        city: {
          select: { 
            id: true, 
            name: true, 
            nameAr: true,
            governorate: {
              select: { id: true, name: true, nameAr: true }
            }
          }
        },
        _count: {
          select: { customers: true }
        }
      }
    })

    if (!area) {
      return errorResponse('المنطقة غير موجودة', 404)
    }

    return successResponse(area)
  } catch (error) {
    console.error('Error fetching area:', error)
    return errorResponse('فشل في جلب المنطقة', 500)
  }
}

// PUT - تحديث منطقة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // التحقق من وجود المنطقة
    const existing = await db.area.findUnique({
      where: { id }
    })

    if (!existing) {
      return errorResponse('المنطقة غير موجودة', 404)
    }

    // التحقق من عدم تكرار الكود
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await db.area.findFirst({
        where: {
          companyId: data.companyId || existing.companyId,
          code: data.code,
          id: { not: id }
        }
      })

      if (duplicateCode) {
        return errorResponse('كود المنطقة موجود مسبقاً', 400)
      }
    }

    const area = await db.area.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        code: data.code,
        cityId: data.cityId,
        active: data.active,
      },
      include: {
        city: {
          select: { 
            id: true, 
            name: true,
            governorate: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    return successResponse(area, 'تم تحديث المنطقة بنجاح')
  } catch (error) {
    console.error('Error updating area:', error)
    return errorResponse('فشل في تحديث المنطقة', 500)
  }
}

// DELETE - حذف منطقة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // التحقق من وجود المنطقة
    const existing = await db.area.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    })

    if (!existing) {
      return errorResponse('المنطقة غير موجودة', 404)
    }

    // التحقق من عدم وجود عملاء مرتبطين
    if (existing._count.customers > 0) {
      return errorResponse('لا يمكن حذف المنطقة لوجود عملاء مرتبطين بها', 400)
    }

    // حذف المنطقة
    await db.area.delete({
      where: { id }
    })

    return successResponse(null, 'تم حذف المنطقة بنجاح')
  } catch (error) {
    console.error('Error deleting area:', error)
    return errorResponse('فشل في حذف المنطقة', 500)
  }
}
