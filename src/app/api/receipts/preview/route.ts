/**
 * Receipts Preview API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { receiptPreviewController } from '@/controllers/receipt-preview.controller'

export async function GET(request: NextRequest) {
  return receiptPreviewController.getPreviews(request)
}
