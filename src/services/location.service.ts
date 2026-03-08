/**
 * Location Service
 * خدمات المواقع
 */

import { locationRepository } from '@/repositories/location.repository'
import type { GovernorateInput, CityInput, AreaInput } from '@/models/location.model'

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
  }
}
