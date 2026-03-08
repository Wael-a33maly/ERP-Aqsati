/**
 * Supplier by ID API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { supplierController } from '@/controllers/supplier.controller'

// GET - جلب مورد بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  url.searchParams.set('id', id)
  const newRequest = new Request(url, request) as NextRequest
  return supplierController.getSupplier(newRequest)
}

// PUT - تحديث مورد
export async function PUT(request: NextRequest) {
  return supplierController.updateSupplier(request)
}

// DELETE - حذف مورد
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  url.searchParams.set('id', id)
  const newRequest = new Request(url, request) as NextRequest
  return supplierController.deleteSupplier(newRequest)
}
