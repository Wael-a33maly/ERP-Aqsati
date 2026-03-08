/**
 * Receipt Preview Controller
 * متحكم معاينة الإيصالات
 */

import { NextRequest, NextResponse } from 'next/server'
import { receiptPreviewService } from '@/services/receipt-preview.service'

export const receiptPreviewController = {
  /**
   * GET - معاينة الإيصالات
   */
  async getPreviews(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        branchId: searchParams.get('branchId') || undefined,
        agentId: searchParams.get('agentId') || undefined,
        customerId: searchParams.get('customerId') || undefined,
        customerCodeFrom: searchParams.get('customerCodeFrom') || undefined,
        customerCodeTo: searchParams.get('customerCodeTo') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        companyId: searchParams.get('companyId') || undefined
      }

      const result = await receiptPreviewService.getPreviews(params)

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error fetching receipts:', error)
      return NextResponse.json({
        success: false,
        error: 'حدث خطأ أثناء جلب البيانات'
      }, { status: 500 })
    }
  }
}
