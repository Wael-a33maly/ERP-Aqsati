import { NextRequest, NextResponse } from 'next/server'
import { inventoryController } from '@/controllers/inventory.controller'

// GET - جلب حركات المخزون
export async function GET(request: NextRequest) {
  return inventoryController.getMovements(request)
}

// POST - تعديل المخزون
export async function POST(request: NextRequest) {
  return inventoryController.adjustInventory(request)
}
