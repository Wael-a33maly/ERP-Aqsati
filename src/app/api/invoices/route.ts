/**
 * Invoices API Route - MVC
 */

import { NextRequest } from 'next/server'
import { invoiceController } from '@/controllers/invoice.controller'

export async function GET(request: NextRequest) {
  return invoiceController.getInvoices(request)
}

export async function POST(request: NextRequest) {
  return invoiceController.createInvoice(request)
}
