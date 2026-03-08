/**
 * Purchase Returns API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { purchaseReturnController } from '@/controllers/purchase.controller'

// GET - جلب جميع مرتجعات المشتريات
export async function GET(request: NextRequest) {
  return purchaseReturnController.getReturns(request)
}

// POST - إنشاء مرتجع مشتريات جديد
export async function POST(request: NextRequest) {
  return purchaseReturnController.createReturn(request)
}
