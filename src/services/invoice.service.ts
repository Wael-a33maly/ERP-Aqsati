/**
 * Invoice Service
 */

import { db } from '@/lib/db'
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
  },

  // ============ Invoice Items Methods ============

  async getInvoiceItems(invoiceId: string) {
    const invoice = await invoiceRepository.findInvoiceItems(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    const itemsWithTotals = invoice.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
      taxableAmount: item.quantity * item.unitPrice - item.discount,
    }))

    return {
      items: itemsWithTotals,
      summary: {
        itemCount: invoice.items.length,
        totalQuantity: invoice.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: invoice.subtotal,
        totalDiscount: invoice.discount,
        totalTax: invoice.taxAmount,
        total: invoice.total,
      },
    }
  },

  async addInvoiceItem(invoiceId: string, data: {
    productId: string
    description?: string
    quantity: number
    unitPrice: number
    discount?: number
    taxRate?: number
    notes?: string
  }) {
    // Validate required fields
    if (!data.productId || !data.quantity || data.unitPrice === undefined) {
      throw new Error('Product ID, quantity, and unit price are required')
    }

    // Get invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    })

    if (!invoice) throw new Error('Invoice not found')

    // Only allow adding items to pending invoices
    if (invoice.status !== 'pending') {
      throw new Error('Items can only be added to pending invoices')
    }

    // Get product
    const product = await db.product.findUnique({ where: { id: data.productId } })
    if (!product) throw new Error('Product not found')

    // Calculate item totals
    const itemSubtotal = data.quantity * data.unitPrice
    const itemDiscount = data.discount || 0
    const itemTaxRate = data.taxRate ?? invoice.taxRate
    const itemTaxableAmount = itemSubtotal - itemDiscount
    const itemTaxAmount = itemTaxableAmount * (itemTaxRate / 100)
    const itemTotal = itemTaxableAmount + itemTaxAmount

    // Create item and update invoice totals
    const result = await db.$transaction(async (tx) => {
      const invoiceItem = await tx.invoiceItem.create({
        data: {
          invoiceId,
          productId: data.productId,
          description: data.description || product.name,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          discount: itemDiscount,
          taxRate: itemTaxRate,
          taxAmount: itemTaxAmount,
          total: itemTotal,
          notes: data.notes,
        },
        include: {
          product: {
            select: { id: true, sku: true, name: true, nameAr: true, unit: true },
          },
        },
      })

      // Update invoice totals
      const newSubtotal = invoice.subtotal + itemSubtotal
      const newTaxAmount = invoice.taxAmount + itemTaxAmount
      const newTotal = newSubtotal - invoice.discount + newTaxAmount

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
          remainingAmount: newTotal - invoice.paidAmount,
        },
      })

      return invoiceItem
    })

    return result
  },

  async updateInvoiceItem(invoiceId: string, data: {
    itemId: string
    productId?: string
    description?: string
    quantity?: number
    unitPrice?: number
    discount?: number
    taxRate?: number
    notes?: string
  }) {
    const { itemId, ...updateData } = data

    if (!itemId) throw new Error('Item ID is required')

    // Get invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    })

    if (!invoice) throw new Error('Invoice not found')

    if (invoice.status !== 'pending') {
      throw new Error('Items can only be updated in pending invoices')
    }

    // Get existing item
    const existingItem = await db.invoiceItem.findUnique({ where: { id: itemId } })
    if (!existingItem || existingItem.invoiceId !== invoiceId) {
      throw new Error('Item not found in this invoice')
    }

    // Calculate new item totals
    const newQuantity = updateData.quantity ?? existingItem.quantity
    const newUnitPrice = updateData.unitPrice ?? existingItem.unitPrice
    const newDiscount = updateData.discount ?? existingItem.discount
    const newTaxRate = updateData.taxRate ?? existingItem.taxRate

    const itemSubtotal = newQuantity * newUnitPrice
    const itemTaxableAmount = itemSubtotal - newDiscount
    const itemTaxAmount = itemTaxableAmount * (newTaxRate / 100)
    const itemTotal = itemTaxableAmount + itemTaxAmount

    const result = await db.$transaction(async (tx) => {
      const invoiceItem = await tx.invoiceItem.update({
        where: { id: itemId },
        data: {
          productId: updateData.productId ?? existingItem.productId,
          description: updateData.description,
          quantity: newQuantity,
          unitPrice: newUnitPrice,
          discount: newDiscount,
          taxRate: newTaxRate,
          taxAmount: itemTaxAmount,
          total: itemTotal,
          notes: updateData.notes,
        },
        include: {
          product: {
            select: { id: true, sku: true, name: true, nameAr: true, unit: true },
          },
        },
      })

      // Recalculate invoice totals
      const allItems = await tx.invoiceItem.findMany({ where: { invoiceId } })
      const newSubtotal = allItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      const newTaxAmount = allItems.reduce((sum, item) => sum + item.taxAmount, 0)
      const newTotal = newSubtotal - invoice.discount + newTaxAmount

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
          remainingAmount: newTotal - invoice.paidAmount,
        },
      })

      return invoiceItem
    })

    return result
  },

  async deleteInvoiceItem(invoiceId: string, itemId: string) {
    // Get invoice
    const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new Error('Invoice not found')

    if (invoice.status !== 'pending') {
      throw new Error('Items can only be deleted from pending invoices')
    }

    // Get existing item
    const existingItem = await db.invoiceItem.findUnique({ where: { id: itemId } })
    if (!existingItem || existingItem.invoiceId !== invoiceId) {
      throw new Error('Item not found in this invoice')
    }

    // Delete item and update invoice totals
    await db.$transaction(async (tx) => {
      await tx.invoiceItem.delete({ where: { id: itemId } })

      const remainingItems = await tx.invoiceItem.findMany({ where: { invoiceId } })

      if (remainingItems.length === 0) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            subtotal: 0,
            taxAmount: 0,
            total: 0,
            remainingAmount: 0 - invoice.paidAmount,
          },
        })
      } else {
        const newSubtotal = remainingItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
        const newTaxAmount = remainingItems.reduce((sum, item) => sum + item.taxAmount, 0)
        const newTotal = newSubtotal - invoice.discount + newTaxAmount

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            subtotal: newSubtotal,
            taxAmount: newTaxAmount,
            total: newTotal,
            remainingAmount: newTotal - invoice.paidAmount,
          },
        })
      }
    })

    return { message: 'Item deleted successfully' }
  }
}
