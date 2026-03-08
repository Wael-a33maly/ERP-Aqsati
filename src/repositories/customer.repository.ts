/**
 * Customer Repository
 */

import { db } from '@/lib/db'
import type { CustomerQueryParams, CustomerInput, CustomerUpdateInput } from '@/models/customer.model'

export const customerRepository = {
  async findCustomers(params: CustomerQueryParams) {
    const { page = 1, limit = 10, search, companyId, zoneId, agentId, status } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (zoneId) where.zoneId = zoneId
    if (agentId) where.agentId = agentId
    if (status) where.status = status

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { customerCode: { contains: search } }
      ]
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Zone: { select: { id: true, name: true, nameAr: true } },
          User: { select: { id: true, name: true } },
          Branch: { select: { id: true, name: true } },
          _count: { select: { Invoice: true, Payment: true } }
        }
      }),
      db.customer.count({ where })
    ])

    return { data: customers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findById(id: string) {
    return db.customer.findUnique({
      where: { id },
      include: {
        Zone: true, User: true, Branch: true,
        Invoice: { take: 10, orderBy: { createdAt: 'desc' } },
        Payment: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    })
  },

  async create(data: CustomerInput & { customerCode: string }) {
    return db.customer.create({
      data: {
        customerCode: data.customerCode,
        name: data.name,
        nameAr: data.nameAr,
        phone: data.phone,
        phone2: data.phone2,
        email: data.email,
        address: data.address,
        zoneId: data.zoneId,
        agentId: data.agentId,
        companyId: data.companyId,
        branchId: data.branchId,
        creditLimit: data.creditLimit || 0,
        currentBalance: 0,
        notes: data.notes,
        active: true,
        status: 'active'
      }
    })
  },

  async update(id: string, data: CustomerUpdateInput) {
    return db.customer.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    })
  },

  async delete(id: string) {
    return db.customer.update({
      where: { id },
      data: { active: false, updatedAt: new Date() }
    })
  }
}
