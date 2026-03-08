// ============================================
// Export Controller - متحكم التصدير
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { exportService } from '@/services/export.service'
import { ExportOptions } from '@/models/export.model'

export const exportController = {
  // POST - تصدير البيانات
  async exportData(request: NextRequest) {
    try {
      const body = await request.json()

      const options: ExportOptions = {
        format: body.format || 'csv',
        entity: body.entity,
        filters: body.filters,
        columns: body.columns,
        includeHeaders: body.includeHeaders ?? true,
        rtl: body.rtl ?? true,
        title: body.title,
        companyName: body.companyName,
      }

      const result = await exportService.exportData(options)

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Export error:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'حدث خطأ أثناء التصدير' },
        { status: 500 }
      )
    }
  },
}
