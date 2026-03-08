/**
 * Inventory Report API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { inventoryReportController } from '@/controllers/report.controller'

// GET /api/reports/inventory - Inventory report with multiple views
export async function GET(request: NextRequest) {
  return inventoryReportController.getReport(request)
}
