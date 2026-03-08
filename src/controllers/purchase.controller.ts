/**
 * Purchase Controller
 * متحكم المشتريات
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseInvoiceService, purchaseReturnService } from '@/services/purchase.service'

// ============ Purchase Invoice Controller ============

export const purchaseInvoiceController = {
  /**
   * GET - جلب فواتير المشتريات
   */
  async getInvoices(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        search: searchParams.get('search') || undefined,
        companyId: searchParams.get('companyId') || '',
        status: searchParams.get('status') || undefined,
        supplierId: searchParams.get('supplierId') || undefined,
        branchId: searchParams.get('branchId') || undefined,
        warehouseId: searchParams.get('warehouseId') || undefined,
        fromDate: searchParams.get('fromDate') || undefined,
        toDate: searchParams.get('toDate') || undefined,
      }

      if (!params.companyId) {
        return NextResponse.json(
          { success: false, error: 'معرف الشركة مطلوب' },
          { status: 400 }
        )
      }

      const result = await purchaseInvoiceService.getInvoices(params)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching purchase invoices:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب فواتير المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * GET - جلب فاتورة مشتريات بالمعرف
   */
  async getInvoice(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const result = await purchaseInvoiceService.getInvoice(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 404 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching purchase invoice:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب فاتورة المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء فاتورة مشتريات جديدة
   */
  async createInvoice(request: NextRequest) {
    try {
      const data = await request.json()
      const result = await purchaseInvoiceService.createInvoice(data)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error creating purchase invoice:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء فاتورة المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - تحديث فاتورة مشتريات
   */
  async updateInvoice(request: NextRequest) {
    try {
      const data = await request.json()
      const { id, ...updateData } = data

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف الفاتورة مطلوب' },
          { status: 400 }
        )
      }

      const result = await purchaseInvoiceService.updateInvoice(id, updateData)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error updating purchase invoice:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث فاتورة المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * DELETE - حذف فاتورة مشتريات
   */
  async deleteInvoice(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const result = await purchaseInvoiceService.deleteInvoice(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error deleting purchase invoice:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في حذف فاتورة المشتريات' },
        { status: 500 }
      )
    }
  },
}

// ============ Purchase Return Controller ============

export const purchaseReturnController = {
  /**
   * GET - جلب مرتجعات المشتريات
   */
  async getReturns(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        search: searchParams.get('search') || undefined,
        companyId: searchParams.get('companyId') || '',
        status: searchParams.get('status') || undefined,
        supplierId: searchParams.get('supplierId') || undefined,
      }

      if (!params.companyId) {
        return NextResponse.json(
          { success: false, error: 'معرف الشركة مطلوب' },
          { status: 400 }
        )
      }

      const result = await purchaseReturnService.getReturns(params)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching purchase returns:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب مرتجعات المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * GET - جلب مرتجع مشتريات بالمعرف
   */
  async getReturn(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const result = await purchaseReturnService.getReturn(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 404 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching purchase return:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب مرتجع المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء مرتجع مشتريات جديد
   */
  async createReturn(request: NextRequest) {
    try {
      const data = await request.json()
      const result = await purchaseReturnService.createReturn(data)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error creating purchase return:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء مرتجع المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - تحديث مرتجع مشتريات
   */
  async updateReturn(request: NextRequest) {
    try {
      const data = await request.json()
      const { id, ...updateData } = data

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف المرتجع مطلوب' },
          { status: 400 }
        )
      }

      const result = await purchaseReturnService.updateReturn(id, updateData)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error updating purchase return:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث مرتجع المشتريات' },
        { status: 500 }
      )
    }
  },

  /**
   * DELETE - حذف مرتجع مشتريات
   */
  async deleteReturn(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const result = await purchaseReturnService.deleteReturn(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error deleting purchase return:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في حذف مرتجع المشتريات' },
        { status: 500 }
      )
    }
  },
}
