import { NextRequest, NextResponse } from 'next/server'
import { printController } from '@/controllers/print.controller'

// GET - جلب مهام الطباعة
export async function GET(request: NextRequest) {
  return printController.getPrintJobs(request)
}

// POST - إنشاء مهمة طباعة جديدة
export async function POST(request: NextRequest) {
  return printController.createPrintJob(request)
}

// PUT - تحديث حالة مهمة طباعة
export async function PUT(request: NextRequest) {
  return printController.updatePrintJob(request)
}
