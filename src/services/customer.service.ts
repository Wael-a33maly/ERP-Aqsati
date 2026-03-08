/**
 * Customer Service
 */

import { customerRepository } from '@/repositories/customer.repository'
import type { CustomerQueryParams, CustomerInput, CustomerUpdateInput } from '@/models/customer.model'

export const customerService = {
  async getCustomers(params: CustomerQueryParams) {
    return customerRepository.findCustomers(params)
  },

  async getCustomerById(id: string) {
    const customer = await customerRepository.findById(id)
    if (!customer) throw new Error('العميل غير موجود')
    return customer
  },

  async createCustomer(data: CustomerInput) {
    // Generate customer code
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const customerCode = `CUS-${year}-${random}`

    return customerRepository.create({ ...data, customerCode })
  },

  async updateCustomer(id: string, data: CustomerUpdateInput) {
    return customerRepository.update(id, data)
  },

  async deleteCustomer(id: string) {
    return customerRepository.delete(id)
  }
}
