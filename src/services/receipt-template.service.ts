/**
 * Receipt Template Service
 * خدمات قوالب الإيصالات
 */

import { db } from '@/lib/db'
import { receiptTemplateRepository } from '@/repositories/receipt-template.repository'
import {
  ReceiptTemplateQueryParams,
  CreateReceiptTemplateInput,
  UpdateReceiptTemplateInput,
  TemplateWithStats,
  MarketplaceQueryParams,
  InstallTemplateInput,
  CategoryWithCount,
  CreateCategoryInput,
  PrintLogQueryParams,
  CreatePrintLogInput,
  CompanyTemplateQueryParams,
} from '@/models/receipt-template.model'
import { predefinedTemplates } from '@/lib/receipt-templates'

// Helper functions
function getPaperSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    A4: 'A4 كامل',
    A4_THIRD: 'ثلث A4',
    A5: 'A5',
    THERMAL_80: 'حراري 80 مم',
    CUSTOM: 'مخصص'
  }
  return labels[size] || size
}

function getTemplateTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    thermal: 'حراري',
    standard: 'قياسي',
    professional: 'احترافي',
    minimal: 'بسيط',
    official: 'رسمي'
  }
  return labels[type] || type
}

export const receiptTemplateService = {
  /**
   * جلب قوالب الإيصالات
   */
  async getTemplates(params: ReceiptTemplateQueryParams) {
    const { companyId } = params

    if (!companyId) {
      return {
        success: false,
        error: 'Company ID is required',
      }
    }

    const templates = await receiptTemplateRepository.findMany(params)

    // Add stats to each template
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const printCount = await receiptTemplateRepository.getPrintCount(template.id)

        return {
          ...template,
          printCount,
          isFromMarketplace: !!template.installedFromMarketplace,
          paperSizeLabel: getPaperSizeLabel(template.paperSize),
        } as TemplateWithStats
      })
    )

    return {
      success: true,
      data: templatesWithStats,
    }
  },

  /**
   * إنشاء قالب جديد
   */
  async createTemplate(data: CreateReceiptTemplateInput) {
    const { companyId, name, templateJson, isDefault } = data

    if (!companyId || !name || !templateJson) {
      return {
        success: false,
        error: 'Missing required fields',
      }
    }

    // Check limits
    const settings = await receiptTemplateRepository.getMarketplaceSettings(companyId)

    if (settings) {
      const currentCount = await receiptTemplateRepository.countCustomTemplates(companyId)

      if (currentCount >= settings.maxCustomTemplates) {
        return {
          success: false,
          error: `Maximum custom templates limit reached (${settings.maxCustomTemplates})`,
        }
      }
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await receiptTemplateRepository.unsetDefault(companyId)
    }

    const template = await receiptTemplateRepository.create(data)

    // Update settings count
    if (settings) {
      await receiptTemplateRepository.updateMarketplaceSettings(companyId, {
        customTemplates: { increment: 1 },
      })
    }

    return {
      success: true,
      data: template,
      message: 'Template created successfully',
    }
  },

  /**
   * تحديث قالب
   */
  async updateTemplate(data: UpdateReceiptTemplateInput) {
    const { id, companyId, isDefault, ...updateData } = data

    if (!id || !companyId) {
      return {
        success: false,
        error: 'Template ID and Company ID are required',
      }
    }

    const existing = await receiptTemplateRepository.findByIdAndCompany(id, companyId)

    if (!existing) {
      return {
        success: false,
        error: 'Template not found or you do not have permission to edit it',
      }
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await receiptTemplateRepository.unsetDefault(companyId)
    }

    const template = await receiptTemplateRepository.update(id, {
      ...updateData,
      isDefault,
    })

    return {
      success: true,
      data: template,
      message: 'Template updated successfully',
    }
  },

  /**
   * حذف قالب
   */
  async deleteTemplate(id: string, companyId: string) {
    if (!id || !companyId) {
      return {
        success: false,
        error: 'Template ID and Company ID are required',
      }
    }

    const existing = await receiptTemplateRepository.findByIdAndCompany(id, companyId)

    if (!existing) {
      return {
        success: false,
        error: 'Template not found or you do not have permission to delete it',
      }
    }

    if (existing.isDefault) {
      return {
        success: false,
        error: 'Cannot delete the default template',
      }
    }

    await receiptTemplateRepository.delete(id)

    // Update settings count
    if (!existing.installedFromMarketplace) {
      await receiptTemplateRepository.updateMarketplaceSettings(companyId, {
        customTemplates: { decrement: 1 },
      })
    }

    return {
      success: true,
      message: 'Template deleted successfully',
    }
  },
}

