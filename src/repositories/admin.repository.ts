/**
 * Admin Repository
 * مستودع بيانات السوبر أدمن
 */

import { db } from '@/lib/db'

export const adminRepository = {
  // === Stats ===
  async getStats() {
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalCustomers,
      totalInvoices,
      totalRevenue
    ] = await Promise.all([
      db.company.count(),
      db.company.count({ where: { active: true } }),
      db.user.count(),
      db.customer.count(),
      db.invoice.count(),
      db.payment.aggregate({ _sum: { amount: true } })
    ])

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies: totalCompanies - activeCompanies,
      totalUsers,
      totalCustomers,
      totalInvoices,
      totalRevenue: totalRevenue._sum.amount || 0
    }
  },

  async getSubscriptionsWithDetails() {
    return db.subscription.findMany({
      include: {
        SubscriptionPlan: true,
        Company: { select: { id: true, name: true, nameAr: true, email: true, active: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  async getPlanStats() {
    return db.subscriptionPlan.findMany({
      include: {
        _count: { select: { Subscription: true } }
      }
    })
  },

  async getCompaniesWithDetails() {
    return db.company.findMany({
      include: {
        User: {
          where: { role: 'COMPANY_ADMIN' },
          select: { id: true, name: true, email: true, phone: true }
        },
        Branch: { select: { id: true, name: true } },
        Subscription: {
          include: { SubscriptionPlan: true }
        },
        _count: {
          select: {
            User: true,
            Customer: true,
            Product: true,
            Branch: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  async getInvoiceCountByCompany(companyId: string) {
    return db.invoice.count({
      where: { companyId }
    })
  },

  async getRecentPaymentTransactions(limit: number = 10) {
    return db.paymentTransaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        Subscription: {
          include: { Company: { select: { name: true } } }
        }
      }
    })
  },

  // === Payment Gateways ===
  async getPaymentGateways(companyId?: string) {
    const whereClause: any = {}
    if (companyId) {
      whereClause.companyId = companyId
    }
    return db.companyPaymentGateway.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
  },

  async getGlobalPaymentSettings() {
    try {
      const settings = await db.systemSetting.findFirst({
        where: { key: 'payment_global_settings' }
      })
      return settings ? JSON.parse(settings.value || '{}') : null
    } catch {
      return null
    }
  },

  async createPaymentGateway(data: any) {
    return db.companyPaymentGateway.create({ data })
  },

  async updatePaymentGateway(id: string, data: any) {
    return db.companyPaymentGateway.update({
      where: { id },
      data
    })
  },

  async deletePaymentGateway(id: string) {
    return db.companyPaymentGateway.delete({
      where: { id }
    })
  },

  // === Collections ===
  async getActiveCompaniesWithSubscriptions() {
    return db.company.findMany({
      where: { active: true },
      include: {
        Subscription: {
          include: { SubscriptionPlan: true }
        },
        _count: {
          select: {
            Customer: true,
            Invoice: true,
            Payment: true,
            User: true
          }
        }
      }
    })
  },

  async getCompanyPayments(companyId: string, startDate: Date) {
    return db.payment.findMany({
      where: {
        companyId,
        paymentDate: { gte: startDate }
      },
      select: { amount: true, method: true }
    })
  },

  async getCompanyInvoices(companyId: string, startDate: Date) {
    return db.invoice.findMany({
      where: {
        companyId,
        invoiceDate: { gte: startDate }
      },
      select: { total: true, remainingAmount: true, status: true }
    })
  },

  // === Backup ===
  async getAllCompanies() {
    return db.company.findMany()
  },

  async getAllUsers() {
    return db.user.findMany({ select: { password: false } })
  },

  async getAllCustomers() {
    return db.customer.findMany()
  },

  async getAllProducts() {
    return db.product.findMany()
  },

  async getAllInvoices() {
    return db.invoice.findMany()
  },

  async getAllPayments() {
    return db.payment.findMany()
  },

  async getAllBranches() {
    return db.branch.findMany()
  },

  async getAllWarehouses() {
    return db.warehouse.findMany()
  },

  async getAllZones() {
    return db.zone.findMany()
  },

  async getAllSubscriptions() {
    return db.subscription.findMany()
  },

  async getAllSubscriptionPlans() {
    return db.subscriptionPlan.findMany()
  },

  async getAllSystemSettings() {
    return db.systemSetting.findMany()
  },

  async getCompanyById(companyId: string) {
    return db.company.findUnique({ where: { id: companyId } })
  },

  async getCompanyUsers(companyId: string) {
    return db.user.findMany({ where: { companyId }, select: { password: false } })
  },

  async getCompanyCustomers(companyId: string) {
    return db.customer.findMany({ where: { companyId } })
  },

  async getCompanyProducts(companyId: string) {
    return db.product.findMany({ where: { companyId } })
  },

  async getCompanyInvoicesByCompany(companyId: string) {
    return db.invoice.findMany({ where: { companyId } })
  },

  async getCompanyPaymentsByCompany(companyId: string) {
    return db.payment.findMany({ where: { companyId } })
  },

  async getCompanyBranches(companyId: string) {
    return db.branch.findMany({ where: { companyId } })
  },

  async getCompanyWarehouses(companyId: string) {
    return db.warehouse.findMany({ where: { companyId } })
  },

  async getCompanyZones(companyId: string) {
    return db.zone.findMany({ where: { companyId } })
  },

  async getCompanyPaymentGateways(companyId: string) {
    return db.companyPaymentGateway.findMany({ where: { companyId } })
  },

  async getCompanySuppliers(companyId: string) {
    return db.supplier.findMany({ where: { companyId } })
  },

  async getCompanyPurchaseInvoices(companyId: string) {
    return db.purchaseInvoice.findMany({ where: { companyId } })
  },

  async getCompanySubscriptions(companyId: string) {
    return db.subscription.findMany({ where: { companyId } })
  },

  // === Restore ===
  async createCompany(data: any) {
    return db.company.create({ data })
  },

  async findCompanyByCode(code: string) {
    return db.company.findFirst({ where: { code } })
  },

  async createBranch(data: any) {
    return db.branch.create({ data }).catch(() => null)
  },

  async createWarehouse(data: any) {
    return db.warehouse.create({ data }).catch(() => null)
  },

  async createCustomer(data: any) {
    return db.customer.create({ data }).catch(() => null)
  },

  async createProduct(data: any) {
    return db.product.create({ data }).catch(() => null)
  },

  async createInvoice(data: any) {
    return db.invoice.create({ data }).catch(() => null)
  },

  async createPayment(data: any) {
    return db.payment.create({ data }).catch(() => null)
  },

  // === Danger Zone ===
  async deleteCompanyData(companyId: string) {
    return db.$transaction([
      db.payment.deleteMany({ where: { companyId } }),
      db.invoice.deleteMany({ where: { companyId } }),
      db.customer.deleteMany({ where: { companyId } }),
      db.product.deleteMany({ where: { companyId } }),
      db.warehouse.deleteMany({ where: { companyId } }),
      db.zone.deleteMany({ where: { companyId } }),
      db.branch.deleteMany({ where: { companyId } }),
      db.companyPaymentGateway.deleteMany({ where: { companyId } }),
      db.supplier.deleteMany({ where: { companyId } }),
      db.purchaseInvoice.deleteMany({ where: { companyId } }),
      db.purchaseReturn.deleteMany({ where: { companyId } }),
      db.supplierPayment.deleteMany({ where: { companyId } }),
      db.inventoryTransfer.deleteMany({ where: { companyId } }),
      db.costLayer.deleteMany({ where: { companyId } }),
      db.inventoryValuation.deleteMany({ where: { companyId } }),
      db.user.deleteMany({ where: { companyId } }),
      db.subscription.deleteMany({ where: { companyId } }),
      db.company.delete({ where: { id: companyId } })
    ])
  },

  async deleteAllData() {
    return db.$transaction([
      db.payment.deleteMany(),
      db.invoice.deleteMany(),
      db.customer.deleteMany(),
      db.product.deleteMany(),
      db.warehouse.deleteMany(),
      db.zone.deleteMany(),
      db.branch.deleteMany(),
      db.companyPaymentGateway.deleteMany(),
      db.supplier.deleteMany(),
      db.purchaseInvoice.deleteMany(),
      db.purchaseReturn.deleteMany(),
      db.supplierPayment.deleteMany(),
      db.supplierTransaction.deleteMany(),
      db.inventoryTransfer.deleteMany(),
      db.costLayer.deleteMany(),
      db.inventoryValuation.deleteMany(),
      db.inventoryMovement.deleteMany(),
      db.inventory.deleteMany(),
      db.user.deleteMany(),
      db.subscription.deleteMany(),
      db.featureUsage.deleteMany(),
      db.paymentTransaction.deleteMany(),
      db.planFeature.deleteMany(),
      db.subscriptionPlan.deleteMany(),
      db.company.deleteMany(),
      db.auditLog.deleteMany(),
      db.notification.deleteMany(),
      db.registrationRequest.deleteMany()
    ])
  },

  // === Impersonate ===
  async getCompanyWithBranches(companyId: string) {
    return db.company.findUnique({
      where: { id: companyId },
      include: {
        Branch: {
          orderBy: { isMain: 'desc' },
          take: 1
        }
      }
    })
  }
}
