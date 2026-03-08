// ============================================
// Export Service - خدمة التصدير
// ============================================

import { exportRepository } from '@/repositories/export.repository'
import { 
  ExportOptions, 
  ExportResponse,
  ArabicColumnNames,
  ArabicEntityNames 
} from '@/models/export.model'

export const exportService = {
  // تصدير البيانات
  async exportData(options: ExportOptions): Promise<ExportResponse> {
    // جلب البيانات
    const data = await exportRepository.fetchData(options.entity, options.filters)
    
    if (!data || data.length === 0) {
      throw new Error('لا توجد بيانات للتصدير')
    }

    // تحديد الأعمدة
    const columns = options.columns || Object.keys(data[0])

    // التحويل للتنسيق المطلوب
    switch (options.format) {
      case 'excel':
        return this.exportToExcel(data, columns, options)
      case 'pdf':
        return this.exportToPDF(data, columns, options)
      case 'csv':
        return this.exportToCSV(data, columns, options)
      case 'json':
        return this.exportToJSON(data, options)
      default:
        throw new Error('تنسيق غير مدعوم')
    }
  },

  // تصدير إلى Excel (CSV مع BOM)
  exportToExcel(data: any[], columns: string[], options: ExportOptions): ExportResponse {
    const processedData = data.map(row => this.processRow(row, columns))
    const headers = columns.map(col => this.getArabicColumnName(col))
    const rows = processedData.map(row => 
      columns.map(col => this.formatValue(row[col])).join('\t')
    )

    const BOM = '\uFEFF'
    const csvContent = BOM + [
      headers.join('\t'),
      ...rows
    ].join('\n')

    return {
      success: true,
      data: csvContent,
      filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.xls`,
      mimeType: 'application/vnd.ms-excel; charset=utf-8'
    }
  },

  // تصدير إلى PDF (HTML)
  exportToPDF(data: any[], columns: string[], options: ExportOptions): ExportResponse {
    const processedData = data.map(row => this.processRow(row, columns))
    const headers = columns.map(col => this.getArabicColumnName(col))

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${options.title || this.getArabicEntityName(options.entity)}</title>
        <style>
          * { font-family: 'Noto Sans Arabic', Arial, sans-serif; }
          body { padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .report-title { font-size: 18px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #3b82f6; color: white; padding: 12px 8px; text-align: right; }
          td { padding: 10px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          ${options.companyName ? `<div class="company-name">${options.companyName}</div>` : ''}
          <div class="report-title">${options.title || this.getArabicEntityName(options.entity)}</div>
        </div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${processedData.map(row => `
              <tr>${columns.map(col => `<td>${this.formatValueForPDF(row[col])}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    return {
      success: true,
      data: html,
      filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.html`,
      mimeType: 'text/html; charset=utf-8'
    }
  },

  // تصدير إلى CSV
  exportToCSV(data: any[], columns: string[], options: ExportOptions): ExportResponse {
    const processedData = data.map(row => this.processRow(row, columns))
    const headers = columns.map(col => this.getArabicColumnName(col))
    const rows = processedData.map(row => 
      columns.map(col => {
        const value = this.formatValue(row[col])
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )

    const BOM = '\uFEFF'
    const csvContent = BOM + [
      options.includeHeaders !== false ? headers.join(',') : '',
      ...rows
    ].join('\n')

    return {
      success: true,
      data: csvContent,
      filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv; charset=utf-8'
    }
  },

  // تصدير إلى JSON
  exportToJSON(data: any[], options: ExportOptions): ExportResponse {
    const processedData = data.map(row => this.processRow(row, Object.keys(row)))

    return {
      success: true,
      data: JSON.stringify(processedData, null, 2),
      filename: `${options.entity}_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json; charset=utf-8'
    }
  },

  // Helper functions
  processRow(row: any, columns: string[]): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const col of columns) {
      if (col.includes('.')) {
        const parts = col.split('.')
        let value = row
        for (const part of parts) {
          value = value?.[part]
        }
        result[col] = value
      } else {
        result[col] = row[col]
      }
    }
    
    return result
  },

  getArabicColumnName(col: string): string {
    if (col.includes('.')) {
      const parts = col.split('.')
      return parts.map(p => ArabicColumnNames[p] || p).join(' ')
    }
    return ArabicColumnNames[col] || col
  },

  getArabicEntityName(entity: string): string {
    return ArabicEntityNames[entity] || entity
  },

  formatValue(value: any): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toLocaleDateString('ar-EG')
      if (value.name) return value.name
      if (value.nameAr) return value.nameAr
      return JSON.stringify(value)
    }
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا'
    if (typeof value === 'number') return value.toLocaleString('ar-EG')
    return String(value)
  },

  formatValueForPDF(value: any): string {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toLocaleDateString('ar-EG')
      if (value.name) return value.name
      return '-'
    }
    if (typeof value === 'boolean') {
      return value 
        ? '<span style="color: green;">✓ نعم</span>' 
        : '<span style="color: red;">✗ لا</span>'
    }
    if (typeof value === 'number') return value.toLocaleString('ar-EG')
    return String(value)
  },
}
