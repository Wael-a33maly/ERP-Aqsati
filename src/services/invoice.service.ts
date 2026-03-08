/**
 * Invoice Service
 */

import { invoiceRepository } from '@/repositories/invoice.repository'
import type { InvoiceQueryParams, InvoiceInput } from '@/models/invoice.model'

export const invoiceService = {
  async getInvoices(params: InvoiceQueryParams) {
    return invoiceRepository.findInvoices(params)
  },

  async getInvoiceById(id: string) {
    const invoice = await invoiceRepository.findById(id)
    if (!invoice) throw new Error('الفاتورة غير موجودة')
    return invoice
  },

  async createInvoice(data: InvoiceInput) {
    // Generate invoice number
    const year = new Date().getFullYear()
    const lastInvoice = await invoiceRepository.findInvoices({ limit: 1, companyId: data.companyId })
    const seq = (lastInvoice.data?.length || 0) + 1
    const invoiceNumber = `INV-${year}-${String(seq).padStart(6, '0')}`

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const discount = data.discount || 0
    const taxRate = data.taxRate || 15
    const taxAmount = Math.round((subtotal - discount) * taxRate / 100)
    const total = subtotal - discount + taxAmount

    return invoiceRepository.create({
      ...data,
      invoiceNumber,
      subtotal,
      taxAmount,
      total
    })
  },

  async updateInvoice(id: string, data: any) {
    return invoiceRepository.update(id, data)
  },

  async deleteInvoice(id: string) {
    return invoiceRepository.delete(id)
  }
}
