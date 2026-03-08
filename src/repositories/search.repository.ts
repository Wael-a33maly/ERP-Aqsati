// ============================================
// Search Repository - مستودع البحث
// ============================================

import { db } from '@/lib/db'
import { SearchQueryParams, SearchResult, SearchType } from '@/models/search.model'

export const searchRepository = {
  // البحث في العملاء
  async searchCustomers(query: string, companyId?: string, limit: number = 10): Promise<SearchResult[]> {
    const customers = await db.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { code: { contains: query } },
          { phone: { contains: query } },
          { nationalId: { contains: query } },
        ],
        ...(companyId && { companyId }),
        active: true,
      },
      take: limit,
    })

    return customers.map(c => ({
      type: 'customer' as SearchType,
      id: c.id,
      title: c.name,
      subtitle: `${c.code} - ${c.phone || 'لا يوجد هاتف'}`,
      link: `/?section=customers&customer=${c.id}`,
      icon: 'user',
    }))
  },

  // البحث في المنتجات
  async searchProducts(query: string, companyId?: string, limit: number = 10): Promise<SearchResult[]> {
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { barcode: { contains: query } },
        ],
        ...(companyId && { companyId }),
        active: true,
      },
      take: limit,
    })

    return products.map(p => ({
      type: 'product' as SearchType,
      id: p.id,
      title: p.name,
      subtitle: `${p.sku} - ${p.sellPrice} ر.س`,
      link: `/?section=products&product=${p.id}`,
      icon: 'package',
    }))
  },

  // البحث في الفواتير
  async searchInvoices(query: string, companyId?: string, branchId?: string, limit: number = 10): Promise<SearchResult[]> {
    const invoices = await db.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: query } },
          { notes: { contains: query } },
        ],
        ...(companyId && { companyId }),
        ...(branchId && { branchId }),
      },
      include: {
        Customer: { select: { name: true } },
      },
      take: limit,
    })

    return invoices.map(inv => ({
      type: 'invoice' as SearchType,
      id: inv.id,
      title: inv.invoiceNumber,
      subtitle: `${inv.Customer?.name || ''} - ${inv.total} ر.س`,
      link: `/?section=invoices&invoice=${inv.id}`,
      icon: 'file-text',
    }))
  },

  // البحث في المدفوعات
  async searchPayments(query: string, companyId?: string, branchId?: string, limit: number = 10): Promise<SearchResult[]> {
    const payments = await db.payment.findMany({
      where: {
        OR: [
          { paymentNumber: { contains: query } },
          { reference: { contains: query } },
        ],
        ...(companyId && { companyId }),
        ...(branchId && { branchId }),
      },
      include: {
        Customer: { select: { name: true } },
      },
      take: limit,
    })

    return payments.map(p => ({
      type: 'payment' as SearchType,
      id: p.id,
      title: p.paymentNumber,
      subtitle: `${p.Customer?.name || ''} - ${p.amount} ر.س`,
      link: `/?section=payments`,
      icon: 'credit-card',
    }))
  },

  // البحث في العقود
  async searchContracts(query: string, limit: number = 10): Promise<SearchResult[]> {
    const contracts = await db.installmentContract.findMany({
      where: {
        OR: [
          { contractNumber: { contains: query } },
        ],
      },
      include: {
        Customer: { select: { name: true } },
      },
      take: limit,
    })

    return contracts.map(c => ({
      type: 'contract' as SearchType,
      id: c.id,
      title: c.contractNumber,
      subtitle: `${c.Customer?.name || ''} - ${c.totalAmount} ر.س`,
      link: `/?section=installments&contract=${c.id}`,
      icon: 'file-signature',
    }))
  },

  // بحث موحد
  async searchAll(params: SearchQueryParams): Promise<SearchResult[]> {
    const { query, types, limit = 50, companyId, branchId } = params
    const searchTypes = types || ['customer', 'product', 'invoice', 'payment', 'contract']
    const results: SearchResult[] = []

    const searchPromises: Promise<SearchResult[]>[] = []

    if (searchTypes.includes('customer')) {
      searchPromises.push(this.searchCustomers(query, companyId, 10))
    }
    if (searchTypes.includes('product')) {
      searchPromises.push(this.searchProducts(query, companyId, 10))
    }
    if (searchTypes.includes('invoice')) {
      searchPromises.push(this.searchInvoices(query, companyId, branchId, 10))
    }
    if (searchTypes.includes('payment')) {
      searchPromises.push(this.searchPayments(query, companyId, branchId, 10))
    }
    if (searchTypes.includes('contract')) {
      searchPromises.push(this.searchContracts(query, 10))
    }

    const searchResults = await Promise.all(searchPromises)
    searchResults.forEach(r => results.push(...r))

    // ترتيب النتائج حسب الصلة
    const sortedResults = results.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
      const bStarts = b.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
      return aStarts - bStarts
    }).slice(0, limit)

    return sortedResults
  },
}
