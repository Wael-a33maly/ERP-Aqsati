// ============================================
// Print Controller - متحكم الطباعة
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { printService } from '@/services/print.service'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import {
  DocumentType,
  TemplateType,
  CreatePrintJobInput,
  CreatePrintTemplateInput,
  UpdatePrintTemplateInput,
} from '@/models/print.model'

const DOCUMENT_TYPES: DocumentType[] = ['INVOICE', 'RECEIPT', 'CONTRACT', 'REPORT', 'INSTALLMENT_SCHEDULE', 'PAYMENT_RECEIPT']
const TEMPLATE_TYPES: TemplateType[] = ['INVOICE', 'RECEIPT', 'CONTRACT', 'REPORT']

export const printController = {
  // ==================== Print Jobs ====================

  // GET - جلب مهام الطباعة
  async getPrintJobs(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const result = await printService.getPrintJobs({
        companyId: searchParams.get('companyId') || undefined,
        documentType: searchParams.get('documentType') as DocumentType,
        status: searchParams.get('status') as any,
        printedBy: searchParams.get('printedBy') || undefined,
        dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
        dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
      })
    } catch (error: any) {
      console.error('Error fetching print jobs:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch print jobs' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء مهمة طباعة
  async createPrintJob(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const { templateId, documentType, documentIds, copies = 1 } = body

      if (!documentType || !documentIds || documentIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document type and document IDs are required' },
          { status: 400 }
        )
      }

      if (!DOCUMENT_TYPES.includes(documentType)) {
        return NextResponse.json(
          { success: false, error: `Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      const printJob = await printService.createPrintJob({
        templateId,
        documentType,
        documentIds,
        copies,
        companyId: user.companyId || '',
        printedBy: user.id,
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: printJob,
        message: 'Print job created successfully',
      }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating print job:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create print job' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث مهمة طباعة
  async updatePrintJob(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()
      const { id, status, printedAt } = body

      if (!id || !status) {
        return NextResponse.json(
          { success: false, error: 'Print job ID and status are required' },
          { status: 400 }
        )
      }

      const printJob = await printService.updatePrintJob({
        id,
        status,
        printedAt: printedAt ? new Date(printedAt) : undefined,
        userId: user.id,
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: printJob,
        message: 'Print job updated successfully',
      })
    } catch (error: any) {
      console.error('Error updating print job:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update print job' },
        { status: 500 }
      )
    }
  },

  // ==================== Print Templates ====================

  // GET - جلب قوالب الطباعة
  async getPrintTemplates(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const result = await printService.getPrintTemplates({
        companyId: searchParams.get('companyId') || undefined,
        type: searchParams.get('type') as TemplateType,
        isDefault: searchParams.get('isDefault') === 'true' ? true : searchParams.get('isDefault') === 'false' ? false : undefined,
        active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: result.templates,
        pagination: result.pagination,
      })
    } catch (error: any) {
      console.error('Error fetching print templates:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch print templates' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء قالب طباعة
  async createPrintTemplate(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const { companyId, name, nameAr, type, content, css, paperSize, orientation, isDefault } = body

      if (!name || !type || !content) {
        return NextResponse.json(
          { success: false, error: 'Name, type, and content are required' },
          { status: 400 }
        )
      }

      if (!TEMPLATE_TYPES.includes(type)) {
        return NextResponse.json(
          { success: false, error: `Invalid template type. Must be one of: ${TEMPLATE_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      const template = await printService.createPrintTemplate({
        companyId: companyId || user.companyId || '',
        name,
        nameAr,
        type,
        content,
        css,
        paperSize: paperSize || 'A4',
        orientation: orientation || 'portrait',
        isDefault: isDefault || false,
        userId: user.id,
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: template,
        message: 'Print template created successfully',
      }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating print template:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create print template' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث قالب طباعة
  async updatePrintTemplate(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const template = await printService.updatePrintTemplate({
        ...body,
        userId: user.id,
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: template,
        message: 'Print template updated successfully',
      })
    } catch (error: any) {
      console.error('Error updating print template:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update print template' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف قالب طباعة
  async deletePrintTemplate(request: NextRequest) {
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
        return NextResponse.json(
          { success: false, error: 'Template ID is required' },
          { status: 400 }
        )
      }

      const result = await printService.deletePrintTemplate(id, {
        userId: user.id,
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error deleting print template:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to delete print template' },
        { status: 500 }
      )
    }
  },

  // ==================== Preview ====================

  // GET - معاينة طباعة
  async getPreview(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const documentType = searchParams.get('documentType') as DocumentType
      const documentId = searchParams.get('documentId')
      const templateId = searchParams.get('templateId') || undefined

      if (!documentType || !documentId) {
        return NextResponse.json(
          { success: false, error: 'Document type and document ID are required' },
          { status: 400 }
        )
      }

      if (!DOCUMENT_TYPES.includes(documentType)) {
        return NextResponse.json(
          { success: false, error: `Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      const preview = await printService.generatePreview({
        documentType,
        documentId,
        templateId,
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: preview,
      })
    } catch (error: any) {
      console.error('Error generating preview:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to generate preview' },
        { status: 500 }
      )
    }
  },

  // POST - معاينة طباعة متعددة
  async getBatchPreview(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const { documentType, documentIds, templateId } = body

      if (!documentType || !documentIds || documentIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document type and document IDs are required' },
          { status: 400 }
        )
      }

      const preview = await printService.generateBatchPreview({
        documentType,
        documentIds,
        templateId,
        userRole: user.role,
        userCompanyId: user.companyId,
      })

      return NextResponse.json({
        success: true,
        data: preview,
      })
    } catch (error: any) {
      console.error('Error generating batch preview:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to generate batch preview' },
        { status: 500 }
      )
    }
  },

  // ==================== Receipt Print Logs ====================

  // GET - جلب سجلات طباعة الإيصالات
  async getReceiptPrintLogs(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        companyId: searchParams.get('companyId') || undefined,
        invoiceId: searchParams.get('invoiceId') || undefined,
        installmentId: searchParams.get('installmentId') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
      }

      const logs = await printService.getReceiptPrintLogs(params)
      return NextResponse.json(logs)
    } catch (error: any) {
      console.error('Error fetching receipt print logs:', error)
      return NextResponse.json({ error: 'Failed to fetch receipt print logs' }, { status: 500 })
    }
  },

  // POST - إنشاء سجل طباعة إيصال
  async createReceiptPrintLog(request: NextRequest) {
    try {
      const data = await request.json()
      const printLog = await printService.createReceiptPrintLog(data)
      return NextResponse.json(printLog, { status: 201 })
    } catch (error: any) {
      console.error('Error logging receipt print:', error)
      return NextResponse.json({ error: 'Failed to log receipt print' }, { status: 500 })
    }
  },
}
