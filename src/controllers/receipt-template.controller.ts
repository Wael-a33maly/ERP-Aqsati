/**
 * Receipt Template Controller
 * متحكم قوالب الإيصالات
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  receiptTemplateService,
  marketplaceService,
  templateCategoryService,
  printLogService,
  companyTemplatesService
} from '@/services/receipt-template.service'

export const receiptTemplateController = {
  /**
   * GET - جلب قوالب الإيصالات
   */
  async getTemplates(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        companyId: searchParams.get('companyId') || '',
        branchId: searchParams.get('branchId') || undefined,
        includeInactive: searchParams.get('includeInactive') === 'true',
      }

      const result = await receiptTemplateService.getTemplates(params)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching company templates:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch company templates' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء قالب جديد
   */
  async createTemplate(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await receiptTemplateService.createTemplate(body)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create template' },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - تحديث قالب
   */
  async updateTemplate(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await receiptTemplateService.updateTemplate(body)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error updating template:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update template' },
        { status: 500 }
      )
    }
  },

  /**
   * DELETE - حذف قالب
   */
  async deleteTemplate(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      const companyId = searchParams.get('companyId')

      const result = await receiptTemplateService.deleteTemplate(id || '', companyId || '')

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete template' },
        { status: 500 }
      )
    }
  },
}

/**
 * Marketplace Controller
 * متحكم متجر القوالب
 */
export const marketplaceController = {
  /**
   * GET - جلب قوالب المتجر
   */
  async getTemplates(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        category: searchParams.get('category') || undefined,
        type: searchParams.get('type') || undefined,
        isFree: searchParams.get('isFree') === 'true' ? true : searchParams.get('isFree') === 'false' ? false : undefined,
        isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'sortOrder',
        limit: parseInt(searchParams.get('limit') || '50'),
        page: parseInt(searchParams.get('page') || '1'),
      }

      const result = await marketplaceService.getTemplates(params)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching marketplace templates:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب قوالب المتجر' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - تثبيت قالب من المتجر
   */
  async installTemplate(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await marketplaceService.installTemplate(body)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error installing template:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في تثبيت القالب' },
        { status: 500 }
      )
    }
  },
}

/**
 * Template Category Controller
 * متحكم تصنيفات القوالب
 */
export const templateCategoryController = {
  /**
   * GET - جلب التصنيفات
   */
  async getCategories(request: NextRequest) {
    try {
      const categories = await templateCategoryService.getCategories()
      return NextResponse.json({
        success: true,
        data: categories
      })
    } catch (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب التصنيفات' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء تصنيف جديد
   */
  async createCategory(request: NextRequest) {
    try {
      const body = await request.json()
      const category = await templateCategoryService.createCategory(body)

      return NextResponse.json({
        success: true,
        data: category,
        message: 'تم إنشاء التصنيف بنجاح'
      })
    } catch (error: any) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إنشاء التصنيف' },
        { status: 500 }
      )
    }
  },
}

/**
 * Print Log Controller
 * متحكم سجلات الطباعة
 */
export const printLogController = {
  /**
   * GET - جلب سجلات الطباعة
   */
  async getLogs(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        companyId: searchParams.get('companyId') || '',
        branchId: searchParams.get('branchId') || undefined,
        installmentId: searchParams.get('installmentId') || undefined,
        customerId: searchParams.get('customerId') || undefined,
        printedBy: searchParams.get('printedBy') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        page: parseInt(searchParams.get('page') || '1'),
      }

      const result = await printLogService.getLogs(params)
      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error fetching print logs:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب سجلات الطباعة' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - تسجيل طباعة جديدة
   */
  async createLog(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await printLogService.createLog(body)

      return NextResponse.json({
        success: result.success,
        data: result.data,
        isReprint: result.isReprint,
        message: result.message
      })
    } catch (error: any) {
      console.error('Error creating print log:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تسجيل الطباعة' },
        { status: 500 }
      )
    }
  },
}

/**
 * Company Templates Controller
 * متحكم قوالب الشركة
 */
export const companyTemplatesController = {
  /**
   * GET - جلب قوالب الشركة المتاحة
   */
  async getTemplates(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId')

      if (!companyId) {
        return NextResponse.json({
          success: false,
          error: 'معرف الشركة مطلوب'
        }, { status: 400 })
      }

      const result = await companyTemplatesService.getTemplates({ companyId })
      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error fetching company templates:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'حدث خطأ أثناء جلب القوالب'
      }, { status: 500 })
    }
  },
}
