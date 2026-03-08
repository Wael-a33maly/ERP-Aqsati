/**
 * City by ID API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { cityController } from '@/controllers/location.controller'

// GET - جلب مدينة واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return cityController.getById(id)
}

// PUT - تحديث مدينة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return cityController.update(request, id)
}

// DELETE - حذف مدينة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return cityController.delete(id)
}
