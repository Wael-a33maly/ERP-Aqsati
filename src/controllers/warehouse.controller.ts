// ============================================
// Warehouse Controller - متحكم المخازن
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { warehouseService } from '@/services/warehouse.service'
import { getCurrentUser } from '@/lib/auth'

export const warehouseController = {
  // GET - جلب جميع المخازن
  async getWarehouses(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const user = await getCurrentUser()

      const params = {
        companyId: searchParams.get('companyId') || user?.companyId || undefined,
        branchId: searchParams.get('branchId') || undefined,
        activeOnly: searchParams.get('activeOnly') !== 'false',
        includeInventory: searchParams.get('includeInventory') === 'true',
        mainOnly: searchParams.get('mainOnly') === 'true',
        limit: parseInt(searchParams.get('limit') || '100')
      }

      const warehouses = await warehouseService.getWarehouses(params)

      return NextResponse.json({
        success: true,
        data: warehouses
      })
    } catch (error: any) {
      console.error('Error fetching warehouses:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب المخازن' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء مخزن جديد
  async createWarehouse(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const warehouse = await warehouseService.createWarehouse({
        ...body,
        userId: user.id
      })

      return NextResponse.json({
        success: true,
        data: warehouse
      })
    } catch (error: any) {
      console.error('Error creating warehouse:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إنشاء المخزن' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث مخزن
  async updateWarehouse(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const warehouse = await warehouseService.updateWarehouse({
        ...body,
        userId: user.id
      })

      return NextResponse.json({
        success: true,
        data: warehouse
      })
    } catch (error: any) {
      console.error('Error updating warehouse:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تحديث المخزن' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف مخزن
  async deleteWarehouse(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      const companyId = searchParams.get('companyId')

      if (!id || !companyId) {
        return NextResponse.json(
          { success: false, error: 'معرف المخزن والشركة مطلوبان' },
          { status: 400 }
        )
      }

      const warehouse = await warehouseService.deleteWarehouse(id, companyId, user.id)

      return NextResponse.json({
        success: true,
        data: warehouse
      })
    } catch (error: any) {
      console.error('Error deleting warehouse:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في حذف المخزن' },
        { status: 500 }
      )
    }
  }
}
