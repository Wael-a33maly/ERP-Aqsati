/**
 * Product Model
 */

export interface ProductQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  categoryId?: string
  active?: boolean
}

export interface ProductInput {
  name: string
  nameAr?: string
  sku?: string
  barcode?: string
  description?: string
  costPrice: number
  sellingPrice: number
  unit?: string
  categoryId?: string
  companyId: string
  minStock?: number
  maxStock?: number
}

export interface ProductUpdateInput {
  name?: string
  nameAr?: string
  sku?: string
  barcode?: string
  description?: string
  costPrice?: number
  sellingPrice?: number
  unit?: string
  categoryId?: string
  minStock?: number
  maxStock?: number
  active?: boolean
}
