/**
 * Egyptian Payment Controller
 * متحكم بوابات الدفع المصرية
 */

import { NextRequest, NextResponse } from 'next/server'
import { egyptianPaymentService } from '@/services/egyptian-payment.service'
import { PaymentMethod } from '@/lib/egyptian-payments'

export const egyptianPaymentController = {
  /**
   * POST - إنشاء دفعة جديدة
   */
  async createPayment(request: NextRequest) {
    try {
      const body = await request.json()
      const {
        method,
        amount,
        customerId,
        customerPhone,
        customerEmail,
        customerName,
        description,
        invoiceId,
        installmentId,
        companyId,
        branchId,
        userId
      } = body

      // التحقق من البيانات المطلوبة
      if (!method || !amount || !customerId) {
        return NextResponse.json(
          { success: false, error: 'البيانات غير مكتملة' },
          { status: 400 }
        )
      }

      const result = await egyptianPaymentService.createPayment({
        method: method as PaymentMethod,
        amount,
        customerId,
        customerPhone,
        customerEmail,
        customerName,
        description,
        invoiceId,
        installmentId,
        companyId,
        branchId,
        userId
      })

      return NextResponse.json({
        success: result.success,
        data: result
      })
    } catch (error: any) {
      console.error('Payment error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },

  /**
   * GET - التحقق من حالة الدفعة
   */
  async checkStatus(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const method = searchParams.get('method') as PaymentMethod
      const reference = searchParams.get('reference')
      const companyId = searchParams.get('companyId') || undefined

      if (!method || !reference) {
        return NextResponse.json(
          { success: false, error: 'البيانات غير مكتملة' },
          { status: 400 }
        )
      }

      const result = await egyptianPaymentService.checkStatus({
        method,
        reference,
        companyId
      })

      return NextResponse.json({
        success: result.success,
        data: result
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - استرداد دفعة (Refund)
   */
  async refundPayment(request: NextRequest) {
    try {
      const body = await request.json()
      const { method, referenceNumber, amount, reason, companyId } = body

      if (!method || !referenceNumber || !amount) {
        return NextResponse.json(
          { success: false, error: 'البيانات غير مكتملة' },
          { status: 400 }
        )
      }

      const result = await egyptianPaymentService.refundPayment({
        method: method as PaymentMethod,
        referenceNumber,
        amount,
        reason,
        companyId
      })

      return NextResponse.json({
        success: result.success,
        data: result
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  }
}
