/**
 * Collection Report API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { collectionReportController } from '@/controllers/report.controller'

// GET /api/reports/collection - Collection report with multiple views
export async function GET(request: NextRequest) {
  return collectionReportController.getReport(request)
}
