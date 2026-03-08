/**
 * Supplier Service
 * خدمات الموردين
 */

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
}
