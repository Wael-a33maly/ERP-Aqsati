import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

// GET - جلب جميع الشركات أو شركة واحدة
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    // إذا تم تحديد معرف الشركة، أرجع الشركة الواحدة مع الإعدادات
    if (id) {
      // مدير الشركة يمكنه رؤية شركته فقط
      if (!isSuperAdmin(currentUser)) {
        if (id !== currentUser.companyId) {
          return NextResponse.json(
            { success: false, error: 'غير مصرح لك بالوصول لهذه الشركة' },
            { status: 403 }
          )
        }
      }

      const company = await db.company.findUnique({
        where: { id },
        include: {
          _count: {
            select: { Branch: true, User: true, Customer: true, Product: true }
          }
        }
      })
      
      if (!company) {
        return NextResponse.json(
          { success: false, error: 'الشركة غير موجودة' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({ success: true, data: company })
    }

    // مدير الشركة يرى شركته فقط
    if (!isSuperAdmin(currentUser)) {
      if (currentUser.companyId) {
        const company = await db.company.findUnique({
          where: { id: currentUser.companyId },
          include: {
            _count: {
              select: { Branch: true, User: true, Customer: true, Product: true }
            }
          }
        })
        return NextResponse.json({
          success: true,
          data: company ? [company] : [],
          pagination: {
            page: 1,
            limit: 1,
            total: company ? 1 : 0,
            totalPages: 1
          }
        })
      }
    }
    
    const search = searchParams.get('search') || ''
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { email: { contains: search } },
        ]
      }),
      ...(active !== null && { active: active === 'true' })
    }

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { Branch: true, User: true, Customer: true, Product: true }
          }
        }
      }),
      db.company.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: companies,
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

// POST - إنشاء شركة جديدة (مدير النظام فقط)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    // التحقق من صلاحية مدير النظام
    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بإنشاء شركة جديدة. هذه الميزة متاحة فقط لمدير النظام' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, code, email, phone, address, taxNumber, discountEnabled, taxRate, currency } = body

    // التحقق من عدم تكرار الكود
    const existingCompany = await db.company.findUnique({
      where: { code }
    })

    if (existingCompany) {
      return NextResponse.json(
        { success: false, error: 'كود الشركة موجود مسبقاً' },
        { status: 400 }
      )
    }

    const company = await db.company.create({
      data: {
        name,
        nameAr: name,
        code,
        email,
        phone,
        address,
        taxNumber,
        discountEnabled: discountEnabled ?? true,
        taxRate: taxRate ?? 15,
        currency: currency ?? 'SAR',
        active: true
      }
    })

    return NextResponse.json({ success: true, data: company })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث شركة
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الشركة مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من وجود الشركة
    const existingCompany = await db.company.findUnique({
      where: { id }
    })

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: 'الشركة غير موجودة' },
        { status: 404 }
      )
    }

    // مدير الشركة يمكنه تعديل شركته فقط (ولكن لا يمكنه تغيير الكود أو الإلغاء)
    if (!isSuperAdmin(currentUser)) {
      if (id !== currentUser.companyId) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح لك بتعديل هذه الشركة' },
          { status: 403 }
        )
      }
      
      // منع مدير الشركة من تغيير الكود أو إلغاء الشركة
      delete updateData.code
      delete updateData.active
    }

    // تحديث البيانات
    const company = await db.company.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, data: company })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - حذف شركة (مدير النظام فقط)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    // التحقق من صلاحية مدير النظام
    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف الشركة. هذه الميزة متاحة فقط لمدير النظام' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الشركة مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من وجود الشركة
    const existingCompany = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Branch: true, User: true, Customer: true, Invoice: true }
        }
      }
    })

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: 'الشركة غير موجودة' },
        { status: 404 }
      )
    }

    // التحقق من عدم وجود بيانات مرتبطة
    if (existingCompany._count.Branch > 0 || existingCompany._count.User > 0 || 
        existingCompany._count.Customer > 0 || existingCompany._count.Invoice > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الشركة لوجود بيانات مرتبطة بها' },
        { status: 400 }
      )
    }

    await db.company.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'تم حذف الشركة بنجاح' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
