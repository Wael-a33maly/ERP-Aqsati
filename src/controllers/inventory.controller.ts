// ============================================
// Inventory Controller - متحكم المخزون
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/services/inventory.service'
import { getCurrentUser } from '@/lib/auth'

export const inventoryController = {
  // GET - جلب المخزون
  async getInventory(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        warehouseId: searchParams.get('warehouseId') || undefined,
        productId: searchParams.get('productId') || undefined,
        lowStock: searchParams.get('lowStock') === 'true'
      }

      const result = await inventoryService.getInventory(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      console.error('Error fetching inventory:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب المخزون' },
        { status: 500 }
      )
    }
  },

  // GET - جلب حركات المخزون
  async getMovements(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        productId: searchParams.get('productId') || undefined,
        warehouseId: searchParams.get('warehouseId') || undefined,
        type: searchParams.get('type') as any || undefined,
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
      }

      const result = await inventoryService.getMovements(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      console.error('Error fetching movements:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب حركات المخزون' },
        { status: 500 }
      )
    }
  },

  // POST - تعديل المخزون
  async adjustInventory(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const body = await request.json()
      const result = await inventoryService.adjustInventory({
        ...body,
        userId: user.id
      })

      return NextResponse.json({
        success: true,
        data: result
      })
    } catch (error: any) {
      console.error('Error adjusting inventory:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تعديل المخزون' },
        { status: 500 }
      )
    }
  }
}
