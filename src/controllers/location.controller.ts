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
  },

  async getById(id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const governorate = await locationService.getGovernorateById(id)

      // جلب عدد العملاء
      const { db } = await import('@/lib/db')
      const governorateWithCount = await db.governorate.findUnique({
        where: { id },
        include: {
          cities: {
            include: {
              _count: { select: { areas: true } }
            }
          },
          _count: {
            select: { cities: true, customers: true }
          }
        }
      })

      return NextResponse.json({ success: true, data: governorateWithCount })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()

      // التحقق من عدم تكرار الكود
      if (body.code) {
        const { db } = await import('@/lib/db')
        const existing = await db.governorate.findFirst({
          where: {
            code: body.code,
            id: { not: id }
          }
        })
        if (existing) {
          return NextResponse.json({ success: false, error: 'كود المحافظة موجود مسبقاً' }, { status: 400 })
        }
      }

      const item = await locationService.updateGovernorate(id, body)
      return NextResponse.json({ success: true, data: item, message: 'تم تحديث المحافظة بنجاح' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async delete(id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      // التحقق من وجود عملاء مرتبطين
      const { db } = await import('@/lib/db')
      const existing = await db.governorate.findUnique({
        where: { id },
        include: {
          _count: { select: { customers: true } }
        }
      })

      if (!existing) {
        return NextResponse.json({ success: false, error: 'المحافظة غير موجودة' }, { status: 404 })
      }

      if (existing._count.customers > 0) {
        return NextResponse.json({ success: false, error: 'لا يمكن حذف المحافظة لوجود عملاء مرتبطين بها' }, { status: 400 })
      }

      // حذف المحافظة (سيتم حذف المدن والمناطق تلقائياً بسبب onDelete: Cascade)
      await db.governorate.delete({ where: { id } })

      return NextResponse.json({ success: true, message: 'تم حذف المحافظة بنجاح' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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
  },

  async getById(id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { db } = await import('@/lib/db')
      const city = await db.city.findUnique({
        where: { id },
        include: {
          Governorate: {
            select: { id: true, name: true, nameAr: true }
          },
          Area: true,
          _count: {
            select: { customers: true }
          }
        }
      })

      if (!city) {
        return NextResponse.json({ success: false, error: 'المدينة غير موجودة' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: city })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()

      // التحقق من عدم تكرار الكود
      if (body.code) {
        const { db } = await import('@/lib/db')
        const existing = await db.city.findFirst({
          where: {
            code: body.code,
            id: { not: id }
          }
        })
        if (existing) {
          return NextResponse.json({ success: false, error: 'كود المدينة موجود مسبقاً' }, { status: 400 })
        }
      }

      const item = await locationService.updateCity(id, body)
      return NextResponse.json({ success: true, data: item, message: 'تم تحديث المدينة بنجاح' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async delete(id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      // التحقق من وجود عملاء مرتبطين
      const { db } = await import('@/lib/db')
      const existing = await db.city.findUnique({
        where: { id },
        include: {
          _count: { select: { customers: true } }
        }
      })

      if (!existing) {
        return NextResponse.json({ success: false, error: 'المدينة غير موجودة' }, { status: 404 })
      }

      if (existing._count.customers > 0) {
        return NextResponse.json({ success: false, error: 'لا يمكن حذف المدينة لوجود عملاء مرتبطين بها' }, { status: 400 })
      }

      // حذف المدينة (سيتم حذف المناطق تلقائياً بسبب onDelete: Cascade)
      await db.city.delete({ where: { id } })

      return NextResponse.json({ success: true, message: 'تم حذف المدينة بنجاح' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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
  },

  async getById(id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const { db } = await import('@/lib/db')
      const area = await db.area.findUnique({
        where: { id },
        include: {
          city: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              governorate: {
                select: { id: true, name: true, nameAr: true }
              }
            }
          },
          _count: {
            select: { customers: true }
          }
        }
      })

      if (!area) {
        return NextResponse.json({ success: false, error: 'المنطقة غير موجودة' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: area })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      const body = await request.json()

      // التحقق من عدم تكرار الكود
      if (body.code) {
        const { db } = await import('@/lib/db')
        const existing = await db.area.findFirst({
          where: {
            code: body.code,
            id: { not: id }
          }
        })
        if (existing) {
          return NextResponse.json({ success: false, error: 'كود المنطقة موجود مسبقاً' }, { status: 400 })
        }
      }

      const item = await locationService.updateArea(id, body)
      return NextResponse.json({ success: true, data: item, message: 'تم تحديث المنطقة بنجاح' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async delete(id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })
      }

      // التحقق من وجود عملاء مرتبطين
      const { db } = await import('@/lib/db')
      const existing = await db.area.findUnique({
        where: { id },
        include: {
          _count: { select: { customers: true } }
        }
      })

      if (!existing) {
        return NextResponse.json({ success: false, error: 'المنطقة غير موجودة' }, { status: 404 })
      }

      if (existing._count.customers > 0) {
        return NextResponse.json({ success: false, error: 'لا يمكن حذف المنطقة لوجود عملاء مرتبطين بها' }, { status: 400 })
      }

      // حذف المنطقة
      await db.area.delete({ where: { id } })

      return NextResponse.json({ success: true, message: 'تم حذف المنطقة بنجاح' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }
}

// ==================== Egypt Locations Import ====================
export const egyptLocationsController = {
  async getAvailableGovernorates(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId') || undefined
      
      const data = await locationService.getAvailableEgyptGovernorates(companyId)
      return NextResponse.json({ success: true, data })
    } catch (error: any) {
      console.error('Error fetching Egypt locations:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getImportedGovernorates(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId')
      
      if (!companyId) {
        return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 })
      }

      const data = await locationService.getImportedEgyptGovernorates(companyId)
      return NextResponse.json({ success: true, data })
    } catch (error: any) {
      console.error('Error fetching imported governorates:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async importGovernorates(request: NextRequest) {
    try {
      const body = await request.json()
      const { companyId, governorateCodes } = body

      if (!companyId) {
        return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 })
      }

      if (!governorateCodes || !Array.isArray(governorateCodes) || governorateCodes.length === 0) {
        return NextResponse.json({ success: false, error: 'governorateCodes array is required' }, { status: 400 })
      }

      const result = await locationService.importEgyptGovernorates({ companyId, governorateCodes })
      return NextResponse.json({ success: true, data: result, message: result.message })
    } catch (error: any) {
      console.error('Error importing Egypt locations:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async deleteGovernorate(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const governorateId = searchParams.get('governorateId') || undefined
      const companyId = searchParams.get('companyId')
      const resetAll = searchParams.get('resetAll') === 'true'

      if (!companyId) {
        return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 })
      }

      const result = await locationService.deleteEgyptGovernorate({ governorateId, companyId, resetAll })
      return NextResponse.json({ success: true, message: result.message })
    } catch (error: any) {
      console.error('Error deleting governorate:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }
}
