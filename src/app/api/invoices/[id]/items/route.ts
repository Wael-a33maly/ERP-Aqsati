/**
 * Invoice Items API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { invoiceController } from '@/controllers/invoice.controller'

// GET /api/invoices/[id]/items - Get invoice items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return invoiceController.getInvoiceItems(request, id)
}

// POST /api/invoices/[id]/items - Add item to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return invoiceController.addInvoiceItem(request, id)
}

// PUT /api/invoices/[id]/items - Update item in invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return invoiceController.updateInvoiceItem(request, id)
}

// DELETE /api/invoices/[id]/items - Remove item from invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return invoiceController.deleteInvoiceItem(request, id)
}
