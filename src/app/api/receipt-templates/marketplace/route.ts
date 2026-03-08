import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع قوالب المتجر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const isFree = searchParams.get('isFree')
    const isFeatured = searchParams.get('isFeatured')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'sortOrder'
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // بناء شروط البحث
    const where: any = { active: true }

    if (category) {
      where.category = { code: category }
    }

    if (type) {
      where.templateType = type
    }

    if (isFree !== null) {
      where.isFree = isFree === 'true'
    }

    if (isFeatured === 'true') {
      where.isFeatured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { description: { contains: search } },
        { descriptionAr: { contains: search } }
      ]
    }

    // ترتيب النتائج
    let orderBy: any = {}
    switch (sortBy) {
      case 'popular':
        orderBy = { installCount: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'price_low':
        orderBy = { price: 'asc' }
        break
      case 'price_high':
        orderBy = { price: 'desc' }
        break
      default:
        orderBy = [{ isFeatured: 'desc' }, { sortOrder: 'asc' }]
    }

    const [templates, total] = await Promise.all([
      db.globalReceiptTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, nameAr: true, code: true, icon: true }
          }
        }
      }),
      db.globalReceiptTemplate.count({ where })
    ])

    // إضافة معلومات إضافية لكل قالب
    const templatesWithStats = templates.map(template => ({
      ...template,
      priceFormatted: template.isFree ? 'مجاني' : `${template.price} ${template.currency}`,
      ratingAvg: template.ratingCount > 0 
        ? (template.rating / template.ratingCount).toFixed(1) 
        : '0.0',
      paperSizeLabel: getPaperSizeLabel(template.paperSize),
      templateTypeLabel: getTemplateTypeLabel(template.templateType)
    }))

    return NextResponse.json({
      success: true,
      data: templatesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching marketplace templates:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب قوالب المتجر' },
      { status: 500 }
    )
  }
}

// POST - تثبيت قالب من المتجر للشركة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { globalTemplateId, companyId, branchId, makeDefault } = body

    if (!globalTemplateId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'معرف القالب والشركة مطلوبان' },
        { status: 400 }
      )
    }

    // جلب القالب الأصلي
    const globalTemplate = await db.globalReceiptTemplate.findUnique({
      where: { id: globalTemplateId }
    })

    if (!globalTemplate) {
      return NextResponse.json(
        { success: false, error: 'القالب غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من عدم تثبيت القالب مسبقاً
    const existingInstall = await db.companyReceiptTemplate.findFirst({
      where: {
        companyId,
        installedFromMarketplace: globalTemplateId
      }
    })

    if (existingInstall) {
      return NextResponse.json(
        { success: false, error: 'القالب مثبت مسبقاً' },
        { status: 400 }
      )
    }

    // إذا كان سيكون افتراضي، إلغاء الافتراضي السابق
    if (makeDefault) {
      await db.companyReceiptTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false }
      })
    }

    // إنشاء نسخة للشركة
    const companyTemplate = await db.companyReceiptTemplate.create({
      data: {
        companyId,
        branchId: branchId || null,
        name: globalTemplate.name,
        nameAr: globalTemplate.nameAr,
        code: `${globalTemplate.code}-${Date.now()}`,
        templateJson: globalTemplate.templateJson,
        isDefault: makeDefault || false,
        installedFromMarketplace: globalTemplateId,
        paperSize: globalTemplate.paperSize,
        customWidth: globalTemplate.customWidth,
        customHeight: globalTemplate.customHeight
      }
    })

    // تحديث عداد التثبيتات
    await db.globalReceiptTemplate.update({
      where: { id: globalTemplateId },
      data: { installCount: { increment: 1 } }
    })

    return NextResponse.json({
      success: true,
      data: companyTemplate,
      message: 'تم تثبيت القالب بنجاح'
    })
  } catch (error) {
    console.error('Error installing template:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تثبيت القالب' },
      { status: 500 }
    )
  }
}

// دوال مساعدة
function getPaperSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    'A4': 'A4 كامل',
    'A4_THIRD': 'ثلث A4',
    'A5': 'A5',
    'THERMAL_80': 'حراري 80 مم',
    'CUSTOM': 'مخصص'
  }
  return labels[size] || size
}

function getTemplateTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'thermal': 'حراري',
    'standard': 'قياسي',
    'professional': 'احترافي',
    'minimal': 'بسيط',
    'official': 'رسمي'
  }
  return labels[type] || type
}
