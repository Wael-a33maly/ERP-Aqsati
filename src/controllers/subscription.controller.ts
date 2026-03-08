/**
 * Subscription Controller
 * متحكم الاشتراكات
 */

import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/services/subscription.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const subscriptionController = {
  async getSubscriptions(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        status: searchParams.get('status') || undefined,
        planId: searchParams.get('planId') || undefined
      }

      const result = await subscriptionService.getSubscriptions(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getStatus(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const companyId = isSuperAdmin(user) ? (request.headers.get('x-company-id') || '') : user.companyId
      const subscription = await subscriptionService.getActiveSubscription(companyId)

      return NextResponse.json({ success: true, data: subscription })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getPlans(request: NextRequest) {
    try {
      const plans = await subscriptionService.getPlans()
      return NextResponse.json({ success: true, data: plans })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  // ============ Payment Transactions ============
  async getPaymentTransactions(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const action = searchParams.get('action')

      if (action === 'methods') {
        const methods = subscriptionService.getPaymentMethods()
        return NextResponse.json({ success: true, data: methods })
      }

      const params = {
        companyId: searchParams.get('companyId') || undefined,
        subscriptionId: searchParams.get('subscriptionId') || undefined
      }

      const payments = await subscriptionService.getPaymentTransactions(params)
      return NextResponse.json({ success: true, data: payments })
    } catch (error: any) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ success: false, error: 'فشل في جلب المدفوعات' }, { status: 500 })
    }
  },

  async createPaymentTransaction(request: NextRequest) {
    try {
      const body = await request.json()
      const { subscriptionId, companyId, amount, paymentMethod, currency } = body

      const result = await subscriptionService.createPaymentTransaction({
        subscriptionId,
        companyId,
        amount,
        paymentMethod,
        currency
      })

      return NextResponse.json({
        success: true,
        data: result.payment,
        message: result.instructions
      })
    } catch (error: any) {
      console.error('Error creating payment:', error)
      return NextResponse.json({ success: false, error: error.message || 'فشل في إنشاء عملية الدفع' }, { status: 500 })
    }
  },

  async updatePaymentTransaction(request: NextRequest) {
    try {
      const body = await request.json()
      const { id, action, transactionId, notes, ...restData } = body

      const result = await subscriptionService.updatePaymentTransaction({
        id,
        action,
        transactionId,
        notes,
        ...restData
      })

      return NextResponse.json({
        success: true,
        data: result.payment,
        message: result.message
      })
    } catch (error: any) {
      console.error('Error updating payment:', error)
      return NextResponse.json({ success: false, error: error.message || 'فشل في تحديث عملية الدفع' }, { status: 500 })
    }
  }
}
