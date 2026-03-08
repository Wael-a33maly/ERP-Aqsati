// ============================================
// Branch Controller - متحكم الفروع
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { branchService } from '@/services/branch.service'

export const branchController = {
  // GET - جلب الفروع
  async getBranches(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        companyId: searchParams.get('companyId') || undefined,
        active: searchParams.get('active') === 'true' ? true : 
                searchParams.get('active') === 'false' ? false : undefined
      }

      const result = await branchService.getBranches(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب الفروع' },
        { status: 500 }
      )
    }
  },

  // GET - جلب فرع بالمعرف
  async getBranch(id: string) {
    try {
      const branch = await branchService.getBranch(id)
      return NextResponse.json({
        success: true,
        data: branch
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب الفرع' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء فرع
  async createBranch(request: NextRequest) {
    try {
      const body = await request.json()
      const branch = await branchService.createBranch(body)

      return NextResponse.json({
        success: true,
        data: branch
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إنشاء الفرع' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث فرع
  async updateBranch(id: string, request: NextRequest) {
    try {
      const body = await request.json()
      const branch = await branchService.updateBranch(id, body)

      return NextResponse.json({
        success: true,
        data: branch
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تحديث الفرع' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف فرع
  async deleteBranch(id: string) {
    try {
      await branchService.deleteBranch(id)
      return NextResponse.json({
        success: true,
        message: 'تم حذف الفرع بنجاح'
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في حذف الفرع' },
        { status: 500 }
      )
    }
  }
}
