/**
 * Receipt Template Service
 * خدمات قوالب الإيصالات
 */

import { receiptTemplateRepository } from '@/repositories/receipt-template.repository'
import {
  ReceiptTemplateQueryParams,
  CreateReceiptTemplateInput,
  UpdateReceiptTemplateInput,
  TemplateWithStats,
} from '@/models/receipt-template.model'

// Helper function
function getPaperSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    A4: 'A4 Full',
    A4_THIRD: 'A4 Third',
    A5: 'A5',
    THERMAL_80: 'Thermal 80mm',
    CUSTOM: 'Custom',
  }
  return labels[size] || size
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
