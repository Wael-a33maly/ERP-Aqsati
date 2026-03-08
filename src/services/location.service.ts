/**
 * Location Service
 * خدمات المواقع
 */

import { locationRepository } from '@/repositories/location.repository'
import type { GovernorateInput, CityInput, AreaInput, EgyptLocationsImportInput, EgyptLocationsDeleteInput } from '@/models/location.model'
import { governorates, cities } from 'egydata'

export const locationService = {
  // ==================== Governorates ====================

  async getGovernorates(params: any) {
    return locationRepository.findGovernorates(params)
  },

  async getGovernorateById(id: string) {
    const governorate = await locationRepository.findGovernorateById(id)
    if (!governorate) {
      throw new Error('المحافظة غير موجودة')
    }
    return governorate
  },

  async createGovernorate(data: GovernorateInput) {
    return locationRepository.createGovernorate(data)
  },

  async updateGovernorate(id: string, data: Partial<GovernorateInput>) {
    return locationRepository.updateGovernorate(id, data)
  },

  async deleteGovernorate(id: string) {
    return locationRepository.deleteGovernorate(id)
  },

  // ==================== Cities ====================

  async getCities(params: any) {
    return locationRepository.findCities(params)
  },

  async getCityById(id: string) {
    const city = await locationRepository.findCityById(id)
    if (!city) {
      throw new Error('المدينة غير موجودة')
    }
    return city
  },

  async createCity(data: CityInput) {
    return locationRepository.createCity(data)
  },

  async updateCity(id: string, data: Partial<CityInput>) {
    return locationRepository.updateCity(id, data)
  },

  async deleteCity(id: string) {
    return locationRepository.deleteCity(id)
  },

  // ==================== Areas ====================

  async getAreas(params: any) {
    return locationRepository.findAreas(params)
  },

  async getAreaById(id: string) {
    const area = await locationRepository.findAreaById(id)
    if (!area) {
      throw new Error('المنطقة غير موجودة')
    }
    return area
  },

  async createArea(data: AreaInput) {
    return locationRepository.createArea(data)
  },

  async updateArea(id: string, data: Partial<AreaInput>) {
    return locationRepository.updateArea(id, data)
  },

  async deleteArea(id: string) {
    return locationRepository.deleteArea(id)
  },

  // ==================== Egypt Locations Import ====================

  async getAvailableEgyptGovernorates(companyId?: string) {
    const allGovernorates = governorates.getAll()
    
    // جلب المحافظات المستوردة بالفعل
    const importedGovs = companyId 
      ? await locationRepository.findGovernoratesByCompany(companyId)
      : []
    
    const importedCodes = new Set(importedGovs.map((g: any) => g.code))

    return allGovernorates.map((gov: any) => ({
      id: gov.id,
      code: gov.code,
      name: gov.name,
      nameEn: gov.nameEn,
      citiesCount: cities.getByGovernorate(gov.code).length,
      imported: importedCodes.has(gov.code)
    }))
  },

  async getImportedEgyptGovernorates(companyId: string) {
    const importedGovs = await locationRepository.findImportedGovernorates(companyId)

    return importedGovs.map((gov: any) => ({
      id: gov.id,
      code: gov.code,
      name: gov.name,
      nameAr: gov.nameAr,
      active: gov.active,
      citiesCount: gov.City.length,
      customersCount: gov._count.Customer,
      cities: gov.City.map((city: any) => ({
        id: city.id,
        name: city.name,
        nameAr: city.nameAr,
        areasCount: city.Area.length,
        customersCount: city._count.Customer
      }))
    }))
  },

  async importEgyptGovernorates(data: EgyptLocationsImportInput) {
    const { companyId, governorateCodes } = data

    let importedGovs = 0
    let importedCities = 0
    let importedAreas = 0
    let skippedGovs = 0

    for (const govCode of governorateCodes) {
      // التحقق من وجود المحافظة مسبقاً
      const existingGov = await locationRepository.findGovernorateByCode(companyId, govCode)

      if (existingGov) {
        skippedGovs++
        continue
      }

      // جلب بيانات المحافظة
      const govData = governorates.getByCode(govCode)
      if (!govData) continue

      // إنشاء المحافظة
      const governorate = await locationRepository.createGovernorateWithCompany(companyId, {
        code: govCode,
        name: govData.nameEn,
        nameAr: govData.name
      })

      importedGovs++

      // جلب مدن المحافظة
      const govCities = cities.getByGovernorate(govCode)

      // إنشاء المدن
      for (const cityData of govCities) {
        const city = await locationRepository.createCityWithCompany(companyId, governorate.id, {
          code: `${govCode}-${cityData.id}`,
          name: cityData.nameEn,
          nameAr: cityData.name
        })
        importedCities++

        // إنشاء منطقة افتراضية لكل مدينة
        await locationRepository.createAreaWithCompany(companyId, city.id, {
          code: `${govCode}-${cityData.id}-01`,
          name: cityData.nameEn,
          nameAr: cityData.name
        })
        importedAreas++
      }
    }

    return {
      importedGovernorates: importedGovs,
      importedCities,
      importedAreas,
      skippedGovernorates: skippedGovs,
      message: `تم استيراد ${importedGovs} محافظة مع ${importedCities} مدينة و ${importedAreas} منطقة`
    }
  },

  async deleteEgyptGovernorate(data: EgyptLocationsDeleteInput) {
    const { governorateId, companyId, resetAll } = data

    // حذف جميع البيانات
    if (resetAll) {
      await locationRepository.deleteAllCompanyLocations(companyId)
      return { message: 'تم حذف جميع بيانات المواقع بنجاح' }
    }

    if (!governorateId) {
      throw new Error('governorateId is required')
    }

    // التحقق من وجود المحافظة
    const governorate = await locationRepository.findGovernorateWithCustomers(governorateId, companyId)

    if (!governorate) {
      throw new Error('Governorate not found')
    }

    // التحقق من وجود عملاء مرتبطين
    const totalCustomers = governorate._count.Customer + 
      governorate.City.reduce((sum: number, city: any) => sum + city._count.Customer, 0)

    if (totalCustomers > 0) {
      throw new Error(`لا يمكن حذف المحافظة لوجود ${totalCustomers} عميل مرتبط بها`)
    }

    // حذف المحافظة (سيتم حذف المدن والمناطق تلقائياً بسبب onDelete: Cascade)
    await locationRepository.deleteGovernorateHard(governorateId)

    return { message: `تم حذف المحافظة "${governorate.nameAr || governorate.name}" مع جميع بياناتها` }
  }
}
