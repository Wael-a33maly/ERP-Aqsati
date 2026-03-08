/**
 * Admin Service
 * خدمات لوحة تحكم السوبر أدمن
 */

import { adminRepository } from '@/repositories/admin.repository'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync, readdirSync, statSync } from 'fs'
import path from 'path'
import type {
  AdminStatsResponse,
  PaymentGatewayInput,
  PaymentGatewayUpdateInput,
  CollectionsQueryParams,
  CollectionsResponse,
  BackupCreateInput,
  RestoreInput,
  DangerDeleteInput,
  ImpersonateInput
} from '@/models/admin.model'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// التأكد من وجود مجلد النسخ الاحتياطية
async function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true })
  }
}

export const adminService = {
  // === Stats ===
  async getAdminStats(): Promise<AdminStatsResponse> {
    const stats = await adminRepository.getStats()
    const subscriptions = await adminRepository.getSubscriptionsWithDetails()
    const planStats = await adminRepository.getPlanStats()
    const companies = await adminRepository.getCompaniesWithDetails()
    const recentPayments = await adminRepository.getRecentPaymentTransactions()

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
    const trialSubscriptions = subscriptions.filter(s => s.status === 'trial').length
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled').length

    // جلب عدد الفواتير لكل شركة
    const companiesWithInvoices = await Promise.all(
      companies.map(async (company) => {
        const invoiceCount = await adminRepository.getInvoiceCountByCompany(company.id)
        return { id: company.id, invoiceCount }
      })
    )

    return {
      stats: {
        ...stats,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions
      },
      planStats: planStats.map(p => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        price: p.price,
        subscribers: p._count.Subscription
      })),
      companies: companies.map(c => {
        const invoiceData = companiesWithInvoices.find(i => i.id === c.id)
        return {
          id: c.id,
          name: c.name,
          nameAr: c.nameAr,
          code: c.code,
          email: c.email,
          phone: c.phone,
          active: c.active,
          subscriptionStatus: c.subscriptionStatus,
          createdAt: c.createdAt,
          admin: c.User[0] || null,
          subscription: c.Subscription ? {
            planName: c.Subscription.SubscriptionPlan?.nameAr || c.Subscription.SubscriptionPlan?.name,
            status: c.Subscription.status,
            endDate: c.Subscription.endDate,
            finalPrice: c.Subscription.finalPrice
          } : null,
          counts: {
            users: c._count.User,
            customers: c._count.Customer,
            invoices: invoiceData?.invoiceCount || 0,
            products: c._count.Product,
            branches: c._count.Branch
          }
        }
      }),
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
        companyName: p.Subscription?.Company?.name
      }))
    }
  },

  // === Payment Gateways ===
  async getPaymentGateways(companyId?: string) {
    const gateways = await adminRepository.getPaymentGateways(companyId)
    const globalSettings = await adminRepository.getGlobalPaymentSettings()

    return {
      gateways,
      globalSettings: globalSettings || {
        defaultCurrency: 'EGP',
        callbackBaseUrl: '',
        webhookEnabled: true,
        autoSettlement: false,
        settlementSchedule: 'daily',
        notificationEmail: '',
        fraudDetection: true,
        maxRetryAttempts: 3
      }
    }
  },

  async createPaymentGateway(data: PaymentGatewayInput) {
    return adminRepository.createPaymentGateway({
      gatewayType: data.gatewayType,
      name: data.name,
      nameAr: data.nameAr,
      companyId: data.companyId || null,
      merchantId: data.merchantId || null,
      merchantSecret: data.merchantSecret || null,
      apiKey: data.apiKey || null,
      apiSecret: data.apiSecret || null,
      walletNumber: data.walletNumber || null,
      accountNumber: data.accountNumber || null,
      bankCode: data.bankCode || null,
      callbackUrl: data.callbackUrl || null,
      webhookSecret: data.webhookSecret || null,
      isLive: data.isLive || false,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault || false,
      feesPercent: data.feesPercent || 0,
      feesFixed: data.feesFixed || 0,
      minAmount: data.minAmount || null,
      maxAmount: data.maxAmount || null,
      settlementDays: data.settlementDays || 1
    })
  },

  async updatePaymentGateway(data: PaymentGatewayUpdateInput) {
    const { id, ...updateData } = data
    return adminRepository.updatePaymentGateway(id, updateData)
  },

  async togglePaymentGateway(id: string, isActive: boolean) {
    return adminRepository.updatePaymentGateway(id, { isActive })
  },

  async deletePaymentGateway(id: string) {
    return adminRepository.deletePaymentGateway(id)
  },

  // === Collections ===
  async getCollections(params: CollectionsQueryParams): Promise<CollectionsResponse> {
    const { period = 'month' } = params

    // تحديد نطاق التاريخ
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    const companies = await adminRepository.getActiveCompaniesWithSubscriptions()

    // جلب المدفوعات لكل شركة
    const companyCollections = await Promise.all(
      companies.map(async (company) => {
        const payments = await adminRepository.getCompanyPayments(company.id, startDate)
        const invoices = await adminRepository.getCompanyInvoices(company.id, startDate)

        const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const totalSales = invoices.reduce((sum, i) => sum + (i.total || 0), 0)
        const pendingAmount = invoices.reduce((sum, i) => sum + (i.remainingAmount || 0), 0)
        const collectionRate = totalSales > 0 ? Math.round((totalCollected / totalSales) * 100) : 0

        // تصنيف حسب طريقة الدفع
        const byMethod: Record<string, number> = {}
        payments.forEach(p => {
          byMethod[p.method] = (byMethod[p.method] || 0) + (p.amount || 0)
        })

        return {
          id: company.id,
          name: company.name,
          nameAr: company.nameAr,
          code: company.code,
          subscriptionStatus: company.subscriptionStatus,
          plan: company.Subscription?.SubscriptionPlan?.nameAr || 'بدون خطة',
          collected: totalCollected,
          sales: totalSales,
          pending: pendingAmount,
          collectionRate,
          byMethod,
          counts: {
            customers: company._count.Customer,
            invoices: company._count.Invoice,
            payments: company._count.Payment,
            users: company._count.User
          }
        }
      })
    )

    // إجماليات النظام
    const totals = {
      totalCollected: companyCollections.reduce((sum, c) => sum + c.collected, 0),
      totalSales: companyCollections.reduce((sum, c) => sum + c.sales, 0),
      totalPending: companyCollections.reduce((sum, c) => sum + c.pending, 0),
      totalCompanies: companies.length,
      activeCompanies: companies.filter(c => c.subscriptionStatus === 'active').length,
      trialCompanies: companies.filter(c => c.subscriptionStatus === 'trial').length,
      expiredCompanies: companies.filter(c => c.subscriptionStatus === 'expired' || c.subscriptionStatus === 'cancelled').length
    }

    // ترتيب حسب أعلى تحصيل
    companyCollections.sort((a, b) => b.collected - a.collected)

    return {
      period,
      startDate,
      endDate: now,
      totals,
      companies: companyCollections
    }
  },

  // === Backup ===
  async getBackupList() {
    await ensureBackupDir()

    const files = readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const filePath = path.join(BACKUP_DIR, f)
        const stats = statSync(filePath)
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime,
          type: f.includes('full') ? 'full' : 'company'
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return files
  },

  async downloadBackup(filename: string) {
    const filePath = path.join(BACKUP_DIR, filename)
    if (!existsSync(filePath)) {
      throw new Error('الملف غير موجود')
    }
    return readFile(filePath, 'utf-8')
  },

  async createBackup(data: BackupCreateInput, userId: string) {
    await ensureBackupDir()

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let filename = ''
    let backupData: any = {}

    if (data.type === 'full') {
      filename = `backup-full-${timestamp}.json`

      const [
        companies, users, customers, products, invoices, payments,
        branches, warehouses, zones, subscriptions, plans, settings
      ] = await Promise.all([
        adminRepository.getAllCompanies(),
        adminRepository.getAllUsers(),
        adminRepository.getAllCustomers(),
        adminRepository.getAllProducts(),
        adminRepository.getAllInvoices(),
        adminRepository.getAllPayments(),
        adminRepository.getAllBranches(),
        adminRepository.getAllWarehouses(),
        adminRepository.getAllZones(),
        adminRepository.getAllSubscriptions(),
        adminRepository.getAllSubscriptionPlans(),
        adminRepository.getAllSystemSettings()
      ])

      backupData = {
        type: 'full',
        createdAt: new Date().toISOString(),
        createdBy: userId,
        data: {
          companies, users, customers, products, invoices, payments,
          branches, warehouses, zones, subscriptions, plans, settings
        }
      }
    } else if (data.type === 'company' && data.companyId) {
      const company = await adminRepository.getCompanyById(data.companyId)
      if (!company) {
        throw new Error('الشركة غير موجودة')
      }

      filename = `backup-company-${company.code}-${timestamp}.json`

      const [
        users, customers, products, invoices, payments,
        branches, warehouses, zones, paymentGateways, suppliers,
        purchaseInvoices, subscriptions
      ] = await Promise.all([
        adminRepository.getCompanyUsers(data.companyId),
        adminRepository.getCompanyCustomers(data.companyId),
        adminRepository.getCompanyProducts(data.companyId),
        adminRepository.getCompanyInvoicesByCompany(data.companyId),
        adminRepository.getCompanyPaymentsByCompany(data.companyId),
        adminRepository.getCompanyBranches(data.companyId),
        adminRepository.getCompanyWarehouses(data.companyId),
        adminRepository.getCompanyZones(data.companyId),
        adminRepository.getCompanyPaymentGateways(data.companyId),
        adminRepository.getCompanySuppliers(data.companyId),
        adminRepository.getCompanyPurchaseInvoices(data.companyId),
        adminRepository.getCompanySubscriptions(data.companyId)
      ])

      backupData = {
        type: 'company',
        companyId: data.companyId,
        companyName: company.name,
        companyCode: company.code,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        data: {
          company,
          users, customers, products, invoices, payments,
          branches, warehouses, zones, paymentGateways, suppliers,
          purchaseInvoices, subscriptions
        }
      }
    } else {
      throw new Error('نوع النسخة الاحتياطية غير صالح')
    }

    const filePath = path.join(BACKUP_DIR, filename)
    await writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8')

    return {
      filename,
      size: Buffer.byteLength(JSON.stringify(backupData))
    }
  },

  async deleteBackup(filename: string) {
    const filePath = path.join(BACKUP_DIR, filename)
    if (!existsSync(filePath)) {
      throw new Error('الملف غير موجود')
    }
    await unlink(filePath)
  },

  // === Restore ===
  async restoreBackup(data: RestoreInput) {
    const filePath = path.join(BACKUP_DIR, data.filename)
    if (!existsSync(filePath)) {
      throw new Error('الملف غير موجود')
    }

    const content = await readFile(filePath, 'utf-8')
    const backupData = JSON.parse(content)

    if (!backupData.type || !backupData.data) {
      throw new Error('ملف نسخة احتياطية غير صالح')
    }

    // تحذير: هذا سيحذف البيانات الحالية
    if (!data.confirmDelete) {
      return {
        requiresConfirmation: true,
        backupInfo: {
          type: backupData.type,
          createdAt: backupData.createdAt,
          companyName: backupData.companyName
        }
      }
    }

    // تنفيذ الاستعادة حسب النوع
    if (backupData.type === 'company') {
      const companyData = backupData.data

      // التحقق من وجود الشركة أو إنشائها
      let company = await adminRepository.getCompanyById(backupData.companyId)

      if (!company && companyData.company) {
        try {
          company = await adminRepository.createCompany(companyData.company)
        } catch {
          company = await adminRepository.findCompanyByCode(companyData.company.code)
        }
      }

      if (!company) {
        throw new Error('فشل في إنشاء الشركة')
      }

      // استعادة بيانات الشركة
      const companyIdFix = { companyId: company.id }

      if (companyData.branches?.length) {
        for (const b of companyData.branches) {
          await adminRepository.createBranch({ ...b, ...companyIdFix })
        }
      }
      if (companyData.warehouses?.length) {
        for (const w of companyData.warehouses) {
          await adminRepository.createWarehouse({ ...w, ...companyIdFix })
        }
      }
      if (companyData.customers?.length) {
        for (const c of companyData.customers) {
          await adminRepository.createCustomer({ ...c, ...companyIdFix })
        }
      }
      if (companyData.products?.length) {
        for (const p of companyData.products) {
          await adminRepository.createProduct({ ...p, ...companyIdFix })
        }
      }
      if (companyData.invoices?.length) {
        for (const i of companyData.invoices) {
          await adminRepository.createInvoice({ ...i, ...companyIdFix })
        }
      }
      if (companyData.payments?.length) {
        for (const p of companyData.payments) {
          await adminRepository.createPayment({ ...p, ...companyIdFix })
        }
      }
    }

    return { success: true }
  },

  // === Danger Zone ===
  async deleteData(data: DangerDeleteInput) {
    // التحقق من كلمة التأكيد
    if (data.confirmation !== 'DELETE_ALL_DATA_CONFIRM') {
      throw new Error('كلمة التأكيد غير صحيحة')
    }

    if (data.scope === 'company' && data.companyId) {
      await adminRepository.deleteCompanyData(data.companyId)
      return { message: 'تم حذف بيانات الشركة بنجاح' }
    } else if (data.scope === 'all') {
      await adminRepository.deleteAllData()
      return { message: 'تم حذف جميع البيانات بنجاح' }
    }

    throw new Error('نوع المسح غير صالح')
  },

  // === Impersonate ===
  async startImpersonate(data: ImpersonateInput) {
    const company = await adminRepository.getCompanyWithBranches(data.companyId)

    if (!company) {
      throw new Error('الشركة غير موجودة')
    }

    const mainBranch = company.Branch[0]

    return {
      companyId: data.companyId,
      companyName: company.name,
      branchId: mainBranch?.id,
      branchName: mainBranch?.name
    }
  }
}
