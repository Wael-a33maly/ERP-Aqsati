/**
 * Location Controller
 * متحكم المواقع
 */

import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/services/location.service'
import { getCurrentUser } from '@/lib/auth'

export const governorateController = {
  async getAll(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        search: searchParams.get('search') || '',
        active: searchParams.get('active') === 'false' ? false : undefined
      }

      const result = await locationService.getGovernorates(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async create(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const item = await locationService.createGovernorate(body)
      return NextResponse.json({ success: true, data: item })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  }
}

export const cityController = {
  async getAll(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        search: searchParams.get('search') || '',
        governorateId: searchParams.get('governorateId') || undefined,
        active: searchParams.get('active') === 'false' ? false : undefined
      }

      const result = await locationService.getCities(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async create(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const item = await locationService.createCity(body)
      return NextResponse.json({ success: true, data: item })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  }
}

export const areaController = {
  async getAll(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        search: searchParams.get('search') || '',
        cityId: searchParams.get('cityId') || undefined,
        active: searchParams.get('active') === 'false' ? false : undefined
      }

      const result = await locationService.getAreas(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async create(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()
      const item = await locationService.createArea(body)
      return NextResponse.json({ success: true, data: item })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  }
}
