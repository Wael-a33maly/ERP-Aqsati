import { NextRequest, NextResponse } from 'next/server'
import { inventoryController } from '@/controllers/inventory.controller'

// GET - جلب المخزون
export async function GET(request: NextRequest) {
  return inventoryController.getInventory(request)
}
