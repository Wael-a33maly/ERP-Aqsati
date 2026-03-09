import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع التصنيفات
export async function GET(request: NextRequest) {
  try {
    const categories = await db.receiptTemplateCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { globalTemplates: true }
        }
      }
    })

    // إضافة معلومات إضافية
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      templateCount: cat._count.globalTemplates
    }))

    return NextResponse.json({
      success: true,
      data: categoriesWithCount
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات' },
      { status: 500 }
    )
  }
}

// POST - إنشاء تصنيف جديد (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, nameAr, code, icon, sortOrder } = body

    if (!name || !nameAr || !code) {
      return NextResponse.json(
        { success: false, error: 'الاسم والكود مطلوبان' },
        { status: 400 }
      )
    }

    // التحقق من عدم وجود الكود مسبقاً
    const existing = await db.receiptTemplateCategory.findUnique({
      where: { code }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'الكود مستخدم مسبقاً' },
        { status: 400 }
      )
    }

    const category = await db.receiptTemplateCategory.create({
      data: {
        name,
        nameAr,
        code,
        icon: icon || null,
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: category,
      message: 'تم إنشاء التصنيف بنجاح'
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء التصنيف' },
      { status: 500 }
    )
  }
}
