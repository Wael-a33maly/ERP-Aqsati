/**
 * Company Controller
 * متحكم الشركات
 */

import { NextRequest, NextResponse } from 'next/server'
import { companyService } from '@/services/company.service'
import { getCurrentUser } from '@/lib/auth'

export const companyController = {
  /**
   * GET - جلب الشركات
   */
  async getCompanies(request: NextRequest) {
    try {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح' },
          { status: 401 }
        )
      }

      const searchParams = request.nextUrl.searchParams

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        active: searchParams.get('active') === 'true' ? true : undefined,
        id: searchParams.get('id') || undefined,
      }

      const result = await companyService.getCompanies(
        params,
        currentUser.id,
        currentUser.role,
        currentUser.companyId
      )

      if (!result.success) {
        return NextResponse.json(result, { status: 403 })
      }

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء شركة جديدة
   */
  async createCompany(request: NextRequest) {
    try {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح' },
          { status: 401 }
        )
      }

      const body = await request.json()
      const result = await companyService.createCompany(body, currentUser.role)

      if (!result.success) {
        return NextResponse.json(result, { status: 403 })
      }

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - تحديث شركة
   */
  async updateCompany(request: NextRequest) {
    try {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح' },
          { status: 401 }
        )
      }

      const body = await request.json()
      const result = await companyService.updateCompany(
        body,
        currentUser.role,
        currentUser.companyId
      )

      if (!result.success) {
        return NextResponse.json(result, { status: 403 })
      }

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },

  /**
   * DELETE - حذف شركة
   */
  async deleteCompany(request: NextRequest) {
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

      const result = await companyService.deleteCompany(id, currentUser.role)

      if (!result.success) {
        return NextResponse.json(result, { status: 403 })
      }

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },
}
