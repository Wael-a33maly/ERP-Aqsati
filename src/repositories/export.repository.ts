// ============================================
// Export Repository - مستودع التصدير
// ============================================

import { db } from '@/lib/db'
import { ExportFilters } from '@/models/export.model'

export const exportRepository = {
  // جلب بيانات العملاء
  async fetchCustomers(filters?: ExportFilters) {
    const where = buildWhereClause(filters)
    return db.customer.findMany({
      where,
      include: {
        Company: { select: { name: true } },
        Branch: { select: { name: true } },
        User: { select: { name: true } },
        governorate: { select: { name: true } },
        city: { select: { name: true } },
        area: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  // جلب بيانات المنتجات
  async fetchProducts(filters?: ExportFilters) {
    const where = buildWhereClause(filters)
    return db.product.findMany({
      where,
      include: {
        Company: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  // جلب بيانات الفواتير
  async fetchInvoices(filters?: ExportFilters) {
    const where = buildWhereClause(filters)
    return db.invoice.findMany({
      where,
      include: {
        Customer: { select: { name: true, phone: true } },
        Branch: { select: { name: true } },
        User: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  // جلب بيانات المدفوعات
  async fetchPayments(filters?: ExportFilters) {
    const where = buildWhereClause(filters)
    return db.payment.findMany({
      where,
      include: {
        Customer: { select: { name: true, phone: true } },
        Invoice: { select: { invoiceNumber: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  // جلب بيانات الأقساط
  async fetchInstallments(filters?: ExportFilters) {
    const where = buildWhereClause(filters)
    return db.installment.findMany({
      where,
      include: {
        InstallmentContract: {
          include: {
            Customer: { select: { name: true } },
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })
  },

  // جلب بيانات المخزون
  async fetchInventory(filters?: ExportFilters) {
    const where = buildWhereClause(filters)
    return db.inventory.findMany({
      where,
      include: {
        Product: { select: { name: true, sku: true } },
        Warehouse: { select: { name: true } },
      }
    })
  },

  // جلب البيانات حسب النوع
  async fetchData(entity: string, filters?: ExportFilters): Promise<any[]> {
    switch (entity) {
      case 'customers':
        return this.fetchCustomers(filters)
      case 'products':
        return this.fetchProducts(filters)
      case 'invoices':
        return this.fetchInvoices(filters)
      case 'payments':
        return this.fetchPayments(filters)
      case 'installments':
        return this.fetchInstallments(filters)
      case 'inventory':
        return this.fetchInventory(filters)
      default:
        return []
    }
  },
}

// بناء شرط الفلترة
function buildWhereClause(filters?: ExportFilters): any {
  const where: any = {}
  
  if (filters?.companyId) where.companyId = filters.companyId
  if (filters?.branchId) where.branchId = filters.branchId
  if (filters?.status) where.status = filters.status
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
  }
  
  return where
}
