// نظام البحث الموحد
import { db } from '@/lib/db'

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle?: string
  link: string
  icon?: string
  metadata?: any
}

interface SearchOptions {
  companyId?: string
  branchId?: string
  userId?: string
  role?: string
  limit?: number
  types?: string[]
}

// أنواع البحث المتاحة
export const SearchTypes = {
  CUSTOMER: 'customer',
  PRODUCT: 'product',
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  CONTRACT: 'contract',
  USER: 'user',
  BRANCH: 'branch',
  COMPANY: 'company',
} as const

// البحث الموحد
export async function globalSearch(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const { companyId, branchId, userId, role, limit = 50, types } = options
  const results: SearchResult[] = []
  const searchQuery = `%${query}%`
  
  // تحديد الأنواع المراد البحث عنها
  const searchTypes = types || Object.values(SearchTypes)
  
  // البحث في العملاء
  if (searchTypes.includes(SearchTypes.CUSTOMER)) {
    const customers = await db.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { code: { contains: query } },
          { phone: { contains: query } },
          { nationalId: { contains: query } },
        ],
        ...(companyId && { companyId }),
        ...(branchId && { branchId }),
        active: true,
      },
      take: 10,
    })
    
    results.push(...customers.map(c => ({
      type: SearchTypes.CUSTOMER,
      id: c.id,
      title: c.name,
      subtitle: `${c.code} - ${c.phone || ''}`,
      link: `/customers/${c.id}`,
      icon: 'user',
      metadata: { phone: c.phone, code: c.code },
    })))
  }
  
  // البحث في المنتجات
  if (searchTypes.includes(SearchTypes.PRODUCT)) {
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
      include: { ProductCategory: true },
      take: 10,
    })
    
    results.push(...products.map(p => ({
      type: SearchTypes.PRODUCT,
      id: p.id,
      title: p.name,
      subtitle: `${p.sku} - ${p.sellPrice} ر.س`,
      link: `/products/${p.id}`,
      icon: 'package',
      metadata: { sku: p.sku, price: p.sellPrice },
    })))
  }
  
  // البحث في الفواتير
  if (searchTypes.includes(SearchTypes.INVOICE)) {
    const invoices = await db.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: query } },
          { notes: { contains: query } },
        ],
        ...(companyId && { companyId }),
        ...(branchId && { branchId }),
      },
      include: { Customer: true },
      take: 10,
    })
    
    results.push(...invoices.map(inv => ({
      type: SearchTypes.INVOICE,
      id: inv.id,
      title: inv.invoiceNumber,
      subtitle: `${inv.Customer?.name || ''} - ${inv.total} ر.س`,
      link: `/invoices/${inv.id}`,
      icon: 'file-text',
      metadata: { status: inv.status, total: inv.total },
    })))
  }
  
  // البحث في المدفوعات
  if (searchTypes.includes(SearchTypes.PAYMENT)) {
    const payments = await db.payment.findMany({
      where: {
        OR: [
          { paymentNumber: { contains: query } },
          { reference: { contains: query } },
        ],
        ...(companyId && { companyId }),
        ...(branchId && { branchId }),
      },
      include: { Customer: true },
      take: 10,
    })
    
    results.push(...payments.map(p => ({
      type: SearchTypes.PAYMENT,
      id: p.id,
      title: p.paymentNumber,
      subtitle: `${p.Customer?.name || ''} - ${p.amount} ر.س`,
      link: `/payments`,
      icon: 'credit-card',
      metadata: { amount: p.amount, method: p.method },
    })))
  }
  
  // البحث في العقود
  if (searchTypes.includes(SearchTypes.CONTRACT)) {
    const contracts = await db.installmentContract.findMany({
      where: {
        OR: [
          { contractNumber: { contains: query } },
        ],
        ...(companyId && { Invoice: { companyId } }),
      },
      include: { Customer: true, Invoice: true },
      take: 10,
    })
    
    results.push(...contracts.map(c => ({
      type: SearchTypes.CONTRACT,
      id: c.id,
      title: c.contractNumber,
      subtitle: `${c.Customer?.name || ''} - ${c.totalAmount} ر.س`,
      link: `/installments/${c.id}`,
      icon: 'file-signature',
      metadata: { status: c.status, total: c.totalAmount },
    })))
  }
  
  // البحث في المستخدمين (للمديرين فقط)
  if (searchTypes.includes(SearchTypes.USER) && ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(role || '')) {
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
        ...(companyId && { companyId }),
        active: true,
      },
      take: 10,
    })
    
    results.push(...users.map(u => ({
      type: SearchTypes.USER,
      id: u.id,
      title: u.name,
      subtitle: `${u.email} - ${u.role}`,
      link: `/users/${u.id}`,
      icon: 'user-cog',
      metadata: { role: u.role },
    })))
  }
  
  // البحث في الفروع
  if (searchTypes.includes(SearchTypes.BRANCH) && ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(role || '')) {
    const branches = await db.branch.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { code: { contains: query } },
        ],
        ...(companyId && { companyId }),
        active: true,
      },
      take: 10,
    })
    
    results.push(...branches.map(b => ({
      type: SearchTypes.BRANCH,
      id: b.id,
      title: b.name,
      subtitle: b.code,
      link: `/branches/${b.id}`,
      icon: 'building',
    })))
  }
  
  // البحث في الشركات (للسوبر أدمن فقط)
  if (searchTypes.includes(SearchTypes.COMPANY) && role === 'SUPER_ADMIN') {
    const companies = await db.company.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { code: { contains: query } },
        ],
        active: true,
      },
      take: 10,
    })
    
    results.push(...companies.map(c => ({
      type: SearchTypes.COMPANY,
      id: c.id,
      title: c.name,
      subtitle: c.code,
      link: `/companies/${c.id}`,
      icon: 'briefcase',
    })))
  }
  
  // ترتيب النتائج حسب الصلة
  return results
    .sort((a, b) => {
      // النتائج التي تبدأ بالبحث أولاً
      const aStarts = a.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
      const bStarts = b.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
      return aStarts - bStarts
    })
    .slice(0, limit)
}

// بحث سريع للـ autocomplete
export async function quickSearch(query: string, type: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  return globalSearch(query, { ...options, types: [type], limit: 10 })
}

// اقتراحات البحث
export async function getSearchSuggestions(companyId?: string): Promise<string[]> {
  // يمكن تحسين هذا لاحقاً بناءً على تاريخ البحث
  const suggestions: string[] = []
  
  // الحصول على أحدث العملاء
  const recentCustomers = await db.customer.findMany({
    where: { ...(companyId && { companyId }) },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { name: true },
  })
  suggestions.push(...recentCustomers.map(c => c.name))
  
  // الحصول على أحدث المنتجات
  const recentProducts = await db.product.findMany({
    where: { ...(companyId && { companyId }) },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { name: true },
  })
  suggestions.push(...recentProducts.map(p => p.name))
  
  return suggestions
}
