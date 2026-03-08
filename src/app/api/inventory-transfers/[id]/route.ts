/**
 * Inventory Transfers [id] API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { inventoryTransferController } from '@/controllers/inventory-transfer.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return inventoryTransferController.getTransferById(request, id)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  if (body.action === 'approve') {
    return inventoryTransferController.approveTransfer(request, id)
  } else if (body.action === 'cancel') {
    return inventoryTransferController.cancelTransfer(request, id)
  }

  return new Response(JSON.stringify({ success: false, error: 'إجراء غير صالح' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  })
}
