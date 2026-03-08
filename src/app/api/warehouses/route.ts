import { NextRequest, NextResponse } from 'next/server'
import { warehouseController } from '@/controllers/warehouse.controller'

// GET - جلب جميع المخازن
export async function GET(request: NextRequest) {
  return warehouseController.getWarehouses(request)
}

// POST - إنشاء مخزن جديد
export async function POST(request: NextRequest) {
  return warehouseController.createWarehouse(request)
}

// PUT - تحديث مخزن
export async function PUT(request: NextRequest) {
  return warehouseController.updateWarehouse(request)
}

// DELETE - حذف مخزن
export async function DELETE(request: NextRequest) {
  return warehouseController.deleteWarehouse(request)
}
