/**
 * Generate Report API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { reportController } from '@/controllers/report.controller'

// GET /api/reports/generate - Get generated reports history
export async function GET(request: NextRequest) {
  return reportController.getGeneratedReports(request)
}

// POST /api/reports/generate - Generate a new report
export async function POST(request: NextRequest) {
  return reportController.generateReport(request)
}
