/**
 * Auth Model
 * نماذج المصادقة
 */

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  phone?: string
  companyId?: string
  branchId?: string
  role?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  nameAr?: string | null
  role: string
  companyId?: string | null
  branchId?: string | null
  active: boolean
  avatar?: string | null
  company?: {
    id: string
    name: string
    code: string
  } | null
  branch?: {
    id: string
    name: string
    code: string
  } | null
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface JwtPayload {
  userId: string
  email: string
  role: string
  companyId: string | null
  branchId: string | null
  iat?: number
  exp?: number
}
