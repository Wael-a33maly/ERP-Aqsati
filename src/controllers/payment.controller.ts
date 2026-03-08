// ============================================
// Payment Controller - متحكم المدفوعات
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services/payment.service'

export const paymentController = {
  // GET - جلب المدفوعات
  async getPayments(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        method: searchParams.get('method') as any || undefined,
        status: searchParams.get('status') as any || undefined,
        customerId: searchParams.get('customerId') || undefined,
        invoiceId: searchParams.get('invoiceId') || undefined,
        companyId: searchParams.get('companyId') || undefined,
        branchId: searchParams.get('branchId') || undefined
      }

      const result = await paymentService.getPayments(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      console.error('Error fetching payments:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب المدفوعات' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء دفعة
  async createPayment(request: NextRequest) {
    try {
      const body = await request.json()
      const payment = await paymentService.createPayment(body)

      return NextResponse.json({
        success: true,
        data: payment
      })
    } catch (error: any) {
      console.error('Error creating payment:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إنشاء الدفعة' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث دفعة
  async updatePayment(request: NextRequest) {
    try {
      const body = await request.json()
      const { id, ...data } = body

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف الدفعة مطلوب' },
          { status: 400 }
        )
      }

      const payment = await paymentService.updatePayment(id, data)

      return NextResponse.json({
        success: true,
        data: payment
      })
    } catch (error: any) {
      console.error('Error updating payment:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تحديث الدفعة' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف دفعة
  async deletePayment(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف الدفعة مطلوب' },
          { status: 400 }
        )
      }

      await paymentService.deletePayment(id)

      return NextResponse.json({
        success: true,
        message: 'تم حذف الدفعة بنجاح'
      })
    } catch (error: any) {
      console.error('Error deleting payment:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في حذف الدفعة' },
        { status: 500 }
      )
    }
  }
}
