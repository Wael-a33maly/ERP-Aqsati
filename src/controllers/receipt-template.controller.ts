/**
 * Receipt Template Controller
 * متحكم قوالب الإيصالات
 */

import { NextRequest, NextResponse } from 'next/server'
import { receiptTemplateService } from '@/services/receipt-template.service'

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
