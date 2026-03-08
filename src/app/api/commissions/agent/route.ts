import { NextRequest, NextResponse } from 'next/server'
import { commissionController } from '@/controllers/commission.controller'

// GET - جلب عمولات المندوب
export async function GET(request: NextRequest) {
  return commissionController.getAgentCommissions(request)
}
