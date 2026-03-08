/**
 * Supplier Controller
 * متحكم الموردين
 */

import { NextRequest, NextResponse } from 'next/server'
import { supplierService } from '@/services/supplier.service'

export const supplierController = {
  /**
   * GET - جلب جميع الموردين
   */
  async getSuppliers(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        search: searchParams.get('search') || undefined,
        companyId: searchParams.get('companyId') || '',
        active: searchParams.get('active') === 'true' ? true : undefined,
      }

      if (!params.companyId) {
        return NextResponse.json(
          { success: false, error: 'معرف الشركة مطلوب' },
          { status: 400 }
        )
      }

      const result = await supplierService.getSuppliers(params)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب الموردين' },
        { status: 500 }
      )
    }
  },

  /**
   * GET - جلب مورد بالمعرف
   */
  async getSupplier(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف المورد مطلوب' },
          { status: 400 }
        )
      }

      const result = await supplierService.getSupplier(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 404 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching supplier:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب المورد' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء مورد جديد
   */
  async createSupplier(request: NextRequest) {
    try {
      const data = await request.json()
      const result = await supplierService.createSupplier(data)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error creating supplier:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء المورد' },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - تحديث مورد
   */
  async updateSupplier(request: NextRequest) {
    try {
      const data = await request.json()
      const result = await supplierService.updateSupplier(data)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error updating supplier:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث المورد' },
        { status: 500 }
      )
    }
  },

  /**
   * DELETE - حذف مورد
   */
  async deleteSupplier(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف المورد مطلوب' },
          { status: 400 }
        )
      }

      const result = await supplierService.deleteSupplier(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في حذف المورد' },
        { status: 500 }
      )
    }
  },

  /**
   * GET - جلب كشف حساب مورد
   */
  async getSupplierStatement(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const supplierId = searchParams.get('supplierId')

      if (!supplierId) {
        return NextResponse.json(
          { success: false, error: 'يجب تحديد المورد' },
          { status: 400 }
        )
      }

      const params = {
        companyId: searchParams.get('companyId') || undefined,
        fromDate: searchParams.get('fromDate') || undefined,
        toDate: searchParams.get('toDate') || undefined,
      }

      const result = await supplierService.getSupplierStatement(supplierId, params)

      if (!result.success) {
        return NextResponse.json(result, { status: 404 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error generating supplier statement:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء كشف حساب المورد' },
        { status: 500 }
      )
    }
  },
}
