/**
 * Receipt Template Repository
 * مستودع قوالب الإيصالات
 */

import { db } from '@/lib/db'
import { ReceiptTemplateQueryParams, CreateReceiptTemplateInput, UpdateReceiptTemplateInput } from '@/models/receipt-template.model'
import { Prisma } from '@prisma/client'

export const receiptTemplateRepository = {
  /**
   * جلب قوالب الإيصالات لشركة
   */
  async findMany(params: ReceiptTemplateQueryParams) {
    const { companyId, branchId, includeInactive } = params

    const where: Prisma.CompanyReceiptTemplateWhereInput = { companyId }

    if (branchId) {
      where.OR = [{ branchId }, { branchId: null }]
    }

    if (!includeInactive) {
      where.isActive = true
    }

    return db.companyReceiptTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      include: {
        globalTemplate: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            previewImage: true,
            templateType: true,
          },
        },
      },
    })
  },

  /**
   * جلب قالب بالمعرف
   */
  async findById(id: string) {
    return db.companyReceiptTemplate.findUnique({
      where: { id },
    })
  },

  /**
   * التحقق من وجود القالب للشركة
   */
  async findByIdAndCompany(id: string, companyId: string) {
    return db.companyReceiptTemplate.findFirst({
      where: { id, companyId },
    })
  },

  /**
   * إنشاء قالب
   */
  async create(data: CreateReceiptTemplateInput) {
    const code = `TPL-${Date.now()}`

    return db.companyReceiptTemplate.create({
      data: {
        companyId: data.companyId,
        branchId: data.branchId || null,
        name: data.name,
        nameAr: data.nameAr || data.name,
        code,
        templateJson:
          typeof data.templateJson === 'string'
            ? data.templateJson
            : JSON.stringify(data.templateJson),
        isDefault: data.isDefault || false,
        paperSize: data.paperSize || 'A4_THIRD',
        customWidth: data.customWidth || null,
        customHeight: data.customHeight || null,
        marginTop: data.marginTop || 5,
        marginBottom: data.marginBottom || 5,
        marginLeft: data.marginLeft || 5,
        marginRight: data.marginRight || 5,
        createdBy: data.createdBy || null,
      },
    })
  },

  /**
   * تحديث قالب
   */
  async update(id: string, data: Partial<UpdateReceiptTemplateInput>) {
    const updateData: Prisma.CompanyReceiptTemplateUpdateInput = {
      ...data,
      updatedAt: new Date(),
    }

    if (data.templateJson) {
      updateData.templateJson =
        typeof data.templateJson === 'string'
          ? data.templateJson
          : JSON.stringify(data.templateJson)
    }

    return db.companyReceiptTemplate.update({
      where: { id },
      data: updateData,
    })
  },

  /**
   * حذف قالب
   */
  async delete(id: string) {
    return db.companyReceiptTemplate.delete({
      where: { id },
    })
  },

  /**
   * تحديث القالب الافتراضي
   */
  async unsetDefault(companyId: string) {
    return db.companyReceiptTemplate.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false },
    })
  },

  /**
   * عدد القوالب المخصصة
   */
  async countCustomTemplates(companyId: string) {
    return db.companyReceiptTemplate.count({
      where: { companyId, installedFromMarketplace: null },
    })
  },

  /**
   * جلب إعدادات Marketplace
   */
  async getMarketplaceSettings(companyId: string) {
    return db.companyMarketplaceSettings.findUnique({
      where: { companyId },
    })
  },

  /**
   * تحديث إعدادات Marketplace
   */
  async updateMarketplaceSettings(companyId: string, data: Prisma.CompanyMarketplaceSettingsUpdateInput) {
    return db.companyMarketplaceSettings.update({
      where: { companyId },
      data,
    })
  },

  /**
   * عدد عمليات الطباعة
   */
  async getPrintCount(templateId: string) {
    return db.receiptPrintLog.count({
      where: { templateId },
    })
  },
}
