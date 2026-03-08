import { NextRequest, NextResponse } from 'next/server'
import { returnsController } from '@/controllers/returns.controller'

// GET - جلب عناصر مرتجع
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return returnsController.getReturnItems(id)
}
