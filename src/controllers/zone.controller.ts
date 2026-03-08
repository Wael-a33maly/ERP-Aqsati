// ============================================
// Zone Controller - متحكم المناطق
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { zoneService } from '@/services/zone.service'

export const zoneController = {
  // GET - جلب المناطق
  async getZones(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        companyId: searchParams.get('companyId') || undefined,
        branchId: searchParams.get('branchId') || undefined,
        active: searchParams.get('active') === 'true' ? true : 
                searchParams.get('active') === 'false' ? false : undefined
      }

      const result = await zoneService.getZones(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      console.error('Error fetching zones:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب المناطق' },
        { status: 500 }
      )
    }
  },

  // GET - جلب منطقة بالمعرف
  async getZone(id: string) {
    try {
      const zone = await zoneService.getZone(id)
      return NextResponse.json({
        success: true,
        data: zone
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب المنطقة' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء منطقة
  async createZone(request: NextRequest) {
    try {
      const body = await request.json()
      const zone = await zoneService.createZone(body)

      return NextResponse.json({
        success: true,
        data: zone
      })
    } catch (error: any) {
      console.error('Error creating zone:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء المنطقة' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث منطقة
  async updateZone(id: string, request: NextRequest) {
    try {
      const body = await request.json()
      const zone = await zoneService.updateZone(id, body)

      return NextResponse.json({
        success: true,
        data: zone
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تحديث المنطقة' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف منطقة
  async deleteZone(id: string) {
    try {
      await zoneService.deleteZone(id)
      return NextResponse.json({
        success: true,
        message: 'تم حذف المنطقة بنجاح'
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في حذف المنطقة' },
        { status: 500 }
      )
    }
  }
}
