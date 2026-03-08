/**
 * Purchase Invoice by ID API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { purchaseInvoiceController } from '@/controllers/purchase.controller'

// GET - جلب فاتورة مشتريات بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return purchaseInvoiceController.getInvoice(request, { params })
}

// PUT - تحديث فاتورة مشتريات
export async function PUT(request: NextRequest) {
  return purchaseInvoiceController.updateInvoice(request)
}

// DELETE - حذف فاتورة مشتريات
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return purchaseInvoiceController.deleteInvoice(request, { params })
}
