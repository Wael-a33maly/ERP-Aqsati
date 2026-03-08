/**
 * Receipt Prints API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { printController } from '@/controllers/print.controller'

// GET - Get receipt print logs
export async function GET(request: NextRequest) {
  return printController.getReceiptPrintLogs(request)
}

// POST - Log a receipt print
export async function POST(request: NextRequest) {
  return printController.createReceiptPrintLog(request)
}
