/**
 * Invoice Repository
 */

import { db } from '@/lib/db'
import type { InvoiceQueryParams, InvoiceInput } from '@/models/invoice.model'

export const invoiceRepository = {
  async findInvoices(params: InvoiceQueryParams) {
    const { page = 1, limit = 10, search, companyId, customerId, status, type, dateFrom, dateTo } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (customerId) where.customerId = customerId
    if (status) where.status = status
    if (type) where.type = type

    if (dateFrom || dateTo) {
      where.invoiceDate = {}
      if (dateFrom) where.invoiceDate.gte = new Date(dateFrom)
      if (dateTo) where.invoiceDate.lte = new Date(dateTo)
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { Customer: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Customer: { select: { id: true, name: true, phone: true } },
          Branch: { select: { id: true, name: true } },
          User: { select: { id: true, name: true } },
          InvoiceItem: { include: { Product: { select: { id: true, name: true, sku: true } } } }
        }
      }),
      db.invoice.count({ where })
    ])

    return { data: invoices, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findById(id: string) {
    return db.invoice.findUnique({
      where: { id },
      include: {
        Customer: true, Branch: true, User: true,
        InvoiceItem: { include: { Product: true } },
        InstallmentContract: { include: { Installment: true } }
      }
    })
  },

  async create(data: InvoiceInput & { invoiceNumber: string; subtotal: number; taxAmount: number; total: number }) {
    return db.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          customerId: data.customerId,
          companyId: data.companyId,
          branchId: data.branchId,
          agentId: data.agentId,
          type: data.type || 'CASH',
          invoiceDate: new Date(),
          subtotal: data.subtotal,
          discount: data.discount || 0,
          taxRate: data.taxRate || 15,
          taxAmount: data.taxAmount,
          total: data.total,
          paidAmount: data.paidAmount || 0,
          remainingAmount: data.total - (data.paidAmount || 0),
          status: 'pending',
          notes: data.notes,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              total: item.quantity * item.unitPrice - (item.discount || 0)
            }))
          }
        },
        include: { items: { include: { Product: true } } }
      })
      return invoice
    })
  },

  async update(id: string, data: any) {
    return db.invoice.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
  },

  async delete(id: string) {
    return db.invoice.delete({ where: { id } })
  },

  // ============ Invoice Items Methods ============

  async findInvoiceItems(invoiceId: string) {
    return db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                nameAr: true,
                unit: true,
                costPrice: true,
                sellPrice: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  },

  async findInvoiceItem(itemId: string) {
    return db.invoiceItem.findUnique({
      where: { id: itemId },
    })
  },

  async createInvoiceItem(data: {
    invoiceId: string
    productId: string
    description?: string
    quantity: number
    unitPrice: number
    discount?: number
    taxRate?: number
    taxAmount?: number
    total: number
    notes?: string
  }) {
    return db.invoiceItem.create({
      data,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            nameAr: true,
            unit: true,
          },
        },
      },
    })
  },

  async updateInvoiceItem(itemId: string, data: any) {
    return db.invoiceItem.update({
      where: { id: itemId },
      data,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            nameAr: true,
            unit: true,
          },
        },
      },
    })
  },

  async deleteInvoiceItem(itemId: string) {
    return db.invoiceItem.delete({
      where: { id: itemId },
    })
  },

  async getInvoiceItems(invoiceId: string) {
    return db.invoiceItem.findMany({
      where: { invoiceId },
    })
  }
}
