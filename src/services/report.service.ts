/**
 * Report Service
 * خدمات التقارير
 */

import { db } from '@/lib/db'
import {
  GenerateReportInput,
  ReportQueryParams,
  SalesReportParams,
  CollectionReportParams,
  InventoryReportParams,
  InventoryValuationParams,
  InventoryValuationResponse,
  CreateReportTemplateInput,
  UpdateReportTemplateInput,
  ReportTemplateQueryParams,
  REPORT_TYPES
} from '@/models/report.model'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

export const reportService = {
  /**
   * جلب التقارير المُنشأة
   */
  async getGeneratedReports(params: ReportQueryParams, user: any) {
    const { page = 1, limit = 20, companyId, type, generatedBy, dateFrom, dateTo } = params
    const skip = (page - 1) * limit

    const where: any = {}

    // Apply company filter
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.companyId) {
        return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } }
      }
      where.companyId = user.companyId
    } else if (companyId) {
      where.companyId = companyId
    }

    if (type) where.type = type
    if (generatedBy) where.generatedBy = generatedBy

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const [reports, total] = await Promise.all([
      db.generatedReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: { select: { id: true, name: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.generatedReport.count({ where }),
    ])

    // Parse JSON fields
    const parsedReports = reports.map((report) => ({
      ...report,
      parameters: report.parameters ? JSON.parse(report.parameters) : null,
      data: report.data ? JSON.parse(report.data) : null,
    }))

    return {
      success: true,
      data: parsedReports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  /**
   * إنشاء تقرير جديد
   */
  async generateReport(input: GenerateReportInput, user: any) {
    const { templateId, companyId, branchId, name, type, parameters = {}, format = 'JSON' } = input

    if (!type) {
      return { success: false, error: 'Report type is required' }
    }

    // Determine company
    const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId
    if (!targetCompanyId) {
      return { success: false, error: 'Company ID is required' }
    }

    // Get template if specified
    let template = null
    if (templateId) {
      template = await db.reportTemplate.findUnique({ where: { id: templateId } })
      if (!template) {
        return { success: false, error: 'Template not found' }
      }
    }

    // Generate report data based on type
    let reportData: any = {}

    switch (type) {
      case 'SALES':
        reportData = await this.generateSalesReport({ ...parameters, companyId: targetCompanyId, branchId } as SalesReportParams)
        break
      case 'COLLECTION':
        reportData = await this.generateCollectionReport({ ...parameters, companyId: targetCompanyId, branchId } as CollectionReportParams)
        break
      case 'INVENTORY':
        reportData = await this.generateInventoryReport({ ...parameters, companyId: targetCompanyId } as InventoryReportParams)
        break
      case 'COMMISSION':
        reportData = await this.generateCommissionReport(targetCompanyId, parameters)
        break
      case 'FINANCIAL':
        reportData = await this.generateFinancialReport(targetCompanyId, branchId, parameters)
        break
      default:
        return { success: false, error: 'Invalid report type' }
    }

    // Generate report name if not provided
    const reportName = name || `${type} Report - ${new Date().toLocaleDateString()}`

    // Save generated report
    const generatedReport = await db.generatedReport.create({
      data: {
        templateId: template?.id || null,
        companyId: targetCompanyId,
        generatedBy: user.id,
        name: reportName,
        type,
        parameters: JSON.stringify(parameters),
        format,
        data: JSON.stringify(reportData),
        status: 'completed',
      },
      include: {
        template: { select: { id: true, name: true, type: true } },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: targetCompanyId,
        branchId: branchId || null,
        userId: user.id,
        action: 'CREATE',
        entityType: 'GeneratedReport',
        entityId: generatedReport.id,
        newData: JSON.stringify({ type, parameters, name: reportName }),
      },
    })

    return {
      success: true,
      data: {
        ...generatedReport,
        parameters: JSON.parse(generatedReport.parameters),
        data: JSON.parse(generatedReport.data),
      },
      message: 'Report generated successfully',
    }
  },

  /**
   * تقرير المبيعات
   */
  async generateSalesReport(params: SalesReportParams) {
    const { companyId, branchId, dateFrom, dateTo, view = 'summary' } = params

    const where: any = { companyId }
    if (branchId) where.branchId = branchId
    if (dateFrom || dateTo) {
      where.invoiceDate = {}
      if (dateFrom) where.invoiceDate.gte = new Date(dateFrom)
      if (dateTo) where.invoiceDate.lte = new Date(dateTo)
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, code: true, name: true, nameAr: true, zoneId: true } },
        agent: { select: { id: true, name: true, nameAr: true } },
        branch: { select: { id: true, name: true, code: true } },
        items: { include: { product: { select: { id: true, sku: true, name: true, costPrice: true, sellPrice: true, categoryId: true } } } },
      },
      orderBy: { invoiceDate: 'desc' },
    })

    // Calculate summary
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
      totalSubtotal: invoices.reduce((sum, inv) => sum + inv.subtotal, 0),
      totalTax: invoices.reduce((sum, inv) => sum + inv.taxAmount, 0),
      totalDiscount: invoices.reduce((sum, inv) => sum + inv.discount, 0),
      totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      totalRemaining: invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
    }

    return { invoices: invoices.slice(0, 100), summary }
  },

  /**
   * تقرير التحصيل
   */
  async generateCollectionReport(params: CollectionReportParams) {
    const { companyId, branchId, dateFrom, dateTo, view = 'summary' } = params

    const paymentWhere: any = { companyId, status: 'completed' }
    if (branchId) paymentWhere.branchId = branchId
    if (dateFrom || dateTo) {
      paymentWhere.paymentDate = {}
      if (dateFrom) paymentWhere.paymentDate.gte = new Date(dateFrom)
      if (dateTo) paymentWhere.paymentDate.lte = new Date(dateTo)
    }

    const payments = await db.payment.findMany({
      where: paymentWhere,
      include: {
        customer: { select: { id: true, code: true, name: true, nameAr: true } },
        agent: { select: { id: true, name: true, nameAr: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { paymentDate: 'desc' },
    })

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      byMethod: {} as Record<string, number>,
    }

    for (const p of payments) {
      summary.byMethod[p.method] = (summary.byMethod[p.method] || 0) + p.amount
    }

    return { payments: payments.slice(0, 100), summary }
  },

  /**
   * تقرير المخزون
   */
  async generateInventoryReport(params: InventoryReportParams) {
    const { companyId, warehouseId, categoryId, view = 'summary' } = params

    const productWhere: any = { companyId, active: true }
    if (categoryId) productWhere.categoryId = categoryId

    const products = await db.product.findMany({
      where: productWhere,
      include: {
        category: { select: { id: true, name: true, code: true } },
        inventory: {
          include: { warehouse: { select: { id: true, name: true } } },
          ...(warehouseId ? { where: { warehouseId } } : {}),
        },
      },
    })

    const summary = {
      totalProducts: products.length,
      totalQuantity: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    }

    for (const product of products) {
      const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)
      const totalMinQuantity = product.inventory.reduce((sum, inv) => sum + inv.minQuantity, 0)

      summary.totalQuantity += totalQuantity
      summary.totalValue += totalQuantity * product.costPrice

      if (totalQuantity === 0) summary.outOfStockCount++
      else if (totalQuantity <= totalMinQuantity) summary.lowStockCount++
    }

    return { products: products.slice(0, 100), summary }
  },

  /**
   * تقرير العمولات
   */
  async generateCommissionReport(companyId: string, parameters?: any) {
    const { dateFrom, dateTo, agentIds, status } = parameters || {}

    const where: any = { agent: { companyId } }
    if (agentIds && agentIds.length > 0) where.agentId = { in: agentIds }
    if (status && status.length > 0) where.status = { in: status }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const commissions = await db.agentCommission.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, nameAr: true, email: true } },
        policy: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const summary = {
      totalCommissions: commissions.length,
      totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
      paidAmount: commissions.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
    }

    return { commissions, summary }
  },

  /**
   * التقرير المالي
   */
  async generateFinancialReport(companyId: string, branchId?: string, parameters?: any) {
    const { dateFrom, dateTo } = parameters || {}

    const baseWhere: any = { companyId }
    if (branchId) baseWhere.branchId = branchId

    const dateFilter: any = {}
    if (dateFrom || dateTo) {
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
    }

    const salesWhere = { ...baseWhere }
    if (Object.keys(dateFilter).length > 0) salesWhere.invoiceDate = dateFilter

    const salesData = await db.invoice.aggregate({
      where: salesWhere,
      _sum: { subtotal: true, taxAmount: true, total: true, paidAmount: true, remainingAmount: true },
      _count: { id: true },
    })

    const paymentsWhere = { ...baseWhere }
    if (Object.keys(dateFilter).length > 0) paymentsWhere.paymentDate = dateFilter

    const paymentsData = await db.payment.aggregate({
      where: paymentsWhere,
      _sum: { amount: true },
      _count: { id: true },
    })

    return {
      summary: {
        sales: {
          count: salesData._count.id,
          total: salesData._sum.total || 0,
          paid: salesData._sum.paidAmount || 0,
          remaining: salesData._sum.remainingAmount || 0,
        },
        payments: {
          count: paymentsData._count.id,
          total: paymentsData._sum.amount || 0,
        },
      },
      period: { from: dateFrom || null, to: dateTo || null },
    }
  },
}

