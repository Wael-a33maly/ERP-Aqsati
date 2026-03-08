/**
 * Customer Controller
 */

import { NextRequest, NextResponse } from 'next/server'
import { customerService } from '@/services/customer.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const customerController = {
  async getCustomers(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const { searchParams } = new URL(request.url)
      const companyId = isSuperAdmin(user) ? searchParams.get('companyId') : user.companyId

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        companyId: companyId || undefined,
        zoneId: searchParams.get('zoneId') || undefined,
        agentId: searchParams.get('agentId') || undefined,
        status: searchParams.get('status') || undefined
      }

      const result = await customerService.getCustomers(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getCustomerById(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const customer = await customerService.getCustomerById(id)
      return NextResponse.json({ success: true, data: customer })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
  },

  async createCustomer(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const body = await request.json()
      const customer = await customerService.createCustomer({
        ...body,
        companyId: isSuperAdmin(user) ? body.companyId : user.companyId
      })
      return NextResponse.json({ success: true, data: customer })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async updateCustomer(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const body = await request.json()
      const customer = await customerService.updateCustomer(id, body)
      return NextResponse.json({ success: true, data: customer })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async deleteCustomer(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      await customerService.deleteCustomer(id)
      return NextResponse.json({ success: true, message: 'تم حذف العميل' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }
}
