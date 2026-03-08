/**
 * Purchase Return by ID API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { purchaseReturnController } from '@/controllers/purchase.controller'

// GET - جلب مرتجع مشتريات بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return purchaseReturnController.getReturn(request, { params })
}

// PUT - تحديث مرتجع مشتريات
export async function PUT(request: NextRequest) {
  return purchaseReturnController.updateReturn(request)
}

// DELETE - حذف مرتجع مشتريات
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return purchaseReturnController.deleteReturn(request, { params })
}
