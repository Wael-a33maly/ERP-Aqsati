/**
 * Category Controller
 * متحكم الفئات
 */

import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/services/category.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const categoryController = {
  async getCategories(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const companyId = isSuperAdmin(user) ? (searchParams.get('companyId') || '') : user.companyId

      const params = {
        companyId,
        parentId: searchParams.get('parentId') || undefined,
        includeProducts: searchParams.get('includeProducts') === 'true',
        activeOnly: searchParams.get('activeOnly') !== 'false'
      }

      const result = await categoryService.getCategories(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async createCategory(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const companyId = isSuperAdmin(user) ? body.companyId : user.companyId

      const category = await categoryService.createCategory({
        ...body,
        companyId
      }, user.id)

      return NextResponse.json({ success: true, data: category })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async updateCategory(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const { id, companyId, ...updateData } = body

      const category = await categoryService.updateCategory(id, updateData, companyId)
      return NextResponse.json({ success: true, data: category })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async deleteCategory(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      const companyId = isSuperAdmin(user) ? (searchParams.get('companyId') || '') : user.companyId

      if (!id) {
        return NextResponse.json({ success: false, error: 'معرف الفئة مطلوب' }, { status: 400 })
      }

      await categoryService.deleteCategory(id, companyId)
      return NextResponse.json({ success: true, message: 'تم حذف الفئة' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }
}
