/**
 * Governorate by ID API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { governorateController } from '@/controllers/location.controller'

// GET - جلب محافظة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return governorateController.getById(id)
}

// PUT - تحديث محافظة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return governorateController.update(request, id)
}

// DELETE - حذف محافظة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return governorateController.delete(id)
}
