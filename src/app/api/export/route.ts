import { NextRequest, NextResponse } from 'next/server'
import { exportController } from '@/controllers/export.controller'

// POST - تصدير البيانات
export async function POST(request: NextRequest) {
  return exportController.exportData(request)
}
