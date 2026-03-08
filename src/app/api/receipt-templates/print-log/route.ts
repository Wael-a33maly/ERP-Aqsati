/**
 * Receipt Print Log API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { printLogController } from '@/controllers/receipt-template.controller'

export async function GET(request: NextRequest) {
  return printLogController.getLogs(request)
}

export async function POST(request: NextRequest) {
  return printLogController.createLog(request)
}
