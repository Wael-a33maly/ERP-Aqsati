/**
 * Customer Model
 */

export interface CustomerQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  zoneId?: string
  agentId?: string
  status?: string
}

export interface CustomerInput {
  name: string
  nameAr?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  zoneId?: string
  agentId?: string
  companyId: string
  branchId?: string
  creditLimit?: number
  notes?: string
}

export interface CustomerUpdateInput {
  name?: string
  nameAr?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  zoneId?: string
  agentId?: string
  creditLimit?: number
  notes?: string
  active?: boolean
}
