/**
 * Invoice Controller
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoiceService } from '@/services/invoice.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const invoiceController = {
  async getInvoices(request: NextRequest) {
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
        customerId: searchParams.get('customerId') || undefined,
        status: searchParams.get('status') || undefined,
        type: searchParams.get('type') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined
      }

      const result = await invoiceService.getInvoices(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getInvoiceById(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const invoice = await invoiceService.getInvoiceById(id)
      return NextResponse.json({ success: true, data: invoice })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
  },

  async createInvoice(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const body = await request.json()
      const invoice = await invoiceService.createInvoice(body)
      return NextResponse.json({ success: true, data: invoice })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async deleteInvoice(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      await invoiceService.deleteInvoice(id)
      return NextResponse.json({ success: true, message: 'تم حذف الفاتورة' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  // ============ Invoice Items Methods ============

  async getInvoiceItems(request: NextRequest, id: string) {
    try {
      const result = await invoiceService.getInvoiceItems(id)
      return NextResponse.json({ success: true, data: result.items, summary: result.summary })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async addInvoiceItem(request: NextRequest, id: string) {
    try {
      const body = await request.json()
      const result = await invoiceService.addInvoiceItem(id, body)
      return NextResponse.json({ success: true, data: result, message: 'Item added to invoice' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async updateInvoiceItem(request: NextRequest, id: string) {
    try {
      const body = await request.json()
      const result = await invoiceService.updateInvoiceItem(id, body)
      return NextResponse.json({ success: true, data: result, message: 'Item updated successfully' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async deleteInvoiceItem(request: NextRequest, id: string) {
    try {
      const { searchParams } = new URL(request.url)
      const itemId = searchParams.get('itemId')

      if (!itemId) {
        return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 })
      }

      const result = await invoiceService.deleteInvoiceItem(id, itemId)
      return NextResponse.json({ success: true, message: result.message })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  }
}
