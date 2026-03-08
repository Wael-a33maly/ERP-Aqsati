/**
 * Category Model
 * نماذج الفئات
 */

export interface CategoryQueryParams {
  companyId: string
  parentId?: string
  includeProducts?: boolean
  activeOnly?: boolean
}

export interface CategoryInput {
  companyId: string
  name: string
  nameAr?: string
  code: string
  parentId?: string
  active?: boolean
}

export interface CategoryUpdateInput {
  name?: string
  nameAr?: string
  code?: string
  parentId?: string
  active?: boolean
}
