import { NextRequest, NextResponse } from 'next/server'
import { returnsController } from '@/controllers/returns.controller'

// GET - جلب المرتجعات
export async function GET(request: NextRequest) {
  return returnsController.getReturns(request)
}

// POST - إنشاء مرتجع
export async function POST(request: NextRequest) {
  return returnsController.createReturn(request)
}
