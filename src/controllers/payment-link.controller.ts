/**
 * Payment Link Controller
 * متحكم روابط الدفع
 */

import { NextRequest, NextResponse } from 'next/server'
import { paymentLinkService } from '@/services/payment-link.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const paymentLinkController = {
  async getPaymentLinks(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const companyId = isSuperAdmin(user) ? (searchParams.get('companyId') || '') : user.companyId

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        companyId,
        status: searchParams.get('status') || undefined
      }

      const result = await paymentLinkService.getPaymentLinks(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getPaymentLinkById(request: NextRequest, id: string) {
    try {
      const link = await paymentLinkService.getPaymentLinkById(id)
      return NextResponse.json({ success: true, data: link })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
  },

  async createPaymentLink(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const link = await paymentLinkService.createPaymentLink({
        ...body,
        companyId: isSuperAdmin(user) ? body.companyId : user.companyId
      })

      return NextResponse.json({ success: true, data: link })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async cancelPaymentLink(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      await paymentLinkService.cancelPaymentLink(id)
      return NextResponse.json({ success: true, message: 'تم إلغاء رابط الدفع' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  }
}
