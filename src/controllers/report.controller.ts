/**
 * Report Controller
 * متحكم التقارير
 */

import { NextRequest, NextResponse } from 'next/server'
import { reportService, salesReportService, collectionReportService, inventoryReportService } from '@/services/report.service'
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
