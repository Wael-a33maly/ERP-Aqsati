import { NextRequest, NextResponse } from 'next/server'
import { dashboardController } from '@/controllers/dashboard.controller'

// GET - جلب إحصائيات لوحة التحكم
export async function GET(request: NextRequest) {
  return dashboardController.getStats(request)
}
