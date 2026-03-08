/**
 * Admin Repository
 * مستودع بيانات الإدارة
 */

import { db } from '@/lib/db'
import type { AdminStatsParams } from '@/models/admin.model'

export const adminRepository = {
  async getStats(params: AdminStatsParams) {
    const { companyId, dateFrom, dateTo } = params

    const dateFilter: any = {}
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {}
      if (dateFrom) dateFilter.createdAt.gte = new Date(dateFrom)
      if (dateTo) dateFilter.createdAt.lte = new Date(dateTo)
    }

    const companyWhere = companyId ? { companyId } : {}

    const [
      companies,
      users,
      customers,
      products,
      invoices,
      payments,
      activeSubscriptions
    ] = await Promise.all([
      db.company.count(),
      db.user.count({ where: companyWhere }),
      db.customer.count({ where: companyWhere }),
      db.product.count({ where: companyWhere }),
      db.invoice.count({ where: { ...companyWhere, ...dateFilter } }),
      db.payment.count({ where: dateFilter }),
      db.subscription.count({ where: { status: { in: ['trial', 'active'] } } })
    ])

    const revenue = await db.payment.aggregate({
      where: dateFilter,
      _sum: { amount: true }
    })

    return {
      companies,
      users,
      customers,
      products,
      invoices,
      payments,
      activeSubscriptions,
      revenue: revenue._sum.amount || 0
    }
  },

  async getRecentActivity(limit: number = 20) {
    const [recentUsers, recentCompanies, recentInvoices] = await Promise.all([
      db.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true }
      }),
      db.company.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, nameAr: true, createdAt: true }
      }),
      db.invoice.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, invoiceNumber: true, total: true, createdAt: true }
      })
    ])

    return { recentUsers, recentCompanies, recentInvoices }
  },

  async getSystemHealth() {
    const dbCheck = await db.$queryRaw`SELECT 1`

    return {
      database: !!dbCheck,
      timestamp: new Date().toISOString()
    }
  },

  async getBackups() {
    // This would typically query a backups table or external storage
    return []
  },

  async createBackup(data: { type: string; description?: string }) {
    // This would typically create a backup job
    return {
      id: `backup-${Date.now()}`,
      type: data.type,
      status: 'pending',
      createdAt: new Date()
    }
  },

  async restoreBackup(backupId: string) {
    // This would typically restore from backup
    return {
      success: true,
      backupId,
      restoredAt: new Date()
    }
  }
}
