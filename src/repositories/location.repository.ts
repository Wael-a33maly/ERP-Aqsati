/**
 * Location Repository
 * مستودع بيانات المواقع
 */

import { db } from '@/lib/db'
import type { GovernorateQueryParams, GovernorateInput, CityQueryParams, CityInput, AreaQueryParams, AreaInput, EgyptLocationsImportInput, EgyptLocationsDeleteInput } from '@/models/location.model'

export const locationRepository = {
  // ==================== Governorates ====================

  async findGovernorates(params: GovernorateQueryParams) {
    const { page = 1, limit = 50, search, active } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (active !== undefined) where.active = active

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [governorates, total] = await Promise.all([
      db.governorate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { cities: true } }
        }
      }),
      db.governorate.count({ where })
    ])

    return { data: governorates, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findGovernorateById(id: string) {
    return db.governorate.findUnique({
      where: { id },
      include: {
        cities: { orderBy: { name: 'asc' } }
      }
    })
  },

  async createGovernorate(data: GovernorateInput) {
    return db.governorate.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        code: data.code,
        active: data.active !== false
      }
    })
  },

  async updateGovernorate(id: string, data: Partial<GovernorateInput>) {
    return db.governorate.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async deleteGovernorate(id: string) {
    return db.governorate.update({
      where: { id },
      data: { active: false }
    })
  },

  // ==================== Cities ====================

  async findCities(params: CityQueryParams) {
    const { page = 1, limit = 50, search, governorateId, active } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (governorateId) where.governorateId = governorateId
    if (active !== undefined) where.active = active

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [cities, total] = await Promise.all([
      db.city.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          Governorate: { select: { id: true, name: true, nameAr: true } },
          _count: { select: { areas: true } }
        }
      }),
      db.city.count({ where })
    ])

    return { data: cities, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findCityById(id: string) {
    return db.city.findUnique({
      where: { id },
      include: {
        Governorate: true,
        areas: { orderBy: { name: 'asc' } }
      }
    })
  },

  async createCity(data: CityInput) {
    return db.city.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        governorateId: data.governorateId,
        code: data.code,
        active: data.active !== false
      }
    })
  },

  async updateCity(id: string, data: Partial<CityInput>) {
    return db.city.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async deleteCity(id: string) {
    return db.city.update({
      where: { id },
      data: { active: false }
    })
  },

  // ==================== Areas ====================

  async findAreas(params: AreaQueryParams) {
    const { page = 1, limit = 50, search, cityId, active } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (cityId) where.cityId = cityId
    if (active !== undefined) where.active = active

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [areas, total] = await Promise.all([
      db.area.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          City: {
            select: { id: true, name: true, nameAr: true },
            include: {
              Governorate: { select: { id: true, name: true, nameAr: true } }
            }
          }
        }
      }),
      db.area.count({ where })
    ])

    return { data: areas, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findAreaById(id: string) {
    return db.area.findUnique({
      where: { id },
      include: {
        City: { include: { Governorate: true } }
      }
    })
  },

  async createArea(data: AreaInput) {
    return db.area.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        cityId: data.cityId,
        code: data.code,
        active: data.active !== false
      }
    })
  },

  async updateArea(id: string, data: Partial<AreaInput>) {
    return db.area.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async deleteArea(id: string) {
    return db.area.update({
      where: { id },
      data: { active: false }
    })
  },

  // ==================== Egypt Locations Import ====================

  async findGovernoratesByCompany(companyId: string) {
    return db.governorate.findMany({
      where: { companyId },
      select: { code: true }
    })
  },

  async findImportedGovernorates(companyId: string) {
    return db.governorate.findMany({
      where: { companyId },
      include: {
        City: {
          include: {
            _count: { select: { Customer: true } },
            Area: { select: { id: true } }
          }
        },
        _count: { select: { Customer: true } }
      },
      orderBy: { name: 'asc' }
    })
  },

  async findGovernorateByCode(companyId: string, code: string) {
    return db.governorate.findFirst({
      where: { companyId, code }
    })
  },

  async createGovernorateWithCompany(companyId: string, data: { code: string; name: string; nameAr: string }) {
    return db.governorate.create({
      data: {
        companyId,
        code: data.code,
        name: data.name,
        nameAr: data.nameAr,
        active: true
      }
    })
  },

  async createCityWithCompany(companyId: string, governorateId: string, data: { code: string; name: string; nameAr: string }) {
    return db.city.create({
      data: {
        companyId,
        governorateId,
        code: data.code,
        name: data.name,
        nameAr: data.nameAr,
        active: true
      }
    })
  },

  async createAreaWithCompany(companyId: string, cityId: string, data: { code: string; name: string; nameAr: string }) {
    return db.area.create({
      data: {
        companyId,
        cityId,
        code: data.code,
        name: data.name,
        nameAr: data.nameAr,
        active: true
      }
    })
  },

  async findGovernorateWithCustomers(id: string, companyId: string) {
    return db.governorate.findFirst({
      where: { id, companyId },
      include: {
        City: {
          include: {
            _count: { select: { Customer: true } }
          }
        },
        _count: { select: { Customer: true } }
      }
    })
  },

  async deleteGovernorateHard(id: string) {
    return db.governorate.delete({ where: { id } })
  },

  async deleteAllCompanyLocations(companyId: string) {
    await db.area.deleteMany({ where: { companyId } })
    await db.city.deleteMany({ where: { companyId } })
    await db.governorate.deleteMany({ where: { companyId } })
  },

  async deleteGovernorateHard(id: string) {
    return db.governorate.delete({ where: { id } })
  }
}