/**
 * Marketplace Service
 * خدمات متجر القوالب
 */
export const marketplaceService = {
  /**
   * جلب قوالب المتجر
   */
  async getTemplates(params: MarketplaceQueryParams) {
    const { category, type, isFree, isFeatured, search, sortBy = 'sortOrder', limit = 50, page = 1 } = params
    const skip = (page - 1) * limit

    // بناء شروط البحث
    const where: any = { active: true }

    if (category) {
      where.category = { code: category }
    }

    if (type) {
      where.templateType = type
    }

    if (isFree !== undefined) {
      where.isFree = isFree
    }

    if (isFeatured) {
      where.isFeatured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { description: { contains: search } },
        { descriptionAr: { contains: search } }
      ]
    }

    // ترتيب النتائج
    let orderBy: any = {}
    switch (sortBy) {
      case 'popular':
        orderBy = { installCount: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'price_low':
        orderBy = { price: 'asc' }
        break
      case 'price_high':
        orderBy = { price: 'desc' }
        break
      default:
        orderBy = [{ isFeatured: 'desc' }, { sortOrder: 'asc' }]
    }

    const [templates, total] = await Promise.all([
      db.globalReceiptTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, nameAr: true, code: true, icon: true }
          }
        }
      }),
      db.globalReceiptTemplate.count({ where })
    ])

    // إضافة معلومات إضافية لكل قالب
    const templatesWithStats = templates.map(template => ({
      ...template,
      priceFormatted: template.isFree ? 'مجاني' : `${template.price} ${template.currency}`,
      ratingAvg: template.ratingCount > 0
        ? (template.rating / template.ratingCount).toFixed(1)
        : '0.0',
      paperSizeLabel: getPaperSizeLabel(template.paperSize),
      templateTypeLabel: getTemplateTypeLabel(template.templateType)
    }))

    return {
      success: true,
      data: templatesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  /**
   * تثبيت قالب من المتجر
   */
  async installTemplate(data: InstallTemplateInput) {
    const { globalTemplateId, companyId, branchId, makeDefault } = data

    if (!globalTemplateId || !companyId) {
      return { success: false, error: 'معرف القالب والشركة مطلوبان' }
    }

    // جلب القالب الأصلي
    const globalTemplate = await db.globalReceiptTemplate.findUnique({
      where: { id: globalTemplateId }
    })

    if (!globalTemplate) {
      return { success: false, error: 'القالب غير موجود' }
    }

    // التحقق من عدم تثبيت القالب مسبقاً
    const existingInstall = await db.companyReceiptTemplate.findFirst({
      where: {
        companyId,
        installedFromMarketplace: globalTemplateId
      }
    })

    if (existingInstall) {
      return { success: false, error: 'القالب مثبت مسبقاً' }
    }

    // إذا كان سيكون افتراضي، إلغاء الافتراضي السابق
    if (makeDefault) {
      await db.companyReceiptTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false }
      })
    }

    // إنشاء نسخة للشركة
    const companyTemplate = await db.companyReceiptTemplate.create({
      data: {
        companyId,
        branchId: branchId || null,
        name: globalTemplate.name,
        nameAr: globalTemplate.nameAr,
        code: `${globalTemplate.code}-${Date.now()}`,
        templateJson: globalTemplate.templateJson,
        isDefault: makeDefault || false,
        installedFromMarketplace: globalTemplateId,
        paperSize: globalTemplate.paperSize,
        customWidth: globalTemplate.customWidth,
        customHeight: globalTemplate.customHeight
      }
    })

    // تحديث عداد التثبيتات
    await db.globalReceiptTemplate.update({
      where: { id: globalTemplateId },
      data: { installCount: { increment: 1 } }
    })

    return {
      success: true,
      data: companyTemplate,
      message: 'تم تثبيت القالب بنجاح'
    }
  }
}

