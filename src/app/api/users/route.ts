import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

// GET - جلب جميع المستخدمين
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId')
    const branchId = searchParams.get('branchId')
    const role = searchParams.get('role')
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // فلترة البيانات حسب صلاحيات المستخدم
    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ]
      }),
      ...(role && { role }),
      ...(active !== null && { active: active === 'true' })
    }

    // إذا كان المستخدم مصادق عليه ومدير شركة، يرى فقط مستخدمين شركته
    if (currentUser && !isSuperAdmin(currentUser) && currentUser.companyId) {
      where.companyId = currentUser.companyId
    } else if (currentUser && companyId) {
      where.companyId = companyId
    }

    if (branchId) {
      where.branchId = branchId
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          active: true,
          createdAt: true,
          // استخدام أسماء العلاقات الصحيحة (حرف كبير)
          Company: {
            select: { id: true, name: true }
          },
          Branch: {
            select: { id: true, name: true }
          }
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: users,
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

// POST - إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, password, role, companyId, branchId, phone } = body

    // منع مدير الشركة من إنشاء مستخدم بصلاحية مدير النظام
    if (!isSuperAdmin(currentUser) && role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بإنشاء مستخدم بصلاحية مدير النظام' },
        { status: 403 }
      )
    }

    // التحقق من عدم تكرار البريد
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' },
        { status: 400 }
      )
    }

    // مدير الشركة لا يمكنه إنشاء مستخدمين لشركات أخرى
    let finalCompanyId = companyId
    if (!isSuperAdmin(currentUser)) {
      finalCompanyId = currentUser.companyId
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'AGENT',
        phone,
        companyId: finalCompanyId || null,
        branchId: branchId || null,
        active: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        Company: {
          select: { id: true, name: true }
        },
        Branch: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث مستخدم
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
    const { id, role, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // جلب المستخدم المراد تعديله
    const targetUser = await db.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // منع مدير الشركة من تعديل مستخدمي مدير النظام
    if (!isSuperAdmin(currentUser) && targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل مستخدم بصلاحية مدير النظام' },
        { status: 403 }
      )
    }

    // منع مدير الشركة من ترقية مستخدم إلى مدير نظام
    if (!isSuperAdmin(currentUser) && role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بمنح صلاحية مدير النظام' },
        { status: 403 }
      )
    }

    // مدير الشركة لا يمكنه تعديل مستخدمين من شركات أخرى
    if (!isSuperAdmin(currentUser) && targetUser.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل هذا المستخدم' },
        { status: 403 }
      )
    }

    // تحديث البيانات
    const updatePayload: any = {
      ...updateData,
      updatedAt: new Date()
    }

    if (role) {
      updatePayload.role = role
    }

    const user = await db.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        Company: {
          select: { id: true, name: true }
        },
        Branch: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - حذف مستخدم
export async function DELETE(request: NextRequest) {
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // جلب المستخدم المراد حذفه
    const targetUser = await db.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // منع مدير الشركة من حذف مستخدمي مدير النظام
    if (!isSuperAdmin(currentUser) && targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف مستخدم بصلاحية مدير النظام' },
        { status: 403 }
      )
    }

    // مدير الشركة لا يمكنه حذف مستخدمين من شركات أخرى
    if (!isSuperAdmin(currentUser) && targetUser.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف هذا المستخدم' },
        { status: 403 }
      )
    }

    // منع حذف النفس
    if (currentUser.id === id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
