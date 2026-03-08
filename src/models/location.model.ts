/**
 * Location Model
 * نماذج المواقع (المحافظات والمدن والمناطق)
 */

export interface GovernorateQueryParams {
  page?: number
  limit?: number
  search?: string
  active?: boolean
}

export interface GovernorateInput {
  name: string
  nameAr?: string
  code?: string
  active?: boolean
}

export interface CityQueryParams {
  page?: number
  limit?: number
  search?: string
  governorateId?: string
  active?: boolean
}

export interface CityInput {
  name: string
  nameAr?: string
  governorateId: string
  code?: string
  active?: boolean
}

export interface AreaQueryParams {
  page?: number
  limit?: number
  search?: string
  cityId?: string
  active?: boolean
}

export interface AreaInput {
  name: string
  nameAr?: string
  cityId: string
  code?: string
  active?: boolean
}

// Egypt Locations Import Types
export interface EgyptLocationsImportInput {
  companyId: string
  governorateCodes: string[]
}

export interface EgyptLocationsDeleteInput {
  governorateId?: string
  companyId: string
  resetAll?: boolean
}
