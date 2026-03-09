import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

// GET - جلب مستخدم واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        company: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // مدير الشركة لا يمكنه رؤية مستخدمين من شركات أخرى
    if (!isSuperAdmin(currentUser) && user.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول لهذا المستخدم' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, password, role, companyId, branchId, phone, active } = body

    const user = await db.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // منع مدير الشركة من تعديل مستخدمي مدير النظام
    if (!isSuperAdmin(currentUser) && user.role === 'SUPER_ADMIN') {
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
    if (!isSuperAdmin(currentUser) && user.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل هذا المستخدم' },
        { status: 403 }
      )
    }

    // التحقق من عدم تكرار البريد
    if (email) {
      const existingUser = await db.user.findFirst({
        where: { email, NOT: { id } }
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' },
          { status: 400 }
        )
      }
    }

    // تشفير كلمة المرور إذا تم تحديثها
    let hashedPassword: string | undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(role && { role }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(phone !== undefined && { phone }),
        ...(active !== undefined && { active })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        company: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - حذف مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { id } = await params

    // منع حذف النفس
    if (currentUser.id === id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // منع مدير الشركة من حذف مستخدمي مدير النظام
    if (!isSuperAdmin(currentUser) && user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف مستخدم بصلاحية مدير النظام' },
        { status: 403 }
      )
    }

    // مدير الشركة لا يمكنه حذف مستخدمين من شركات أخرى
    if (!isSuperAdmin(currentUser) && user.companyId !== currentUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بحذف هذا المستخدم' },
        { status: 403 }
      )
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
