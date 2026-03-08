/**
 * User Repository
 * مستودع بيانات المستخدمين
 */

import { db } from '@/lib/db'
import type { UserQueryParams, UserInput, UserUpdateInput } from '@/models/user.model'

export const userRepository = {
  async findUsers(params: UserQueryParams) {
    const { page = 1, limit = 10, search, companyId, branchId, role, active } = params
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (companyId) where.companyId = companyId
    if (branchId) where.branchId = branchId
    if (role) where.role = role
    if (active !== undefined) where.active = active

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          nameAr: true,
          phone: true,
          role: true,
          active: true,
          companyId: true,
          branchId: true,
          createdAt: true,
          Company: { select: { id: true, name: true } },
          Branch: { select: { id: true, name: true } }
        }
      }),
      db.user.count({ where })
    ])

    return { data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        nameAr: true,
        phone: true,
        role: true,
        active: true,
        companyId: true,
        branchId: true,
        createdAt: true,
        Company: { select: { id: true, name: true } },
        Branch: { select: { id: true, name: true } }
      }
    })
  },

  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email: email.toLowerCase() }
    })
  },

  async create(data: UserInput & { hashedPassword: string }) {
    return db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.hashedPassword,
        phone: data.phone,
        role: data.role || 'AGENT',
        companyId: data.companyId,
        branchId: data.branchId,
        active: data.active !== false
      },
      select: {
        id: true,
        email: true,
        name: true,
        nameAr: true,
        phone: true,
        role: true,
        active: true,
        companyId: true,
        branchId: true,
        createdAt: true,
        Company: { select: { id: true, name: true } },
        Branch: { select: { id: true, name: true } }
      }
    })
  },

  async update(id: string, data: UserUpdateInput & { hashedPassword?: string }) {
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    }

    if (data.hashedPassword) {
      updateData.password = data.hashedPassword
      delete updateData.hashedPassword
    }

    return db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        nameAr: true,
        phone: true,
        role: true,
        active: true,
        companyId: true,
        branchId: true,
        createdAt: true,
        Company: { select: { id: true, name: true } },
        Branch: { select: { id: true, name: true } }
      }
    })
  },

  async delete(id: string) {
    return db.user.delete({
      where: { id }
    })
  },

  async softDelete(id: string) {
    return db.user.update({
      where: { id },
      data: { active: false, updatedAt: new Date() }
    })
  }
}
