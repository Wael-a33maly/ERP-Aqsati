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
  }
}
