import { NextRequest, NextResponse } from 'next/server'
import { syncController } from '@/controllers/sync.controller'

// POST - معالجة طلبات المزامنة
export async function POST(request: NextRequest) {
  return syncController.processSync(request)
}

// GET - الحصول على حالة المزامنة
export async function GET(request: NextRequest) {
  return syncController.getSyncStatus(request)
}