// Sales Report Service
export const salesReportService = {
  async getReport(params: SalesReportParams) {
    return reportService.generateSalesReport(params)
  },
}

// Collection Report Service
export const collectionReportService = {
  async getReport(params: CollectionReportParams) {
    return reportService.generateCollectionReport(params)
  },
}

// Inventory Report Service
export const inventoryReportService = {
  async getReport(params: InventoryReportParams) {
    return reportService.generateInventoryReport(params)
  },
}

/**
 * Inventory Valuation Service
 * خدمة تقرير أرصدة المخازن
 */
export const inventoryValuationService = {
  async getReport(params: InventoryValuationParams): Promise<InventoryValuationResponse> {
    const { companyId, warehouseId, productId, categoryId, minQuantity, maxQuantity, showZeroStock } = params

    // بناء شروط البحث
    const inventoryWhere: any = {}

    if (warehouseId) {
      inventoryWhere.warehouseId = warehouseId
    }

    if (!showZeroStock) {
      inventoryWhere.quantity = { gt: 0 }
    }

    if (minQuantity !== undefined) {
      inventoryWhere.quantity = { ...inventoryWhere.quantity, gte: minQuantity }
    }

    if (maxQuantity !== undefined) {
      inventoryWhere.quantity = { ...inventoryWhere.quantity, lte: maxQuantity }
    }

    const productWhere: any = { companyId }
    if (categoryId) productWhere.categoryId = categoryId
    if (productId) productWhere.id = productId

    // جلب المنتجات مع أرصدتها
    const products = await db.product.findMany({
      where: productWhere,
      include: {
        ProductCategory: { select: { id: true, name: true, nameAr: true } },
        Supplier: { select: { id: true, name: true, supplierCode: true } },
        Inventory: {
          where: inventoryWhere,
          include: {
            Warehouse: { select: { id: true, name: true, nameAr: true, branchId: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // تجهيز التقرير
    const data = products.map(product => {
      const inventories = product.Inventory.map(inv => ({
        warehouseId: inv.warehouseId,
        warehouseName: inv.Warehouse.name,
        warehouseNameAr: inv.Warehouse.nameAr,
        quantity: inv.quantity,
        reservedQuantity: inv.reservedQuantity,
        availableQuantity: inv.quantity - inv.reservedQuantity,
        avgCost: inv.avgCost,
        totalCost: inv.totalCost,
        minQuantity: inv.minQuantity,
        maxQuantity: inv.maxQuantity,
        lastPurchaseDate: inv.lastPurchaseDate,
        lastPurchaseCost: inv.lastPurchaseCost,
        isLowStock: inv.quantity <= inv.minQuantity
      }))

      const totalQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0)
      const totalValue = inventories.reduce((sum, inv) => sum + (inv.totalCost || 0), 0)
      const avgUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0

      return {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        productNameAr: product.nameAr,
        unit: product.unit,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        category: product.ProductCategory,
        supplier: product.Supplier,
        inventories,
        totalQuantity,
        totalValue,
        avgUnitCost
      }
    })

    // حساب الإجماليات
    const summary = {
      totalProducts: data.length,
      totalQuantity: data.reduce((sum, p) => sum + p.totalQuantity, 0),
      totalValue: data.reduce((sum, p) => sum + p.totalValue, 0),
      lowStockCount: data.filter(p => p.inventories.some(inv => inv.isLowStock)).length,
      zeroStockCount: data.filter(p => p.totalQuantity === 0).length
    }

    return { data, summary }
  }
}

/**
 * Report Template Service
 * خدمة قوالب التقارير
 */
export const reportTemplateService = {
  async getTemplates(params: ReportTemplateQueryParams, user: any) {
    const { page = 1, limit = 50, companyId, type, isDefault, active } = params
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Apply company filter based on user role
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.companyId) {
        return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } }
      }
      where.companyId = user.companyId
    } else if (companyId) {
      where.companyId = companyId
    }

    if (type && REPORT_TYPES.includes(type)) {
      where.type = type
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault
    }

    if (active !== undefined) {
      where.active = active
    }

    const [templates, total] = await Promise.all([
      db.reportTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { reports: true },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      db.reportTemplate.count({ where }),
    ])

    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      ...template,
      config: JSON.parse(template.config),
      filters: template.filters ? JSON.parse(template.filters) : null,
      columns: template.columns ? JSON.parse(template.columns) : null,
    }))

    return {
      success: true,
      data: parsedTemplates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async createTemplate(input: CreateReportTemplateInput, user: any) {
    const { companyId, name, nameAr, type, config, filters, columns, isDefault = false } = input

    // Validate required fields
    if (!name || !type) {
      throw new Error('Name and type are required')
    }

    // Validate type
    if (!REPORT_TYPES.includes(type)) {
      throw new Error(`Invalid report type. Must be one of: ${REPORT_TYPES.join(', ')}`)
    }

    // Determine company
    const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId
    if (!targetCompanyId) {
      throw new Error('Company ID is required')
    }

    // If setting as default, unset other defaults for this type
    if (isDefault) {
      await db.reportTemplate.updateMany({
        where: { companyId: targetCompanyId, type },
        data: { isDefault: false },
      })
    }

    // Create template
    const template = await db.reportTemplate.create({
      data: {
        companyId: targetCompanyId,
        name,
        nameAr,
        type,
        config: JSON.stringify(config || {}),
        filters: filters ? JSON.stringify(filters) : null,
        columns: columns ? JSON.stringify(columns) : null,
        isDefault,
        active: true,
      },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: targetCompanyId,
        userId: user.id,
        action: 'CREATE',
        entityType: 'ReportTemplate',
        entityId: template.id,
        newData: JSON.stringify(template),
      },
    })

    return {
      ...template,
      config: JSON.parse(template.config),
      filters: template.filters ? JSON.parse(template.filters) : null,
      columns: template.columns ? JSON.parse(template.columns) : null,
    }
  },

  async updateTemplate(input: UpdateReportTemplateInput, user: any) {
    const { id, name, nameAr, type, config, filters, columns, isDefault, active } = input

    if (!id) {
      throw new Error('Template ID is required')
    }

    // Get existing template
    const existingTemplate = await db.reportTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      throw new Error('Template not found')
    }

    // Check company access
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== existingTemplate.companyId) {
      throw new Error('Forbidden')
    }

    // Validate type if provided
    if (type && !REPORT_TYPES.includes(type)) {
      throw new Error(`Invalid report type. Must be one of: ${REPORT_TYPES.join(', ')}`)
    }

    // If setting as default, unset other defaults for this type
    if (isDefault) {
      await db.reportTemplate.updateMany({
        where: {
          companyId: existingTemplate.companyId,
          type: type || existingTemplate.type,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (nameAr !== undefined) updateData.nameAr = nameAr
    if (type !== undefined) updateData.type = type
    if (config !== undefined) updateData.config = JSON.stringify(config)
    if (filters !== undefined) updateData.filters = filters ? JSON.stringify(filters) : null
    if (columns !== undefined) updateData.columns = columns ? JSON.stringify(columns) : null
    if (isDefault !== undefined) updateData.isDefault = isDefault
    if (active !== undefined) updateData.active = active

    // Update template
    const template = await db.reportTemplate.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: existingTemplate.companyId,
        userId: user.id,
        action: 'UPDATE',
        entityType: 'ReportTemplate',
        entityId: template.id,
        oldData: JSON.stringify(existingTemplate),
        newData: JSON.stringify(template),
      },
    })

    return {
      ...template,
      config: JSON.parse(template.config),
      filters: template.filters ? JSON.parse(template.filters) : null,
      columns: template.columns ? JSON.parse(template.columns) : null,
    }
  },

  async deleteTemplate(id: string, user: any) {
    // Get existing template
    const existingTemplate = await db.reportTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      throw new Error('Template not found')
    }

    // Check company access
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== existingTemplate.companyId) {
      throw new Error('Forbidden')
    }

    // Soft delete by setting active to false
    const template = await db.reportTemplate.update({
      where: { id },
      data: { active: false },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: existingTemplate.companyId,
        userId: user.id,
        action: 'DELETE',
        entityType: 'ReportTemplate',
        entityId: template.id,
        oldData: JSON.stringify(existingTemplate),
      },
    })

    return template
  }
}
