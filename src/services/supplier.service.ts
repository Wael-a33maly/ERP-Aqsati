/**
 * Supplier Service
 * خدمات الموردين
 */

import { db } from '@/lib/db'
import { supplierRepository } from '@/repositories/supplier.repository'
import {
  SupplierQueryParams,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@/models/supplier.model'

export const supplierService = {
  /**
   * جلب جميع الموردين
   */
  async getSuppliers(params: SupplierQueryParams) {
    const { page = 1, limit = 50 } = params

    const { suppliers, total } = await supplierRepository.findMany(params)

    return {
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * جلب مورد بالمعرف
   */
  async getSupplier(id: string) {
    const supplier = await supplierRepository.findById(id)

    if (!supplier) {
      return {
        success: false,
        error: 'المورد غير موجود',
      }
    }

    return {
      success: true,
      data: supplier,
    }
  },

  /**
   * إنشاء مورد جديد
   */
  async createSupplier(data: CreateSupplierInput) {
    // التحقق من البيانات المطلوبة
    if (!data.companyId || !data.name) {
      return {
        success: false,
        error: 'البيانات غير مكتملة',
      }
    }

    // توليد كود المورد
    const year = new Date().getFullYear()
    const prefix = `SUP-${year}-`

    const lastSupplier = await supplierRepository.findLastByCodePrefix(data.companyId, prefix)

    let sequence = 1
    if (lastSupplier) {
      const parts = lastSupplier.supplierCode.split('-')
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1
      }
    }

    const supplierCode = `${prefix}${String(sequence).padStart(5, '0')}`

    // إنشاء المورد
    const supplier = await supplierRepository.create({
      supplierCode,
      Company: { connect: { id: data.companyId } },
      name: data.name,
      nameAr: data.nameAr,
      phone: data.phone,
      phone2: data.phone2,
      email: data.email,
      address: data.address,
      city: data.city,
      taxNumber: data.taxNumber,
      commercialReg: data.commercialReg,
      creditLimit: data.creditLimit || 0,
      currentBalance: data.openingBalance || 0,
      balanceType: data.balanceType || 'CREDIT',
      paymentTerms: data.paymentTerms || 0,
      currency: data.currency || 'EGP',
      notes: data.notes,
      active: data.active !== false,
    })

    // إنشاء قيد رصيد أول المدة إذا وجد
    if (data.hasOpeningBalance && data.openingBalance && data.openingBalance > 0) {
      const transactionNumber = `OPN-${year}-${String(sequence).padStart(6, '0')}`

      await supplierRepository.createTransaction({
        Company: { connect: { id: data.companyId } },
        Supplier: { connect: { id: supplier.id } },
        transactionType: 'OPENING',
        transactionNumber,
        transactionDate: new Date(),
        debit: data.balanceType === 'DEBIT' ? data.openingBalance : 0,
        credit: data.balanceType === 'CREDIT' ? data.openingBalance : 0,
        balance: data.openingBalance,
        notes: 'رصيد أول المدة',
      })
    }

    return {
      success: true,
      data: supplier,
    }
  },

  /**
   * تحديث مورد
   */
  async updateSupplier(data: UpdateSupplierInput) {
    const { id, ...updateData } = data

    if (!id) {
      return {
        success: false,
        error: 'معرف المورد مطلوب',
      }
    }

    // التحقق من وجود المورد
    const existingSupplier = await supplierRepository.findById(id)

    if (!existingSupplier) {
      return {
        success: false,
        error: 'المورد غير موجود',
      }
    }

    const supplier = await supplierRepository.update(id, {
      ...updateData,
      updatedAt: new Date(),
    })

    return {
      success: true,
      data: supplier,
    }
  },

  /**
   * حذف مورد
   */
  async deleteSupplier(id: string) {
    // التحقق من وجود المورد
    const existingSupplier = await supplierRepository.findById(id)

    if (!existingSupplier) {
      return {
        success: false,
        error: 'المورد غير موجود',
      }
    }

    // التحقق من عدم وجود بيانات مرتبطة
    if (
      existingSupplier._count.PurchaseInvoice > 0 ||
      existingSupplier._count.PurchaseReturn > 0 ||
      existingSupplier._count.SupplierPayment > 0
    ) {
      return {
        success: false,
        error: 'لا يمكن حذف المورد لوجود بيانات مرتبطة به',
      }
    }

    await supplierRepository.delete(id)

    return {
      success: true,
      message: 'تم حذف المورد بنجاح',
    }
  },

  /**
   * جلب كشف حساب مورد
   */
  async getSupplierStatement(supplierId: string, params: {
    companyId?: string
    fromDate?: string
    toDate?: string
  }) {
    // جلب بيانات المورد
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        Company: { select: { id: true, name: true, currency: true } },
      },
    })

    if (!supplier) {
      return { success: false, error: 'المورد غير موجود' }
    }

    // بناء شروط البحث
    const dateFilter: Record<string, Date> = {}
    if (params.fromDate) dateFilter.gte = new Date(params.fromDate)
    if (params.toDate) dateFilter.lte = new Date(params.toDate)

    const transactionWhere: any = {
      supplierId,
      companyId: params.companyId || supplier.companyId,
    }

    if (params.fromDate || params.toDate) {
      transactionWhere.transactionDate = dateFilter
    }

    // جلب الحركات
    const transactions = await db.supplierTransaction.findMany({
      where: transactionWhere,
      orderBy: { transactionDate: 'asc' },
    })

    // حساب الإجماليات
    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0)
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0)
    const currentBalance = supplier.currentBalance

    // تقرير أعمار الديون
    const today = new Date()
    const agingBuckets = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      total: 0,
    }

    // جلب الفواتير غير المدفوعة بالكامل
    const unpaidInvoices = await db.purchaseInvoice.findMany({
      where: {
        supplierId,
        status: { in: ['approved', 'partial'] },
        remainingAmount: { gt: 0 },
      },
      orderBy: { invoiceDate: 'asc' },
    })

    for (const invoice of unpaidInvoices) {
      const daysDiff = Math.floor(
        (today.getTime() - new Date(invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff <= 30) {
        agingBuckets.current += invoice.remainingAmount
      } else if (daysDiff <= 60) {
        agingBuckets.days30 += invoice.remainingAmount
      } else if (daysDiff <= 90) {
        agingBuckets.days60 += invoice.remainingAmount
      } else {
        agingBuckets.days90 += invoice.remainingAmount
      }
      agingBuckets.total += invoice.remainingAmount
    }

    // ملخص الفواتير
    const invoicesSummary = await db.purchaseInvoice.aggregate({
      where: {
        supplierId,
        status: 'approved',
        ...(params.fromDate || params.toDate ? { invoiceDate: dateFilter } : {}),
      },
      _count: true,
      _sum: { total: true, paidAmount: true, remainingAmount: true },
    })

    // ملخص المرتجعات
    const returnsSummary = await db.purchaseReturn.aggregate({
      where: {
        supplierId,
        status: 'approved',
        ...(params.fromDate || params.toDate ? { returnDate: dateFilter } : {}),
      },
      _count: true,
      _sum: { total: true },
    })

    // ملخص الدفعات
    const paymentsSummary = await db.supplierPayment.aggregate({
      where: {
        supplierId,
        status: 'completed',
        ...(params.fromDate || params.toDate ? { paymentDate: dateFilter } : {}),
      },
      _count: true,
      _sum: { amount: true },
    })

    const report = {
      supplier: {
        id: supplier.id,
        code: supplier.supplierCode,
        name: supplier.name,
        nameAr: supplier.nameAr,
        phone: supplier.phone,
        email: supplier.email,
        creditLimit: supplier.creditLimit,
        currentBalance: supplier.currentBalance,
        balanceType: supplier.balanceType,
        paymentTerms: supplier.paymentTerms,
        currency: supplier.currency,
      },
      company: supplier.Company,
      period: {
        from: params.fromDate || null,
        to: params.toDate || null,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.transactionType,
        number: t.transactionNumber,
        date: t.transactionDate,
        debit: t.debit,
        credit: t.credit,
        balance: t.balance,
        notes: t.notes,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
      })),
      summary: {
        totalDebit,
        totalCredit,
        currentBalance,
        balance:
          currentBalance > 0
            ? supplier.balanceType === 'CREDIT'
              ? 'دائن'
              : 'مدين'
            : 'متوازن',
      },
      invoices: {
        count: invoicesSummary._count,
        total: invoicesSummary._sum.total || 0,
        paid: invoicesSummary._sum.paidAmount || 0,
        remaining: invoicesSummary._sum.remainingAmount || 0,
      },
      returns: {
        count: returnsSummary._count,
        total: returnsSummary._sum.total || 0,
      },
      payments: {
        count: paymentsSummary._count,
        total: paymentsSummary._sum.amount || 0,
      },
      aging: agingBuckets,
    }

    return { success: true, data: report }
  },
}
