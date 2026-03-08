/**
 * Report Controller
 * متحكم التقارير
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  reportService,
  salesReportService,
  collectionReportService,
  inventoryReportService,
  inventoryValuationService,
  reportTemplateService
} from '@/services/report.service'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

export const reportController = {
  /**
   * GET - جلب التقارير المُنشأة
   */
  async getGeneratedReports(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        companyId: searchParams.get('companyId') || undefined,
        type: searchParams.get('type') as any || undefined,
        generatedBy: searchParams.get('generatedBy') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
      }

      const result = await reportService.getGeneratedReports(params, user)
      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error fetching generated reports:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch generated reports' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء تقرير جديد
   */
  async generateReport(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const result = await reportService.generateReport(body, user)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
      console.error('Error generating report:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to generate report' },
        { status: 500 }
      )
    }
  },
}

export const salesReportController = {
  /**
   * GET - تقرير المبيعات
   */
  async getReport(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId')
      const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId

      if (!targetCompanyId) {
        return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 })
      }

      const params = {
        companyId: targetCompanyId,
        branchId: searchParams.get('branchId') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        view: searchParams.get('view') as any || 'summary',
      }

      const reportData = await salesReportService.getReport(params)

      return NextResponse.json({
        success: true,
        data: reportData,
        meta: {
          view: params.view,
          companyId: targetCompanyId,
          branchId: params.branchId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      console.error('Error generating sales report:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to generate sales report' },
        { status: 500 }
      )
    }
  },
}

export const collectionReportController = {
  /**
   * GET - تقرير التحصيل
   */
  async getReport(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId')
      const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId

      if (!targetCompanyId) {
        return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 })
      }

      const params = {
        companyId: targetCompanyId,
        branchId: searchParams.get('branchId') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        view: searchParams.get('view') as any || 'summary',
      }

      const reportData = await collectionReportService.getReport(params)

      return NextResponse.json({
        success: true,
        data: reportData,
        meta: {
          view: params.view,
          companyId: targetCompanyId,
          branchId: params.branchId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      console.error('Error generating collection report:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to generate collection report' },
        { status: 500 }
      )
    }
  },
}

export const inventoryReportController = {
  /**
   * GET - تقرير المخزون
   */
  async getReport(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId')
      const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId

      if (!targetCompanyId) {
        return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 })
      }

      const params = {
        companyId: targetCompanyId,
        warehouseId: searchParams.get('warehouseId') || undefined,
        categoryId: searchParams.get('categoryId') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        view: searchParams.get('view') as any || 'summary',
      }

      const reportData = await inventoryReportService.getReport(params)

      return NextResponse.json({
        success: true,
        data: reportData,
        meta: {
          view: params.view,
          companyId: targetCompanyId,
          warehouseId: params.warehouseId,
          categoryId: params.categoryId,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      console.error('Error generating inventory report:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to generate inventory report' },
        { status: 500 }
      )
    }
  },
}

/**
 * Inventory Valuation Controller
 * متحكم تقرير أرصدة المخازن
 */
export const inventoryValuationController = {
  /**
   * GET - تقرير أرصدة المخازن
   */
  async getReport(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId') || ''
      const warehouseId = searchParams.get('warehouseId') || undefined
      const productId = searchParams.get('productId') || undefined
      const categoryId = searchParams.get('categoryId') || undefined
      const minQuantity = searchParams.get('minQuantity') ? parseFloat(searchParams.get('minQuantity')!) : undefined
      const maxQuantity = searchParams.get('maxQuantity') ? parseFloat(searchParams.get('maxQuantity')!) : undefined
      const showZeroStock = searchParams.get('showZeroStock') === 'true'

      const result = await inventoryValuationService.getReport({
        companyId,
        warehouseId,
        productId,
        categoryId,
        minQuantity,
        maxQuantity,
        showZeroStock
      })

      return NextResponse.json({
        success: true,
        data: result.data,
        summary: result.summary
      })
    } catch (error: any) {
      console.error('Error generating inventory report:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء تقرير المخزون' },
        { status: 500 }
      )
    }
  }
}

/**
 * Report Template Controller
 * متحكم قوالب التقارير
 */
export const reportTemplateController = {
  /**
   * GET - جلب قوالب التقارير
   */
  async getTemplates(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        companyId: searchParams.get('companyId') || undefined,
        type: searchParams.get('type') as any || undefined,
        isDefault: searchParams.get('isDefault') === 'true' ? true : searchParams.get('isDefault') === 'false' ? false : undefined,
        active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      }

      const result = await reportTemplateService.getTemplates(params, user)
      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error fetching report templates:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch report templates' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء قالب تقرير جديد
   */
  async createTemplate(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const template = await reportTemplateService.createTemplate(body, user)

      return NextResponse.json({
        success: true,
        data: template,
        message: 'Report template created successfully',
      }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating report template:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create report template' },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - تحديث قالب تقرير
   */
  async updateTemplate(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const template = await reportTemplateService.updateTemplate(body, user)

      return NextResponse.json({
        success: true,
        data: template,
        message: 'Report template updated successfully',
      })
    } catch (error: any) {
      console.error('Error updating report template:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update report template' },
        { status: 500 }
      )
    }
  },

  /**
   * DELETE - حذف قالب تقرير
   */
  async deleteTemplate(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 })
      }

      await reportTemplateService.deleteTemplate(id, user)

      return NextResponse.json({
        success: true,
        message: 'Report template deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting report template:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to delete report template' },
        { status: 500 }
      )
    }
  }
}
