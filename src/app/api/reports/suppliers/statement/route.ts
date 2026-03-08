/**
 * Supplier Statement API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { supplierController } from '@/controllers/supplier.controller'

// GET - تقرير كشف حساب مورد
export async function GET(request: NextRequest) {
  return supplierController.getSupplierStatement(request)
}
