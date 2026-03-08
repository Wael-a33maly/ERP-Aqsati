/**
 * Company Service
 * خدمات الشركات
 */

import { companyRepository } from '@/repositories/company.repository'
import { CompanyQueryParams, CreateCompanyInput, UpdateCompanyInput } from '@/models/company.model'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const companyService = {
  /**
   * جلب الشركات
   */
  async getCompanies(params: CompanyQueryParams, userId?: string, userRole?: string, userCompanyId?: string) {
    const { page = 1, limit = 10, id } = params

    // إذا تم تحديد معرف الشركة، أرجع الشركة الواحدة
    if (id) {
      // مدير الشركة يمكنه رؤية شركته فقط
      if (userRole !== 'SUPER_ADMIN' && id !== userCompanyId) {
        return {
          success: false,
          error: 'غير مصرح لك بالوصول لهذه الشركة',
        }
      }

      const company = await companyRepository.findById(id)

      if (!company) {
        return {
          success: false,
          error: 'الشركة غير موجودة',
        }
      }

      return {
        success: true,
        data: company,
      }
    }

    // مدير الشركة يرى شركته فقط
    if (userRole !== 'SUPER_ADMIN') {
      if (userCompanyId) {
        const company = await companyRepository.findById(userCompanyId)
        return {
          success: true,
          data: company ? [company] : [],
          pagination: {
            page: 1,
            limit: 1,
            total: company ? 1 : 0,
            totalPages: 1,
          },
        }
      }
    }

    const { companies, total } = await companyRepository.findMany(params)

    return {
      success: true,
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * إنشاء شركة جديدة
   */
  async createCompany(data: CreateCompanyInput, userRole?: string) {
    // التحقق من صلاحية مدير النظام
    if (userRole !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'غير مصرح لك بإنشاء شركة جديدة. هذه الميزة متاحة فقط لمدير النظام',
      }
    }

    // التحقق من عدم تكرار الكود
    const existingCompany = await companyRepository.findByCode(data.code)

    if (existingCompany) {
      return {
        success: false,
        error: 'كود الشركة موجود مسبقاً',
      }
    }

    const company = await companyRepository.create({
      name: data.name,
      nameAr: data.name,
      code: data.code,
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxNumber: data.taxNumber,
      discountEnabled: data.discountEnabled ?? true,
      taxRate: data.taxRate ?? 15,
      currency: data.currency ?? 'SAR',
      active: true,
    })

    return {
      success: true,
      data: company,
    }
  },

  /**
   * تحديث شركة
   */
  async updateCompany(data: UpdateCompanyInput, userRole?: string, userCompanyId?: string) {
    const { id, ...updateData } = data

    if (!id) {
      return {
        success: false,
        error: 'معرف الشركة مطلوب',
      }
    }

    // التحقق من وجود الشركة
    const existingCompany = await companyRepository.findById(id)

    if (!existingCompany) {
      return {
        success: false,
        error: 'الشركة غير موجودة',
      }
    }

    // مدير الشركة يمكنه تعديل شركته فقط (ولكن لا يمكنه تغيير الكود أو الإلغاء)
    if (userRole !== 'SUPER_ADMIN') {
      if (id !== userCompanyId) {
        return {
          success: false,
          error: 'غير مصرح لك بتعديل هذه الشركة',
        }
      }

      // منع مدير الشركة من تغيير الكود أو إلغاء الشركة
      delete updateData.code
      delete updateData.active
    }

    const company = await companyRepository.update(id, {
      ...updateData,
      updatedAt: new Date(),
    })

    return {
      success: true,
      data: company,
    }
  },

  /**
   * حذف شركة
   */
  async deleteCompany(id: string, userRole?: string) {
    // التحقق من صلاحية مدير النظام
    if (userRole !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'غير مصرح لك بحذف الشركة. هذه الميزة متاحة فقط لمدير النظام',
      }
    }

    if (!id) {
      return {
        success: false,
        error: 'معرف الشركة مطلوب',
      }
    }

    // التحقق من وجود الشركة
    const existingCompany = await companyRepository.findByIdWithInvoiceCount(id)

    if (!existingCompany) {
      return {
        success: false,
        error: 'الشركة غير موجودة',
      }
    }

    // التحقق من عدم وجود بيانات مرتبطة
    if (
      existingCompany._count.Branch > 0 ||
      existingCompany._count.User > 0 ||
      existingCompany._count.Customer > 0 ||
      existingCompany._count.Invoice > 0
    ) {
      return {
        success: false,
        error: 'لا يمكن حذف الشركة لوجود بيانات مرتبطة بها',
      }
    }

    await companyRepository.delete(id)

    return {
      success: true,
      message: 'تم حذف الشركة بنجاح',
    }
  },
}
