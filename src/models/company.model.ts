/**
 * Company Model
 * نموذج الشركات
 */

import { Company } from '@prisma/client'

// ============ Types ============

// ============ Input Types ============

export interface CreateCompanyInput {
  name: string
  code: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  discountEnabled?: boolean
  taxRate?: number
  currency?: string
}

export interface UpdateCompanyInput {
  id: string
  name?: string
  nameAr?: string
  code?: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  discountEnabled?: boolean
  taxRate?: number
  currency?: string
  active?: boolean
}

// ============ Query Params ============

export interface CompanyQueryParams {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  id?: string
}

// ============ Response Types ============

export interface CompanyWithStats extends Company {
  _count: {
    Branch: number
    User: number
    Customer: number
    Product: number
  }
}

// ============ Export Types ============
export type { Company }
