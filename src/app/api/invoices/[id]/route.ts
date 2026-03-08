/**
 * Invoices [id] API Route - MVC
 */

import { NextRequest } from 'next/server'
import { invoiceController } from '@/controllers/invoice.controller'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return invoiceController.getInvoiceById(request, id)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return invoiceController.deleteInvoice(request, id)
}
