/**
 * Inventory Transfer Controller
 * متحكم نقل المخزون
 */

import { NextRequest, NextResponse } from 'next/server'
import { inventoryTransferService } from '@/services/inventory-transfer.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const inventoryTransferController = {
  async getTransfers(request: NextRequest) {
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
        search: searchParams.get('search') || '',
        companyId,
        fromWarehouseId: searchParams.get('fromWarehouseId') || undefined,
        toWarehouseId: searchParams.get('toWarehouseId') || undefined,
        status: searchParams.get('status') || undefined
      }

      const result = await inventoryTransferService.getTransfers(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getTransferById(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const transfer = await inventoryTransferService.getTransferById(id)
      return NextResponse.json({ success: true, data: transfer })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
  },

  async createTransfer(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const transfer = await inventoryTransferService.createTransfer({
        ...body,
        companyId: isSuperAdmin(user) ? body.companyId : user.companyId,
        userId: user.id
      })

      return NextResponse.json({ success: true, data: transfer })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async approveTransfer(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const transfer = await inventoryTransferService.approveTransfer(id)
      return NextResponse.json({ success: true, data: transfer, message: 'تمت الموافقة على أمر النقل' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async cancelTransfer(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      await inventoryTransferService.cancelTransfer(id)
      return NextResponse.json({ success: true, message: 'تم إلغاء أمر النقل' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  }
}