/**
 * Template Category Service
 * خدمات تصنيفات القوالب
 */
export const templateCategoryService = {
  /**
   * جلب التصنيفات
   */
  async getCategories(): Promise<CategoryWithCount[]> {
    const categories = await db.receiptTemplateCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { globalTemplates: true }
        }
      }
    })

    return categories.map(cat => ({
      ...cat,
      templateCount: cat._count.globalTemplates
    }))
  },

  /**
   * إنشاء تصنيف جديد
   */
  async createCategory(data: CreateCategoryInput) {
    const { name, nameAr, code, icon, sortOrder } = data

    if (!name || !nameAr || !code) {
      throw new Error('الاسم والكود مطلوبان')
    }

    // التحقق من عدم وجود الكود مسبقاً
    const existing = await db.receiptTemplateCategory.findUnique({
      where: { code }
    })

    if (existing) {
      throw new Error('الكود مستخدم مسبقاً')
    }

    return db.receiptTemplateCategory.create({
      data: {
        name,
        nameAr,
        code,
        icon: icon || null,
        sortOrder: sortOrder || 0
      }
    })
  }
}

/**
 * Print Log Service
 * خدمات سجلات الطباعة
 */
export const printLogService = {
  /**
   * جلب سجلات الطباعة
   */
  async getLogs(params: PrintLogQueryParams) {
    const { companyId, branchId, installmentId, customerId, printedBy, dateFrom, dateTo, limit = 50, page = 1 } = params
    const skip = (page - 1) * limit

    if (!companyId) {
      throw new Error('معرف الشركة مطلوب')
    }

    const where: any = { companyId }

    if (branchId) where.branchId = branchId
    if (installmentId) where.installmentId = installmentId
    if (customerId) where.customerId = customerId
    if (printedBy) where.printedBy = printedBy

    if (dateFrom || dateTo) {
      where.printedAt = {}
      if (dateFrom) where.printedAt.gte = new Date(dateFrom)
      if (dateTo) where.printedAt.lte = new Date(dateTo)
    }

    const [logs, total] = await Promise.all([
      db.receiptPrintLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { printedAt: 'desc' },
        include: {
          template: {
            select: { id: true, name: true, nameAr: true }
          }
        }
      }),
      db.receiptPrintLog.count({ where })
    ])

    return {
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  /**
   * تسجيل طباعة جديدة
   */
  async createLog(data: CreatePrintLogInput) {
    const {
      companyId, branchId, templateId, installmentId, invoiceId,
      customerId, contractNumber, installmentNumber, printedBy,
      printMethod, notes
    } = data

    if (!companyId || !installmentId || !customerId || !printedBy) {
      throw new Error('البيانات الأساسية مفقودة')
    }

    // التحقق من وجود طباعة سابقة
    const existingPrint = await db.receiptPrintLog.findFirst({
      where: {
        companyId,
        installmentId,
        isReprint: false
      },
      orderBy: { printedAt: 'desc' }
    })

    const isReprint = !!existingPrint

    // إنشاء سجل الطباعة
    const printLog = await db.receiptPrintLog.create({
      data: {
        companyId,
        branchId: branchId || null,
        templateId: templateId || null,
        installmentId,
        invoiceId: invoiceId || null,
        customerId,
        contractNumber: contractNumber || null,
        installmentNumber: installmentNumber || null,
        printedBy,
        isReprint,
        originalPrintId: existingPrint?.id || null,
        printCount: 1,
        printMethod: printMethod || 'PRINT',
        notes: notes || null
      }
    })

    // تحديث عداد الطباعة للقالب
    if (templateId) {
      await db.companyReceiptTemplate.update({
        where: { id: templateId },
        data: { printCount: { increment: 1 } }
      })
    }

    return {
      success: true,
      data: printLog,
      isReprint,
      message: isReprint ? 'تم تسجيل إعادة الطباعة' : 'تم تسجيل الطباعة بنجاح'
    }
  }
}

