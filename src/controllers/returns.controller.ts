// ============================================
// Returns Controller - متحكم المرتجعات
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { returnsService } from '@/services/returns.service'
import { getCurrentUser } from '@/lib/auth'

export const returnsController = {
  // GET - جلب المرتجعات
  async getReturns(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') as any || undefined,
        type: searchParams.get('type') as any || undefined,
        customerId: searchParams.get('customerId') || undefined,
        invoiceId: searchParams.get('invoiceId') || undefined,
        companyId: searchParams.get('companyId') || undefined,
        branchId: searchParams.get('branchId') || undefined
      }

      const result = await returnsService.getReturns(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      console.error('Error fetching returns:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب المرتجعات' },
        { status: 500 }
      )
    }
  },

  // GET - جلب مرتجع بالمعرف
  async getReturn(id: string) {
    try {
      const returnRecord = await returnsService.getReturn(id)
      return NextResponse.json({
        success: true,
        data: returnRecord
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب المرتجع' },
        { status: 500 }
      )
    }
  },

  // GET - جلب عناصر مرتجع
  async getReturnItems(returnId: string) {
    try {
      const items = await returnsService.getReturnItems(returnId)
      return NextResponse.json({
        success: true,
        data: items
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب عناصر المرتجع' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء مرتجع
  async createReturn(request: NextRequest) {
    try {
      const body = await request.json()
      const returnRecord = await returnsService.createReturn(body)

      return NextResponse.json({
        success: true,
        data: returnRecord
      })
    } catch (error: any) {
      console.error('Error creating return:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إنشاء المرتجع' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث مرتجع
  async updateReturn(request: NextRequest) {
    try {
      const body = await request.json()
      const { id, ...data } = body

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف المرتجع مطلوب' },
          { status: 400 }
        )
      }

      const returnRecord = await returnsService.updateReturn(id, data)

      return NextResponse.json({
        success: true,
        data: returnRecord
      })
    } catch (error: any) {
      console.error('Error updating return:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تحديث المرتجع' },
        { status: 500 }
      )
    }
  },

  // POST - الموافقة على مرتجع
  async approveReturn(id: string) {
    try {
      const returnRecord = await returnsService.approveReturn(id)
      return NextResponse.json({
        success: true,
        data: returnRecord
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في الموافقة على المرتجع' },
        { status: 500 }
      )
    }
  },

  // POST - إكمال مرتجع
  async completeReturn(id: string) {
    try {
      const returnRecord = await returnsService.completeReturn(id)
      return NextResponse.json({
        success: true,
        data: returnRecord
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إكمال المرتجع' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف مرتجع
  async deleteReturn(id: string) {
    try {
      await returnsService.deleteReturn(id)
      return NextResponse.json({
        success: true,
        message: 'تم حذف المرتجع بنجاح'
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في حذف المرتجع' },
        { status: 500 }
      )
    }
  }
}
