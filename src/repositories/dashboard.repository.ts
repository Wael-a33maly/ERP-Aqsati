// ============================================
// Dashboard Repository - مستودع لوحة التحكم
// ============================================

import { db } from '@/lib/db'
import { CachedStats } from '@/models/dashboard.model'

// تخزين مؤقت للإحصائيات
let cachedStats: CachedStats | null = null
const CACHE_TTL = 60 * 1000 // 60 ثانية

export const dashboardRepository = {
  // جلب إحصائيات لوحة التحكم
  async getStats(companyId: string | null, isSuperAdmin: boolean) {
    const companyFilter = companyId ? { companyId } : {}
    const customerCompanyFilter = companyId ? { companyId } : {}
    const invoiceCompanyFilter = companyId ? { companyId } : {}
    const paymentCompanyFilter = companyId ? { companyId } : {}

    // تنفيذ جميع الاستعلامات بالتوازي
    const [
      usersCount,
      companiesCount,
      customersCount,
      productsCount,
      branchesCount,
      zonesCount,
      warehousesCount,
      invoicesCount,
      paymentsCount,
      salesAggregation,
      paymentsAggregation,
      pendingAggregation,
      recentInvoicesRaw,
      recentPaymentsRaw,
    ] = await Promise.all([
      db.user.count({ where: companyFilter }),
      isSuperAdmin ? db.company.count() : Promise.resolve(companyId ? 1 : 0),
      db.customer.count({ where: customerCompanyFilter }),
      db.product.count({ where: companyFilter }),
      db.branch.count({ where: companyFilter }),
      db.zone.count({ where: companyFilter }),
      db.warehouse.count({ where: companyFilter }),
      db.invoice.count({ where: invoiceCompanyFilter }),
      db.payment.count({ where: paymentCompanyFilter }),
      db.invoice.aggregate({
        _sum: { total: true },
        where: invoiceCompanyFilter,
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: paymentCompanyFilter,
      }),
      db.invoice.aggregate({
        _sum: { remainingAmount: true },
        where: {
          ...invoiceCompanyFilter,
          OR: [
            { status: 'pending' },
            { status: 'partial' },
          ],
        },
      }),
      db.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: invoiceCompanyFilter,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          status: true,
          customerId: true,
        },
      }),
      db.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: paymentCompanyFilter,
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          method: true,
          customerId: true,
        },
      }),
    ])

    // تجميع معرفات العملاء
    const customerIds = new Set<string>()
    recentInvoicesRaw.forEach((inv: any) => {
      if (inv.customerId) customerIds.add(inv.customerId)
    })
    recentPaymentsRaw.forEach((pay: any) => {
      if (pay.customerId) customerIds.add(pay.customerId)
    })

    // جلب أسماء العملاء
    const customers = customerIds.size > 0
      ? await db.customer.findMany({
          where: { id: { in: Array.from(customerIds) } },
          select: { id: true, name: true },
        })
      : []

    const customerMap = new Map(customers.map((c: any) => [c.id, c.name]))

    // إضافة أسماء العملاء
    const recentInvoices = recentInvoicesRaw.map((inv: any) => ({
      ...inv,
      customer: { name: customerMap.get(inv.customerId) || 'غير محدد' },
    }))

    const recentPayments = recentPaymentsRaw.map((pay: any) => ({
      ...pay,
      customer: { name: customerMap.get(pay.customerId) || 'غير محدد' },
    }))

    // حساب الإحصائيات المالية
    const totalSales = salesAggregation._sum.total || 0
    const totalPaid = paymentsAggregation._sum.amount || 0
    const pendingAmount = pendingAggregation._sum.remainingAmount || 0

    return {
      stats: {
        users: usersCount,
        companies: companiesCount,
        customers: customersCount,
        products: productsCount,
        invoices: invoicesCount,
        payments: paymentsCount,
        branches: branchesCount,
        zones: zonesCount,
        warehouses: warehousesCount,
        totalSales,
        totalPaid,
        pendingAmount,
      },
      recentInvoices,
      recentPayments,
    }
  },

  // Cache management
  getCachedStats(): CachedStats | null {
    return cachedStats
  },

  setCachedStats(data: CachedStats): void {
    cachedStats = data
  },

  isCacheValid(timestamp: number): boolean {
    return (Date.now() - timestamp) < CACHE_TTL
  },
}
