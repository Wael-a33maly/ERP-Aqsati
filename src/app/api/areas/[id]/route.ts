/**
 * Area by ID API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { areaController } from '@/controllers/location.controller'

// GET - جلب منطقة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return areaController.getById(id)
}

// PUT - تحديث منطقة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return areaController.update(request, id)
}

// DELETE - حذف منطقة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return areaController.delete(id)
}
