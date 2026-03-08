/**
 * User Service
 * خدمات المستخدمين
 */

import bcrypt from 'bcryptjs'
import { userRepository } from '@/repositories/user.repository'
import type { UserQueryParams, UserInput, UserUpdateInput } from '@/models/user.model'

export const userService = {
  async getUsers(params: UserQueryParams) {
    return userRepository.findUsers(params)
  },

  async getUserById(id: string) {
    const user = await userRepository.findById(id)
    if (!user) {
      throw new Error('المستخدم غير موجود')
    }
    return user
  },

  async createUser(data: UserInput, currentUserId?: string) {
    // التحقق من عدم تكرار البريد
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      throw new Error('البريد الإلكتروني مستخدم مسبقاً')
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(data.password, 10)

    return userRepository.create({
      ...data,
      hashedPassword
    })
  },

  async updateUser(id: string, data: UserUpdateInput, currentUserId?: string) {
    // التحقق من وجود المستخدم
    const existing = await userRepository.findById(id)
    if (!existing) {
      throw new Error('المستخدم غير موجود')
    }

    // التحقق من عدم تكرار البريد إذا تم تغييره
    if (data.email && data.email !== existing.email) {
      const emailExists = await userRepository.findByEmail(data.email)
      if (emailExists) {
        throw new Error('البريد الإلكتروني مستخدم مسبقاً')
      }
    }

    // تشفير كلمة المرور إذا تم تغييرها
    let hashedPassword: string | undefined
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10)
    }

    return userRepository.update(id, {
      ...data,
      hashedPassword
    })
  },

  async deleteUser(id: string) {
    // التحقق من وجود المستخدم
    const existing = await userRepository.findById(id)
    if (!existing) {
      throw new Error('المستخدم غير موجود')
    }

    // منع حذف المستخدم نفسه
    // يمكن إضافة منطق إضافي هنا

    return userRepository.delete(id)
  },

  async softDeleteUser(id: string) {
    const existing = await userRepository.findById(id)
    if (!existing) {
      throw new Error('المستخدم غير موجود')
    }

    return userRepository.softDelete(id)
  }
}
