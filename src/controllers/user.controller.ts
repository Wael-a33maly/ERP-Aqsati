/**
 * User Controller
 * متحكم المستخدمين
 */

import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/services/user.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'
import type { UserInput, UserUpdateInput } from '@/models/user.model'

export const userController = {
  async getUsers(request: NextRequest) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)

      // تحديد companyId بناءً على صلاحيات المستخدم
      let companyId = searchParams.get('companyId') || undefined
      if (!isSuperAdmin(currentUser) && currentUser.companyId) {
        companyId = currentUser.companyId
      }

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        companyId,
        branchId: searchParams.get('branchId') || undefined,
        role: searchParams.get('role') || undefined,
        active: searchParams.get('active') === 'true' ? true : 
                searchParams.get('active') === 'false' ? false : undefined
      }

      const result = await userService.getUsers(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getUserById(request: NextRequest, id: string) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const user = await userService.getUserById(id)
      return NextResponse.json({ success: true, data: user })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
  },

  async createUser(request: NextRequest) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()

      // منع مدير الشركة من إنشاء super admin
      if (!isSuperAdmin(currentUser) && body.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'غير مصرح لك بإنشاء مستخدم بصلاحية مدير النظام' },
          { status: 403 }
        )
      }

      // تحديد companyId
      const companyId = isSuperAdmin(currentUser) 
        ? body.companyId 
        : currentUser.companyId

      const userData: UserInput = {
        ...body,
        companyId
      }

      const user = await userService.createUser(userData, currentUser.id)
      return NextResponse.json({ success: true, data: user })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async updateUser(request: NextRequest, id: string) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const targetUser = await userService.getUserById(id)

      // منع مدير الشركة من تعديل super admin
      if (!isSuperAdmin(currentUser) && targetUser.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'غير مصرح لك بتعديل مستخدم بصلاحية مدير النظام' },
          { status: 403 }
        )
      }

      // منع مدير الشركة من ترقية مستخدم إلى super admin
      if (!isSuperAdmin(currentUser) && body.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'غير مصرح لك بمنح صلاحية مدير النظام' },
          { status: 403 }
        )
      }

      const updateData: UserUpdateInput = {
        name: body.name,
        email: body.email,
        password: body.password,
        phone: body.phone,
        role: body.role,
        companyId: body.companyId,
        branchId: body.branchId,
        active: body.active
      }

      const user = await userService.updateUser(id, updateData, currentUser.id)
      return NextResponse.json({ success: true, data: user })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async deleteUser(request: NextRequest, id: string) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      // منع حذف النفس
      if (currentUser.id === id) {
        return NextResponse.json(
          { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
          { status: 400 }
        )
      }

      await userService.deleteUser(id)
      return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  }
}
