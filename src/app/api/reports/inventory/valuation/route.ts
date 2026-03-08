/**
 * Inventory Valuation Report API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { inventoryValuationController } from '@/controllers/report.controller'

export async function GET(request: NextRequest) {
  return inventoryValuationController.getReport(request)
}
