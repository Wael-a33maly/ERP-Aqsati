/**
 * Inventory Transfers API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { inventoryTransferController } from '@/controllers/inventory-transfer.controller'

export async function GET(request: NextRequest) {
  return inventoryTransferController.getTransfers(request)
}

export async function POST(request: NextRequest) {
  return inventoryTransferController.createTransfer(request)
}
