/**
 * Sales Report API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { salesReportController } from '@/controllers/report.controller'

// GET /api/reports/sales - Sales report with multiple views
export async function GET(request: NextRequest) {
  return salesReportController.getReport(request)
}
