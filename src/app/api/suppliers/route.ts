/**
 * Suppliers API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { supplierController } from '@/controllers/supplier.controller'

// GET - جلب جميع الموردين
export async function GET(request: NextRequest) {
  return supplierController.getSuppliers(request)
}

// POST - إنشاء مورد جديد
export async function POST(request: NextRequest) {
  return supplierController.createSupplier(request)
}
