/**
 * User Model
 * نماذج المستخدمين
 */

export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
  companyId?: string
  branchId?: string
  role?: string
  active?: boolean
}

export interface UserInput {
  name: string
  email: string
  password: string
  phone?: string
  role?: string
  companyId?: string
  branchId?: string
  active?: boolean
}

export interface UserUpdateInput {
  name?: string
  email?: string
  password?: string
  phone?: string
  role?: string
  companyId?: string
  branchId?: string
  active?: boolean
}

export interface UserResponse {
  id: string
  email: string
  name: string
  phone?: string | null
  role: string
  active: boolean
  companyId?: string | null
  branchId?: string | null
  createdAt: Date
  company?: {
    id: string
    name: string
  } | null
  branch?: {
    id: string
    name: string
  } | null
}
