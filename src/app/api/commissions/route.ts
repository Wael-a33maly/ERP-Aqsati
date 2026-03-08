import { NextRequest, NextResponse } from 'next/server'
import { commissionController } from '@/controllers/commission.controller'

// GET - جلب العمولات
export async function GET(request: NextRequest) {
  return commissionController.getCommissions(request)
}
