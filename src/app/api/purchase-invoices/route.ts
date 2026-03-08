/**
 * Purchase Invoices API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { purchaseInvoiceController } from '@/controllers/purchase.controller'

// GET - جلب جميع فواتير المشتريات
export async function GET(request: NextRequest) {
  return purchaseInvoiceController.getInvoices(request)
}

// POST - إنشاء فاتورة مشتريات جديدة
export async function POST(request: NextRequest) {
  return purchaseInvoiceController.createInvoice(request)
}
