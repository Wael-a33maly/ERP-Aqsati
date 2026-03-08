import { NextRequest, NextResponse } from 'next/server'
import { zoneController } from '@/controllers/zone.controller'

// GET - جلب منطقة بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return zoneController.getZone(id)
}

// PUT - تحديث منطقة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return zoneController.updateZone(id, request)
}

// DELETE - حذف منطقة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return zoneController.deleteZone(id)
}