/**
 * Company Templates Service
 * خدمات قوالب الشركة
 */
export const companyTemplatesService = {
  /**
   * جلب قوالب الشركة المتاحة
   */
  async getTemplates(params: CompanyTemplateQueryParams) {
    const { companyId } = params

    if (!companyId) {
      throw new Error('معرف الشركة مطلوب')
    }

    // جلب إعدادات المتجر للشركة
    const marketplaceSettings = await db.companyMarketplaceSettings.findUnique({
      where: { companyId }
    })

    // جلب القوالب المثبتة للشركة
    const installedTemplates = await db.companyReceiptTemplate.findMany({
      where: {
        companyId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        code: true,
        isDefault: true,
        installedFromMarketplace: true,
        paperSize: true,
        createdAt: true
      }
    })

    // تحديد القوالب المتاحة
    const availableTemplates: any[] = []

    // 1. إضافة القوالب المجانية (متاحة للجميع)
    const freeTemplates = predefinedTemplates.filter(t => t.isFree)
    freeTemplates.forEach(template => {
      const installed = installedTemplates.find(
        t => t.installedFromMarketplace === template.id || t.code === template.id
      )

      availableTemplates.push({
        ...template,
        isInstalled: !!installed,
        installedId: installed?.id,
        isDefault: installed?.isDefault || false,
        owned: true
      })
    })

    // 2. إضافة القوالب المدفوعة المثبتة فقط
    const paidTemplates = predefinedTemplates.filter(t => !t.isFree)
    paidTemplates.forEach(template => {
      const installed = installedTemplates.find(
        t => t.installedFromMarketplace === template.id || t.code === template.id
      )

      if (installed) {
        availableTemplates.push({
          ...template,
          isInstalled: true,
          installedId: installed.id,
          isDefault: installed.isDefault,
          owned: true
        })
      }
    })

    // 3. إضافة القوالب المخصصة للشركة (غير من المتجر)
    const customTemplates = installedTemplates.filter(
      t => !t.installedFromMarketplace && !predefinedTemplates.find(p => p.id === t.code)
    )

    customTemplates.forEach(template => {
      availableTemplates.push({
        id: template.code,
        name: template.name,
        nameAr: template.nameAr || template.name,
        description: 'قالب مخصص',
        descriptionAr: 'قالب مخصص للشركة',
        category: 'custom',
        isFree: true,
        price: 0,
        rating: 0,
        downloads: 0,
        isInstalled: true,
        installedId: template.id,
        isDefault: template.isDefault,
        owned: true,
        isCustom: true,
        paperSize: template.paperSize,
        createdAt: template.createdAt
      })
    })

    // ترتيب القوالب: الافتراضي أولاً، ثم المثبتة، ثم حسب الفئة
    availableTemplates.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      if (a.isInstalled && !b.isInstalled) return -1
      if (!a.isInstalled && b.isInstalled) return 1
      return 0
    })

    return {
      success: true,
      data: availableTemplates,
      meta: {
        total: availableTemplates.length,
        freeCount: freeTemplates.length,
        paidInstalledCount: paidTemplates.filter(t =>
          installedTemplates.some(i => i.installedFromMarketplace === t.id || i.code === t.id)
        ).length,
        customCount: customTemplates.length,
        canInstallPaid: marketplaceSettings?.canInstallPaid ?? false,
        canCreateCustom: marketplaceSettings?.canCreateCustom ?? true
      }
    }
  }
}
